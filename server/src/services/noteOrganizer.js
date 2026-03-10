const { Note, NoteCategory, NoteSubCategory } = require('../models');
const aiService = require('./aiService');
const { NOTE_CONTENT_PREVIEW_LENGTH } = require('../config/constants');

// Move notes to "Nieprzypisane" folders when their parent folder gains children
const autoOrganizeNotes = async (userId) => {
  try {
    console.log('🔄 Starting auto-organization of notes...');
    
    const categories = await NoteCategory.findAll({
      where: { userId, isActive: true }
    });

    for (const category of categories) {
      const subcategories = await NoteSubCategory.findAll({
        where: {
          userId,
          categoryId: category.id,
          isActive: true
        },
        order: [['level', 'ASC'], ['id', 'ASC']]
      });

      const subsByParent = {};
      subcategories.forEach(sub => {
        const parentKey = sub.parentSubCategoryId || 'root';
        if (!subsByParent[parentKey]) {
          subsByParent[parentKey] = [];
        }
        subsByParent[parentKey].push(sub);
      });

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

      for (const sub of subcategories) {
        if (sub.level >= 5) continue;

        const children = subcategories.filter(s => s.parentSubCategoryId === sub.id);
        
        if (children.length > 0) {
          const whereClause = {
            userId,
            noteCategoryId: category.id
          };

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

            for (const note of notesAtThisLevel) {
              const updates = {};
              if (sub.level === 1) {
                updates.noteSubCategoryId1 = sub.id;
                updates.noteSubCategoryId2 = unassigned.id;
              } else if (sub.level === 2) {
                updates.noteSubCategoryId2 = sub.id;
                updates.noteSubCategoryId3 = unassigned.id;
              } else if (sub.level === 3) {
                updates.noteSubCategoryId3 = sub.id;
                updates.noteSubCategoryId4 = unassigned.id;
              } else if (sub.level === 4) {
                updates.noteSubCategoryId4 = sub.id;
                updates.noteSubCategoryId5 = unassigned.id;
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

// AI-based assignment of notes to the best-matching subcategory
const organizeNotesWithAI = async (userId, categoryId, includeAllNotes = false) => {
  const category = await NoteCategory.findOne({
    where: { id: categoryId, userId, isActive: true }
  });

  if (!category) {
    throw new Error('Category not found');
  }

  const subcategories = await NoteSubCategory.findAll({
    where: {
      userId,
      categoryId,
      isActive: true
    },
    order: [['level', 'ASC'], ['parentSubCategoryId', 'ASC'], ['id', 'ASC']]
  });

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

  let notesToOrganize = [];
  
  if (includeAllNotes) {
    const allNotes = await Note.findAll({
      where: {
        userId,
        noteCategoryId: categoryId
      }
    });
    
    notesToOrganize = allNotes.map(n => ({
      id: n.id,
      content: n.content.substring(0, NOTE_CONTENT_PREVIEW_LENGTH),
      currentSubcategoryId: n.noteSubCategoryId5 || n.noteSubCategoryId4 || n.noteSubCategoryId3 || n.noteSubCategoryId2 || n.noteSubCategoryId1
    }));
  } else {
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
        content: n.content.substring(0, NOTE_CONTENT_PREVIEW_LENGTH),
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

  let assignments;
  try {
    const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      assignments = JSON.parse(jsonMatch[0]);
    } else {
      assignments = JSON.parse(aiResponse);
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    throw new Error('AI response could not be parsed: ' + aiResponse.substring(0, NOTE_CONTENT_PREVIEW_LENGTH));
  }

  let organized = 0;
  for (const assignment of assignments) {
    try {
      const note = await Note.findOne({
        where: { id: assignment.noteId, userId }
      });

      if (!note) continue;

      const targetSubcategory = subcategories.find(s => s.id === assignment.subcategoryId);
      if (!targetSubcategory) continue;

      const updates = {};
      let current = targetSubcategory;
      const path = [current];

      while (current.parentSubCategoryId) {
        current = subcategories.find(s => s.id === current.parentSubCategoryId);
        if (current) path.unshift(current);
        else break;
      }

      path.forEach((sub, idx) => {
        updates[`noteSubCategoryId${idx + 1}`] = sub.id;
      });

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

module.exports = { autoOrganizeNotes, organizeNotesWithAI };
