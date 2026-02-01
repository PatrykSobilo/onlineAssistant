const { Note, NoteCategory, NoteSubCategory, User } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');

// Helper function to auto-organize notes (move to "Nieprzypisane" if needed)
const autoOrganizeNotes = async (userId) => {
  try {
    console.log('🔄 Starting auto-organization of notes...');
    
    // Get all user's categories
    const categories = await NoteCategory.findAll({
      where: { userId, isActive: true }
    });

    for (const category of categories) {
      // Get all subcategories for this category
      const subcategories = await NoteSubCategory.findAll({
        where: {
          userId,
          categoryId: category.id,
          isActive: true
        },
        order: [['level', 'ASC'], ['id', 'ASC']]
      });

      // Group subcategories by parent and level
      const subsByParent = {};
      subcategories.forEach(sub => {
        const parentKey = sub.parentSubCategoryId || 'root';
        if (!subsByParent[parentKey]) {
          subsByParent[parentKey] = [];
        }
        subsByParent[parentKey].push(sub);
      });

      // Check category root level (level 0 - no subcategory at all)
      const hasLevel1 = subcategories.some(s => s.level === 1);
      if (hasLevel1) {
        const rootNotes = await Note.findAll({
          where: {
            userId,
            noteCategoryId: category.id,
            noteSubCategoryId1: null
          }
        });

        if (rootNotes.length > 0) {
          console.log(`Found ${rootNotes.length} notes at category root "${category.name}"`);
          
          let unassigned = await NoteSubCategory.findOne({
            where: {
              userId,
              categoryId: category.id,
              parentSubCategoryId: null,
              name: 'Nieprzypisane',
              level: 1,
              isActive: true
            }
          });

          if (!unassigned) {
            unassigned = await NoteSubCategory.create({
              userId,
              categoryId: category.id,
              parentSubCategoryId: null,
              level: 1,
              name: 'Nieprzypisane',
              isActive: true,
              isUnlocked: true
            });
            console.log(`Created "Nieprzypisane" folder at level 1 in category "${category.name}"`);
          }

          for (const note of rootNotes) {
            await note.update({ noteSubCategoryId1: unassigned.id });
          }
          console.log(`✅ Moved ${rootNotes.length} notes to "Nieprzypisane" at level 1`);
        }
      }

      // Check each subcategory level (1-4) if it has children and notes
      for (const sub of subcategories) {
        if (sub.level >= 5) continue; // Level 5 is the deepest, can't go lower

        // Check if this subcategory has children
        const children = subcategories.filter(s => s.parentSubCategoryId === sub.id);
        
        if (children.length > 0) {
          // This folder has children, so find notes at this level
          const whereClause = {
            userId,
            noteCategoryId: category.id
          };

          // Build proper where clause for finding notes at this exact level
          if (sub.level === 1) {
            whereClause.noteSubCategoryId1 = sub.id;
            whereClause.noteSubCategoryId2 = null;
          } else if (sub.level === 2) {
            whereClause.noteSubCategoryId2 = sub.id;
            whereClause.noteSubCategoryId3 = null;
          } else if (sub.level === 3) {
            whereClause.noteSubCategoryId3 = sub.id;
            whereClause.noteSubCategoryId4 = null;
          } else if (sub.level === 4) {
            whereClause.noteSubCategoryId4 = sub.id;
            whereClause.noteSubCategoryId5 = null;
          }

          const notesAtThisLevel = await Note.findAll({ where: whereClause });

          if (notesAtThisLevel.length > 0) {
            console.log(`Found ${notesAtThisLevel.length} notes at level ${sub.level} in "${sub.name}" (has children)`);
            
            // Create or find "Nieprzypisane" folder as a child
            let unassigned = await NoteSubCategory.findOne({
              where: {
                userId,
                categoryId: category.id,
                parentSubCategoryId: sub.id,
                name: 'Nieprzypisane',
                level: sub.level + 1,
                isActive: true
              }
            });

            if (!unassigned) {
              unassigned = await NoteSubCategory.create({
                userId,
                categoryId: category.id,
                parentSubCategoryId: sub.id,
                level: sub.level + 1,
                name: 'Nieprzypisane',
                isActive: true,
                isUnlocked: sub.level + 1 < 3
              });
              console.log(`Created "Nieprzypisane" folder at level ${sub.level + 1} under "${sub.name}"`);
            }

            // Move all notes to "Nieprzypisane" folder
            for (const note of notesAtThisLevel) {
              const updates = {};
              
              // When moving to next level, preserve all previous level assignments
              // and add the new level assignment
              if (sub.level === 1) {
                updates.noteSubCategoryId1 = sub.id; // Keep level 1
                updates.noteSubCategoryId2 = unassigned.id; // Add level 2
              } else if (sub.level === 2) {
                updates.noteSubCategoryId2 = sub.id; // Keep level 2
                updates.noteSubCategoryId3 = unassigned.id; // Add level 3
              } else if (sub.level === 3) {
                updates.noteSubCategoryId3 = sub.id; // Keep level 3
                updates.noteSubCategoryId4 = unassigned.id; // Add level 4
              } else if (sub.level === 4) {
                updates.noteSubCategoryId4 = sub.id; // Keep level 4
                updates.noteSubCategoryId5 = unassigned.id; // Add level 5
              }
              
              await note.update(updates);
            }
            
            console.log(`✅ Moved ${notesAtThisLevel.length} notes from level ${sub.level} to "Nieprzypisane" at level ${sub.level + 1}`);
          }
        }
      }
    }
    
    console.log('✅ Auto-organization completed');
  } catch (error) {
    console.error('❌ Error in autoOrganizeNotes:', error);
    // Don't throw - we don't want to break the main request
  }
};

