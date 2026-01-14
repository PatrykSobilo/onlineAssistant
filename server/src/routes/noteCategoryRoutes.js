const express = require('express');
const router = express.Router();
const noteCategoryController = require('../controllers/noteCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Wszystkie routy wymagają autentykacji
router.use(authMiddleware);

// GET /api/categories - Pobierz wszystkie kategorie
router.get('/', noteCategoryController.getCategories);

// GET /api/categories/:id - Pobierz pojedynczą kategorię
router.get('/:id', noteCategoryController.getCategoryById);

// POST /api/categories - Utwórz nową kategorię
router.post('/', noteCategoryController.createCategory);

// PUT /api/categories/:id - Aktualizuj kategorię
router.put('/:id', noteCategoryController.updateCategory);

// DELETE /api/categories/:id - Usuń kategorię (soft delete)
router.delete('/:id', noteCategoryController.deleteCategory);

// GET /api/categories/:id/stats - Pobierz statystyki kategorii
router.get('/:id/stats', noteCategoryController.getCategoryStats);

module.exports = router;
