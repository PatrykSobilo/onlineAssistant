const { Discussion, Message, Note, NoteCategory, NoteSubCategory } = require('../models');
const { chatWithAI } = require('../services/aiService');

// Helper function to get all subcategory IDs recursively
const getAllSubCategoryIds = async (subCategoryId) => {
  const ids = [subCategoryId];
  
  const children = await NoteSubCategory.findAll({
    where: { parentSubCategoryId: subCategoryId, isActive: true },
    attributes: ['id']
  });

  for (const child of children) {
    const childIds = await getAllSubCategoryIds(child.id);
    ids.push(...childIds);
  }

  return ids;
};

// Helper function to get notes based on discussion context
const getContextNotes = async (discussion) => {
  if (!discussion.noteCategoryId) {
    return [];
  }

  let whereClause = {
    userId: discussion.userId
  };

  if (discussion.noteSubCategoryId) {
    // For now, get all notes from the category that have the subcategory in any level
    // This is simplified - you could make it more sophisticated
    const { Op } = require('sequelize');
    whereClause.noteCategoryId = discussion.noteCategoryId;
    whereClause[Op.or] = [
      { noteSubCategoryId1: discussion.noteSubCategoryId },
      { noteSubCategoryId2: discussion.noteSubCategoryId },
      { noteSubCategoryId3: discussion.noteSubCategoryId },
      { noteSubCategoryId4: discussion.noteSubCategoryId },
      { noteSubCategoryId5: discussion.noteSubCategoryId }
    ];
  } else {
    // Get all notes from category
    whereClause.noteCategoryId = discussion.noteCategoryId;
  }

  const notes = await Note.findAll({
    where: whereClause,
    include: [
      {
        model: NoteCategory,
        as: 'category',
        attributes: ['name', 'icon']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 50 // Limit to prevent too much context
  });

  return notes;
};

// Get all discussions for current user
exports.getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.findAll({
      where: {
        userId: req.user.id,
        isActive: true
      },
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
      include: [{
        model: Message,
        as: 'messages',
        limit: 1,
        order: [['createdAt', 'DESC']]
      }]
    });

    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error.message);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
};

// Get single discussion with all messages
exports.getDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discussion = await Discussion.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true
      },
      include: [{
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }]
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    res.json(discussion);
  } catch (error) {
    console.error('Error fetching discussion:', error.message);
    res.status(500).json({ error: 'Failed to fetch discussion' });
  }
};

// Create new discussion
exports.createDiscussion = async (req, res) => {
  try {
    const { title, noteCategoryId, noteSubCategoryId, contextLevel } = req.body;

    const discussion = await Discussion.create({
      userId: req.user.id,
      title: title || 'Nowa rozmowa',
      noteCategoryId: noteCategoryId || null,
      noteSubCategoryId: noteSubCategoryId || null,
      contextLevel: contextLevel || 1,
      lastMessageAt: new Date()
    });

    res.status(201).json(discussion);
  } catch (error) {
    console.error('Error creating discussion:', error.message);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
};

// Send message in discussion
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if discussion exists and belongs to user
    const discussion = await Discussion.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Save user message
    const userMessage = await Message.create({
      discussionId: id,
      role: 'user',
      content: content.trim()
    });

    // Get previous messages for context
    const previousMessages = await Message.findAll({
      where: { discussionId: id },
      order: [['createdAt', 'ASC']],
      limit: 20 // Last 20 messages
    });

    // Get notes from context
    const contextNotes = await getContextNotes(discussion);

    // Build system prompt
    let systemPrompt = `Jesteś inteligentnym asystentem osobistym, który pomaga użytkownikowi na podstawie jego notatek.

ZASADY:
1. W PIERWSZEJ KOLEJNOŚCI wykorzystuj informacje z notatek użytkownika (jeśli są dostępne)
2. Jeśli notatki nie zawierają wystarczających informacji, MOŻESZ i POWINIENEŚ korzystać ze swojej ogólnej wiedzy
3. Gdy korzystasz z własnej wiedzy, wyraźnie to zaznacz (np. "Na podstawie ogólnej wiedzy...", "Mogę polecić...")
4. Bądź pomocny, konkretny i naturalny w komunikacji
5. Jeśli użytkownik pyta o coś spoza notatek, nie mów że "nie masz informacji" - użyj swojej wiedzy!

`;

    // Build context for AI
    let contextText = '';
    
    if (contextNotes.length > 0) {
      contextText = '\n=== NOTATKI UŻYTKOWNIKA (Kontekst: ' + discussion.title + ') ===\n';
      contextText += `Dostępnych notatek: ${contextNotes.length}\n\n`;
      
      contextNotes.forEach((note, idx) => {
        const categoryPath = note.category ? `${note.category.icon} ${note.category.name}` : '';
        contextText += `[Notatka ${idx + 1}] ${categoryPath}\n`;
        contextText += `${note.content}\n\n`;
      });
      
      contextText += '=== KONIEC NOTATEK ===\n\n';
    } else {
      contextText = '\n(Brak notatek w tym kontekście - możesz odpowiedzieć na podstawie ogólnej wiedzy)\n\n';
    }

    // Build conversation history
    let conversationHistory = '';
    if (previousMessages.length > 1) { // More than just the current message
      conversationHistory = '=== HISTORIA ROZMOWY ===\n';
      previousMessages.slice(0, -1).forEach(msg => { // Exclude the current message
        conversationHistory += `${msg.role === 'user' ? 'Użytkownik' : 'Asystent'}: ${msg.content}\n`;
      });
      conversationHistory += '=== KONIEC HISTORII ===\n\n';
    }

    // Prepare full prompt for AI
    const fullPrompt = systemPrompt + contextText + conversationHistory + 'Pytanie użytkownika: ' + content + '\n\nTwoja odpowiedź:';

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await chatWithAI(fullPrompt);
    } catch (aiError) {
      console.error('AI Error:', aiError.message);
      aiResponse = 'Przepraszam, wystąpił problem z połączeniem z AI. Spróbuj ponownie później.';
    }

    // Save AI message
    const aiMessage = await Message.create({
      discussionId: id,
      role: 'assistant',
      content: aiResponse
    });

    // Update discussion lastMessageAt
    await discussion.update({
      lastMessageAt: new Date()
    });

    res.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error('Error sending message:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Update discussion title
exports.updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const discussion = await Discussion.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    await discussion.update({ title });

    res.json(discussion);
  } catch (error) {
    console.error('Error updating discussion:', error.message);
    res.status(500).json({ error: 'Failed to update discussion' });
  }
};

// Delete discussion (soft delete)
exports.deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    await discussion.update({ isActive: false });

    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    console.error('Error deleting discussion:', error.message);
    res.status(500).json({ error: 'Failed to delete discussion' });
  }
};