// Pobierz wszystkie notatki użytkownika z filtrowaniem
exports.getNotes = async (req, res) => {
  try {
    // Auto-organize notes before fetching
    await autoOrganizeNotes(req.user.id);

    const { 
      categoryId, 
      subCategoryId1, 
      subCategoryId2, 
      subCategoryId3, 
      subCategoryId4, 
      subCategoryId5,
      tags,
      search,
      source,
      language
    } = req.query;

    const where = { userId: req.user.id };

    // Filtruj po kategorii
    if (categoryId) {
      where.noteCategoryId = categoryId;
    }

    // Filtruj po subkategoriach
    if (subCategoryId1) where.noteSubCategoryId1 = subCategoryId1;
    if (subCategoryId2) where.noteSubCategoryId2 = subCategoryId2;
    if (subCategoryId3) where.noteSubCategoryId3 = subCategoryId3;
    if (subCategoryId4) where.noteSubCategoryId4 = subCategoryId4;
    if (subCategoryId5) where.noteSubCategoryId5 = subCategoryId5;

    // Filtruj po źródle
    if (source) {
      where.source = source;
    }

    // Filtruj po języku
    if (language) {
      where.language = language;
    }

    // Wyszukiwanie w treści
    if (search) {
      where[Op.or] = [
        { content: { [Op.like]: `%${search}%` } },
        { aiResponse: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtruj po tagach (JSON search)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = { [Op.contains]: tagArray };
    }

    const notes = await Note.findAll({
      where,
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'subCategory1',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory2',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory3',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory4',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory5',
          attributes: ['id', 'name', 'level'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania notatek' });
  }
};

// Pobierz pojedynczą notatkę
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'subCategory1',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory2',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory3',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory4',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory5',
          attributes: ['id', 'name', 'level'],
          required: false
        }
      ]
    });

    if (!note) {
      return res.status(404).json({ message: 'Notatka nie została znaleziona' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania notatki' });
  }
};

// Utwórz nową notatkę
exports.createNote = async (req, res) => {
  try {
    const {
      noteCategoryId,
      noteSubCategoryId1,
      noteSubCategoryId2,
      noteSubCategoryId3,
      noteSubCategoryId4,
      noteSubCategoryId5,
      tags,
      content,
      source,
      language,
      aiResponse
    } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Treść notatki jest wymagana' });
    }

    // Sprawdź czy kategoria istnieje (jeśli podano)
    if (noteCategoryId) {
      const category = await NoteCategory.findOne({
        where: {
          id: noteCategoryId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
      }
    }

    // Sprawdź czy wszystkie subkategorie istnieją (jeśli podano)
    const subCategoryIds = [
      noteSubCategoryId1,
      noteSubCategoryId2,
      noteSubCategoryId3,
      noteSubCategoryId4,
      noteSubCategoryId5
    ].filter(id => id !== undefined && id !== null);

    for (const subId of subCategoryIds) {
      const subCategory = await NoteSubCategory.findOne({
        where: {
          id: subId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (!subCategory) {
        return res.status(404).json({ message: `Subkategoria ${subId} nie została znaleziona` });
      }
    }

    // Utwórz notatkę
    const note = await Note.create({
      userId: req.user.id,
      noteCategoryId: noteCategoryId || null,
      noteSubCategoryId1: noteSubCategoryId1 || null,
      noteSubCategoryId2: noteSubCategoryId2 || null,
      noteSubCategoryId3: noteSubCategoryId3 || null,
      noteSubCategoryId4: noteSubCategoryId4 || null,
      noteSubCategoryId5: noteSubCategoryId5 || null,
      tags: tags || [],
      content,
      source: source || 'text',
      language: language || 'pl',
      aiResponse: aiResponse || null
    });

    // Pobierz pełne dane z relacjami
    const fullNote = await Note.findByPk(note.id, {
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'subCategory1',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory2',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory3',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory4',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory5',
          attributes: ['id', 'name', 'level'],
          required: false
        }
      ]
    });

    res.status(201).json(fullNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia notatki' });
  }
};

// Aktualizuj notatkę
exports.updateNote = async (req, res) => {
  try {
    const {
      noteCategoryId,
      noteSubCategoryId1,
      noteSubCategoryId2,
      noteSubCategoryId3,
      noteSubCategoryId4,
      noteSubCategoryId5,
      tags,
      content,
      source,
      language,
      aiResponse
    } = req.body;

    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Notatka nie została znaleziona' });
    }

    // Sprawdź czy nowa kategoria istnieje (jeśli podano)
    if (noteCategoryId !== undefined && noteCategoryId !== null) {
      const category = await NoteCategory.findOne({
        where: {
          id: noteCategoryId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (!category) {
        return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
      }
    }

    // Aktualizuj notatkę
    await note.update({
      noteCategoryId: noteCategoryId !== undefined ? noteCategoryId : note.noteCategoryId,
      noteSubCategoryId1: noteSubCategoryId1 !== undefined ? noteSubCategoryId1 : note.noteSubCategoryId1,
      noteSubCategoryId2: noteSubCategoryId2 !== undefined ? noteSubCategoryId2 : note.noteSubCategoryId2,
      noteSubCategoryId3: noteSubCategoryId3 !== undefined ? noteSubCategoryId3 : note.noteSubCategoryId3,
      noteSubCategoryId4: noteSubCategoryId4 !== undefined ? noteSubCategoryId4 : note.noteSubCategoryId4,
      noteSubCategoryId5: noteSubCategoryId5 !== undefined ? noteSubCategoryId5 : note.noteSubCategoryId5,
      tags: tags !== undefined ? tags : note.tags,
      content: content || note.content,
      source: source || note.source,
      language: language || note.language,
      aiResponse: aiResponse !== undefined ? aiResponse : note.aiResponse
    });

    // Pobierz zaktualizowane dane z relacjami
    const updatedNote = await Note.findByPk(note.id, {
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'subCategory1',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory2',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory3',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory4',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'subCategory5',
          attributes: ['id', 'name', 'level'],
          required: false
        }
      ]
    });

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji notatki' });
  }
};

// Usuń notatkę
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Notatka nie została znaleziona' });
    }

    await note.destroy();

    res.json({ message: 'Notatka została usunięta' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania notatki' });
  }
};

// Pobierz statystyki notatek użytkownika
exports.getNoteStats = async (req, res) => {
  try {
    const totalNotes = await Note.count({
      where: { userId: req.user.id }
    });

    const notesBySource = await Note.findAll({
      where: { userId: req.user.id },
      attributes: [
        'source',
        [Note.sequelize.fn('COUNT', Note.sequelize.col('id')), 'count']
      ],
      group: ['source']
    });

    const notesByCategory = await Note.findAll({
      where: { userId: req.user.id },
      attributes: [
        'noteCategoryId',
        [Note.sequelize.fn('COUNT', Note.sequelize.col('id')), 'count']
      ],
      include: [{
        model: NoteCategory,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      group: ['noteCategoryId', 'category.id']
    });

    res.json({
      totalNotes,
      bySource: notesBySource,
      byCategory: notesByCategory
    });
  } catch (error) {
    console.error('Error fetching note stats:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania statystyk notatek' });
  }
};

// Dodaj tag do notatki
exports.addTag = async (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ message: 'Tag jest wymagany' });
    }

    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Notatka nie została znaleziona' });
    }

    const currentTags = note.tags || [];
    
    if (currentTags.includes(tag)) {
      return res.status(400).json({ message: 'Tag już istnieje' });
    }

    await note.update({
      tags: [...currentTags, tag]
    });

    res.json(note);
  } catch (error) {
    console.error('Error adding tag:', error);
    res.status(500).json({ message: 'Błąd podczas dodawania tagu' });
  }
};

