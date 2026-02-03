const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

// Get user settings
router.get('/', authMiddleware, settingsController.getSettings);

// Update user settings
router.put('/', authMiddleware, settingsController.updateSettings);

module.exports = router;
