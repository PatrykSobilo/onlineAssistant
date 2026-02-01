const { Discussion, Message } = require('../models');
const { chatWithAI } = require('../services/aiService');

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
    const { title } = req.body;

    const discussion = await Discussion.create({
      userId: req.user.id,
      title: title || 'Nowa rozmowa',
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

    // Get AI response
    let aiResponse;
    try {
      aiResponse = await chatWithAI(content);
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
