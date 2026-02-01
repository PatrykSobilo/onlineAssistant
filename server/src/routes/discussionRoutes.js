const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all discussions for current user
router.get('/', discussionController.getAllDiscussions);

// Get single discussion with messages
router.get('/:id', discussionController.getDiscussion);

// Create new discussion
router.post('/', discussionController.createDiscussion);

// Send message in discussion
router.post('/:id/messages', discussionController.sendMessage);

// Update discussion title
router.put('/:id', discussionController.updateDiscussion);

// Delete discussion
router.delete('/:id', discussionController.deleteDiscussion);

module.exports = router;
