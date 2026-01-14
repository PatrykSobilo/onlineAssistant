const express = require('express');
const { chatWithAI } = require('../services/aiService');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Chat with AI
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('User message:', message);
    
    const aiResponse = await chatWithAI(message);

    res.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      message: error.message 
    });
  }
});

module.exports = router;
