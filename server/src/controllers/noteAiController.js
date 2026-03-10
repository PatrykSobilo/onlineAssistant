const { Note, NoteCategory, NoteSubCategory } = require('../models');
const aiService = require('../services/aiService');
const { organizeNotesWithAI } = require('../services/noteOrganizer');

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

// AI-based merging of notes in a category
exports.aiMergeNotes = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user.id;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    console.log(`🔗 Starting AI merge for category ${categoryId}...`);

    const category = await NoteCategory.findOne({
      where: { id: categoryId, userId, isActive: true }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const notes = await Note.findAll({
      where: { 
        userId, 
        noteCategoryId: categoryId,
        wasMerged: false
      },
      order: [['createdAt', 'ASC']]
    });

    if (notes.length < 2) {
      return res.status(400).json({ 
        message: 'Potrzeba co najmniej 2 notatek do połączenia' 
      });
    }

    const subcategories = await NoteSubCategory.findAll({
      where: { userId, categoryId, isActive: true },
      attributes: ['id', 'name', 'level', 'parentSubCategoryId']
    });

    const buildStructure = (parentId = null, level = 1) => {
      const children = subcategories.filter(
        s => s.parentSubCategoryId === parentId && s.level === level
      );
      return children.map(child => ({
        id: child.id,
        name: child.name,
        level: child.level,
        children: buildStructure(child.id, level + 1)
      }));
    };

    const subcategoryStructure = buildStructure();

    const notesData = notes.map(note => ({
      id: note.id,
      content: note.content,
      tags: note.tags || [],
      createdAt: note.createdAt,
      subcategoryId1: note.noteSubCategoryId1,
      subcategoryId2: note.noteSubCategoryId2,
      subcategoryId3: note.noteSubCategoryId3,
      subcategoryId4: note.noteSubCategoryId4,
      subcategoryId5: note.noteSubCategoryId5
    }));

    const prompt = `Jesteś asystentem do organizacji notatek. Otrzymujesz listę notatek z kategorii "${category.name}".

Struktura podkategorii:
${JSON.stringify(subcategoryStructure, null, 2)}

Notatki do przeanalizowania:
${notesData.map((n, idx) => `
Notatka #${idx + 1} (ID: ${n.id}):
Treść: ${n.content}
Tagi: ${Array.isArray(n.tags) && n.tags.length > 0 ? n.tags.join(', ') : 'brak'}
Data: ${n.createdAt}
`).join('\n')}

ZADANIE:
Przeanalizuj te notatki i znajdź te, które można sensownie połączyć w większe, spójne notatki.
Staraj się robić jak najmniejszą ingerencję - łącz tylko notatki, które dotyczą tego samego tematu/kontekstu.
Nie zmieniaj zbyt mocno treści - zachowaj informacje ze wszystkich połączonych notatek.

Zwróć tablicę połączeń w formacie JSON:
[
  {
    "noteIds": [1, 3, 7],
    "mergedContent": "Połączona treść zachowująca wszystkie informacje...",
    "subcategoryId": 123,
    "tags": ["tag1", "tag2"]
  }
]

WAŻNE:
- Każda notatka może być użyta tylko RAZ
- Jeśli notatka nie pasuje do żadnej grupy, pomiń ją (nie zwracaj)
- subcategoryId musi być z dostępnej struktury podkategorii
- Jeśli nie ma sensownego miejsca, użyj null
- Zwróć TYLKO tablicę JSON, bez dodatkowych komentarzy

Jeśli nie ma notatek do połączenia, zwróć pustą tablicę: []`;

    console.log('🤖 Sending to AI for merging...');
    const aiResponse = await aiService.chatWithAI(prompt);
    console.log('🤖 AI Response:', aiResponse);

    let mergeGroups;
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mergeGroups = JSON.parse(jsonMatch[0]);
      } else {
        mergeGroups = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({ 
        message: 'AI response could not be parsed',
        aiResponse: aiResponse.substring(0, 500)
      });
    }

    if (!Array.isArray(mergeGroups) || mergeGroups.length === 0) {
      return res.json({ 
        message: 'Nie znaleziono notatek do połączenia',
        mergedCount: 0
      });
    }

    console.log(`✅ Found ${mergeGroups.length} merge groups`);

    const results = [];
    let totalMerged = 0;

    for (const group of mergeGroups) {
      const { noteIds, mergedContent, subcategoryId, tags } = group;

      if (!Array.isArray(noteIds) || noteIds.length < 2) {
        console.log('⚠️ Skipping group - need at least 2 notes');
        continue;
      }

      const notesToMerge = await Note.findAll({
        where: { 
          id: noteIds, 
          userId, 
          noteCategoryId: categoryId 
        }
      });

      if (notesToMerge.length !== noteIds.length) {
        console.log('⚠️ Skipping group - some notes not found');
        continue;
      }

      let subcategoryPath = {};
      if (subcategoryId) {
        const targetSub = subcategories.find(s => s.id === subcategoryId);
        if (targetSub) {
          const path = [targetSub];
          let current = targetSub;
          
          while (current.parentSubCategoryId) {
            current = subcategories.find(s => s.id === current.parentSubCategoryId);
            if (current) path.unshift(current);
            else break;
          }
          
          path.forEach((sub, idx) => {
            subcategoryPath[`noteSubCategoryId${idx + 1}`] = sub.id;
          });
        }
      } else {
        let unassigned = await NoteSubCategory.findOne({
          where: {
            userId,
            categoryId,
            parentSubCategoryId: null,
            name: 'Nieprzypisane',
            level: 1,
            isActive: true
          }
        });

        if (!unassigned) {
          unassigned = await NoteSubCategory.create({
            userId,
            categoryId,
            parentSubCategoryId: null,
            level: 1,
            name: 'Nieprzypisane',
            isActive: true,
            isUnlocked: true
          });
        }

        subcategoryPath.noteSubCategoryId1 = unassigned.id;
      }

      const mergedNote = await Note.create({
        userId,
        content: mergedContent,
        noteCategoryId: categoryId,
        ...subcategoryPath,
        tags: tags || [],
        source: 'text',
        language: 'pl',
        wasMerged: true
      });

      await Note.destroy({
        where: { id: noteIds }
      });

      console.log(`✅ Merged ${noteIds.length} notes into note ${mergedNote.id}`);
      
      results.push({
        mergedNoteId: mergedNote.id,
        originalNoteIds: noteIds,
        notesCount: noteIds.length
      });

      totalMerged += noteIds.length;
    }

    res.json({
      message: `Połączono ${totalMerged} notatek w ${results.length} grup`,
      mergedCount: totalMerged,
      groupsCreated: results.length,
      results
    });

  } catch (error) {
    console.error('Error in AI merge:', error);
    res.status(500).json({ 
      message: 'Error merging notes',
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

    const categories = await NoteCategory.findAll({
      where: { userId, isActive: true },
      attributes: ['id', 'name', 'icon', 'color']
    });

    if (categories.length === 0) {
      return res.status(400).json({ 
        message: 'No categories found. Please create a category first.' 
      });
    }

    const subcategories = await NoteSubCategory.findAll({
      where: { userId, isActive: true },
      attributes: ['id', 'name', 'level', 'categoryId', 'parentSubCategoryId']
    });

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

    let noteData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        noteData = JSON.parse(jsonMatch[0]);
      } else {
        noteData = JSON.parse(aiResponse);
      }
      console.log('✅ Parsed AI response:', noteData);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return res.status(500).json({ 
        message: 'AI response could not be parsed',
        aiResponse: aiResponse.substring(0, 500)
      });
    }

    console.log('🔍 Looking for category:', noteData.categoryId, 'in', categories.length, 'categories');
    const category = categories.find(c => c.id === noteData.categoryId);
    if (!category) {
      console.error('❌ AI selected invalid category:', noteData.categoryId);
      return res.status(500).json({ 
        message: 'AI selected invalid category' 
      });
    }
    console.log('✅ Found category:', category.name);

    let subcategoryPath = {};
    console.log('🔍 Processing subcategory, AI selected:', noteData.subcategoryId);
    
    if (noteData.subcategoryId) {
      console.log('🔍 Looking for subcategory in', subcategories.length, 'subcategories');
      const targetSub = subcategories.find(s => s.id === noteData.subcategoryId);
      
      if (targetSub) {
        console.log('✅ Found subcategory:', targetSub.name, 'at level', targetSub.level);
        const path = [targetSub];
        let current = targetSub;
        
        while (current.parentSubCategoryId) {
          current = subcategories.find(s => s.id === current.parentSubCategoryId);
          if (current) path.unshift(current);
          else break;
        }
        
        console.log('✅ Built path with', path.length, 'levels:', path.map(s => s.name).join(' > '));
        
        path.forEach((sub, idx) => {
          subcategoryPath[`noteSubCategoryId${idx + 1}`] = sub.id;
        });
      } else {
        console.log('❌ Subcategory not found, will create Nieprzypisane');
      }
    }
    
    if (!noteData.subcategoryId || !subcategories.find(s => s.id === noteData.subcategoryId)) {
      console.log('🔍 Creating or finding "Nieprzypisane" folder...');
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
        console.log(`✅ Created "Nieprzypisane" folder at level 1 in category "${category.name}"`);
      } else {
        console.log(`✅ Found existing "Nieprzypisane" folder in category "${category.name}"`);
      }

      subcategoryPath.noteSubCategoryId1 = unassigned.id;
    }

    console.log('✅ Subcategory path:', subcategoryPath);
    
    console.log('💾 Creating note with data:', {
      userId,
      content: noteData.noteContent.substring(0, 50) + '...',
      categoryId: noteData.categoryId,
      subcategoryPath,
      tags: noteData.tags
    });
    
    const newNote = await Note.create({
      userId,
      content: noteData.noteContent,
      noteCategoryId: noteData.categoryId,
      ...subcategoryPath,
      tags: noteData.tags || [],
      source: 'text',
      language: 'pl'
    });

    console.log('✅ Note created with ID:', newNote.id);
    
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

    console.log('✅ Fetched complete note, sending response...');
    
    res.status(201).json({
      message: 'Note created successfully by AI',
      note: createdNote
    });

    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('Error in AI note creation:', error);
    res.status(500).json({ 
      message: 'Error creating note with AI',
      error: error.message 
    });
  }
};