// Usuń tag z notatki
exports.removeTag = async (req, res) => {
  try {
    const { tag } = req.body;

    if (!tag) {
      return res.status(400).json({ message: 'Tag jest wymagany' });
    }

    const note = await Note.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!note) {
      return res.status(404).json({ message: 'Notatka nie została znaleziona' });
    }

    const currentTags = note.tags || [];
    const newTags = currentTags.filter(t => t !== tag);

    await note.update({
      tags: newTags
    });

    res.json(note);
  } catch (error) {
    console.error('Error removing tag:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania tagu' });
  }
};

// Helper function for AI-based note organization
const organizeNotesWithAI = async (userId, categoryId, includeAllNotes = false) => {
  // Get category info
  const category = await NoteCategory.findOne({
    where: { id: categoryId, userId, isActive: true }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Get all subcategories for this category
  const subcategories = await NoteSubCategory.findAll({
    where: {
      userId,
      categoryId,
      isActive: true
    },
    order: [['level', 'ASC'], ['parentSubCategoryId', 'ASC'], ['id', 'ASC']]
  });

  // Build category structure for AI
  const buildStructure = (parentId = null, level = 1) => {
    const children = subcategories.filter(s => s.parentSubCategoryId === parentId && s.level === level);
    return children.map(sub => ({
      id: sub.id,
      name: sub.name,
      level: sub.level,
      children: sub.level < 5 ? buildStructure(sub.id, sub.level + 1) : []
    }));
  };

  const categoryStructure = buildStructure();

  // Get notes to organize
  let notesToOrganize = [];
  
  if (includeAllNotes) {
    // Get ALL notes from this category
    const allNotes = await Note.findAll({
      where: {
        userId,
        noteCategoryId: categoryId
      }
    });
    
    notesToOrganize = allNotes.map(n => ({
      id: n.id,
      content: n.content.substring(0, 500), // Limit content length for AI
      currentSubcategoryId: n.noteSubCategoryId5 || n.noteSubCategoryId4 || n.noteSubCategoryId3 || n.noteSubCategoryId2 || n.noteSubCategoryId1
    }));
  } else {
    // Get only notes from "Nieprzypisane" folders
    const unassignedFolders = subcategories.filter(s => s.name === 'Nieprzypisane');
    
    for (const folder of unassignedFolders) {
      const whereClause = {
        userId,
        noteCategoryId: categoryId
      };
      whereClause[`noteSubCategoryId${folder.level}`] = folder.id;

      const notes = await Note.findAll({ where: whereClause });
      notesToOrganize.push(...notes.map(n => ({
        id: n.id,
        content: n.content.substring(0, 500),
        level: folder.level
      })));
    }
  }

  if (notesToOrganize.length === 0) {
    return {
      message: includeAllNotes ? 'No notes found in this category' : 'No notes in "Nieprzypisane" folders',
      organized: 0,
      total: 0
    };
  }

  // Build prompt for AI
  const prompt = `You are organizing notes into a hierarchical category structure.

Category: ${category.name}

Category Structure (hierarchical subcategories):
${JSON.stringify(categoryStructure, null, 2)}

Notes to organize${includeAllNotes ? ' (all notes from category)' : ' (from "Nieprzypisane" folders)'}:
${notesToOrganize.map((n, idx) => `${idx + 1}. Note ID: ${n.id}\nContent: ${n.content}\n`).join('\n')}

Task: For each note, assign it to the MOST SPECIFIC (deepest level) subcategory that matches its content. Return ONLY a JSON array with this format:
[
  {"noteId": <note_id>, "subcategoryId": <best_matching_subcategory_id>}
]

Rules:
- Choose the deepest/most specific subcategory that fits
- If no good match exists, use the closest parent subcategory
- Return ONLY valid JSON, no explanations
- Include all notes in the response`;

  console.log('🤖 Sending to AI for organization...');
  const aiResponse = await aiService.chatWithAI(prompt);
  console.log('🤖 AI Response:', aiResponse);

  // Parse AI response
  let assignments;
  try {
    // Extract JSON from response (AI might wrap it in markdown)
    const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      assignments = JSON.parse(jsonMatch[0]);
    } else {
      assignments = JSON.parse(aiResponse);
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    throw new Error('AI response could not be parsed: ' + aiResponse.substring(0, 500));
  }

  // Apply assignments
  let organized = 0;
  for (const assignment of assignments) {
    try {
      const note = await Note.findOne({
        where: { id: assignment.noteId, userId }
      });

      if (!note) continue;

      const targetSubcategory = subcategories.find(s => s.id === assignment.subcategoryId);
      if (!targetSubcategory) continue;

      // Build full path to target subcategory
      const updates = {};
      let current = targetSubcategory;
      const path = [current];

      // Build path from target to root
      while (current.parentSubCategoryId) {
        current = subcategories.find(s => s.id === current.parentSubCategoryId);
        if (current) path.unshift(current);
        else break;
      }

      // Set all levels
      path.forEach((sub, idx) => {
        updates[`noteSubCategoryId${idx + 1}`] = sub.id;
      });

      // Clear remaining levels
      for (let i = path.length + 1; i <= 5; i++) {
        updates[`noteSubCategoryId${i}`] = null;
      }

      await note.update(updates);
      organized++;
    } catch (err) {
      console.error(`Error organizing note ${assignment.noteId}:`, err);
    }
  }

  return {
    message: `Successfully organized ${organized} notes`,
    organized,
    total: notesToOrganize.length
  };
};

// AI-based organization of "Nieprzypisane" notes
exports.aiOrganizeUnassigned = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user.id;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const result = await organizeNotesWithAI(userId, categoryId, false);
    res.json(result);

  } catch (error) {
    console.error('Error in AI organization:', error);
    res.status(500).json({ 
      message: 'Error organizing notes',
      error: error.message 
    });
  }
};

