const { Note, NoteCategory, NoteSubCategory, User } = require('../models');
const { Op } = require('sequelize');

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