// AI-based reorganization of ALL notes in category
exports.aiReorganizeAll = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user.id;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const result = await organizeNotesWithAI(userId, categoryId, true);
    res.json(result);

  } catch (error) {
    console.error('Error in AI reorganization:', error);
    res.status(500).json({ 
      message: 'Error reorganizing notes',
      error: error.message 
    });
  }
};

// AI-based note creation from user input
exports.aiCreateNote = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get all user categories
    const categories = await NoteCategory.findAll({
      where: { userId, isActive: true },
      attributes: ['id', 'name', 'icon', 'color']
    });

    if (categories.length === 0) {
      return res.status(400).json({ 
        message: 'No categories found. Please create a category first.' 
      });
    }

    // Get all subcategories for context
    const subcategories = await NoteSubCategory.findAll({
      where: { userId, isActive: true },
      attributes: ['id', 'name', 'level', 'categoryId', 'parentSubCategoryId']
    });

    // Build category structure
    const categoriesWithStructure = categories.map(cat => {
      const catSubs = subcategories.filter(s => s.categoryId === cat.id);
      
      const buildStructure = (parentId = null, level = 1) => {
        const children = catSubs.filter(s => s.parentSubCategoryId === parentId && s.level === level);
        return children.map(sub => ({
          id: sub.id,
          name: sub.name,
          level: sub.level,
          children: sub.level < 5 ? buildStructure(sub.id, sub.level + 1) : []
        }));
      };

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        subcategories: buildStructure()
      };
    });

    // Build prompt for AI
    const prompt = `You are a smart note-taking assistant. The user said:

"${message}"

Available categories with hierarchical subcategories:
${JSON.stringify(categoriesWithStructure, null, 2)}

Task: Create a note from this message. Return ONLY a JSON object with this format:
{
  "noteContent": "<concise summary of the key information from the message>",
  "categoryId": <the most appropriate category ID>,
  "subcategoryId": <the most specific/deepest subcategory ID that fits, or null if none fit>,
  "tags": ["tag1", "tag2"]
}

Rules:
- noteContent should be clear, concise, and capture key information
- Choose the most relevant categoryId
- If a good subcategory exists, use the deepest/most specific one
- If no subcategory fits well, set subcategoryId to null (we'll create "Nieprzypisane" folder)
- Suggest 1-3 relevant tags
- Return ONLY valid JSON, no explanations`;

    console.log('🤖 Sending to AI to create note...');
    const aiResponse = await aiService.chatWithAI(prompt);
    console.log('🤖 AI Response:', aiResponse);

    // Parse AI response
    let noteData;
    try {
      // Extract JSON from response (AI might wrap it in markdown)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        noteData = JSON.parse(jsonMatch[0]);
      } else {
        noteData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({ 
        message: 'AI response could not be parsed',
        aiResponse: aiResponse.substring(0, 500)
      });
    }

    // Validate category exists
    const category = categories.find(c => c.id === noteData.categoryId);
    if (!category) {
      return res.status(500).json({ 
        message: 'AI selected invalid category' 
      });
    }

    // Handle subcategory assignment
    let subcategoryPath = {};
    
    if (noteData.subcategoryId) {
      // AI selected a subcategory - build full path
      const targetSub = subcategories.find(s => s.id === noteData.subcategoryId);
      
      if (targetSub) {
        const path = [targetSub];
        let current = targetSub;
        
        // Build path from target to root
        while (current.parentSubCategoryId) {
          current = subcategories.find(s => s.id === current.parentSubCategoryId);
          if (current) path.unshift(current);
          else break;
        }
        
        // Set all levels
        path.forEach((sub, idx) => {
          subcategoryPath[`noteSubCategoryId${idx + 1}`] = sub.id;
        });
      }
    } else {
      // No subcategory selected - create or find "Nieprzypisane" at level 1
      let unassigned = await NoteSubCategory.findOne({
        where: {
          userId,
          categoryId: noteData.categoryId,
          parentSubCategoryId: null,
          name: 'Nieprzypisane',
          level: 1,
          isActive: true
        }
      });

      if (!unassigned) {
        unassigned = await NoteSubCategory.create({
          userId,
          categoryId: noteData.categoryId,
          parentSubCategoryId: null,
          level: 1,
          name: 'Nieprzypisane',
          isActive: true,
          isUnlocked: true
        });
        console.log(`Created "Nieprzypisane" folder at level 1 in category "${category.name}"`);
      }

      subcategoryPath.noteSubCategoryId1 = unassigned.id;
    }

    // Create the note
    const newNote = await Note.create({
      userId,
      content: noteData.noteContent,
      noteCategoryId: noteData.categoryId,
      ...subcategoryPath,
      tags: noteData.tags || [],
      source: 'text',
      language: 'pl'
    });

    // Fetch the complete note with associations
    const createdNote = await Note.findOne({
      where: { id: newNote.id },
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['name', 'icon', 'color']
        }
      ]
    });

    res.status(201).json({
      message: 'Note created successfully by AI',
      note: createdNote
    });

  } catch (error) {
    console.error('Error in AI note creation:', error);
    res.status(500).json({ 
      message: 'Error creating note with AI',
      error: error.message 
    });
  }
};
