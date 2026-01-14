const express = require('express');
const router = express.Router();
const noteSubCategoryController = require('../controllers/noteSubCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Wszystkie routy wymagają autentykacji
router.use(authMiddleware);

// GET /api/subcategories - Pobierz subkategorie (z filtrowaniem)
router.get('/', noteSubCategoryController.getSubCategories);

// GET /api/subcategories/tree/:categoryId - Pobierz drzewo hierarchii dla kategorii
router.get('/tree/:categoryId', noteSubCategoryController.getSubCategoryTree);

// GET /api/subcategories/:id - Pobierz pojedynczą subkategorię
router.get('/:id', noteSubCategoryController.getSubCategoryById);

// GET /api/subcategories/:id/path - Pobierz ścieżkę (breadcrumb) do subkategorii
router.get('/:id/path', noteSubCategoryController.getSubCategoryPath);

// POST /api/subcategories - Utwórz nową subkategorię
router.post('/', noteSubCategoryController.createSubCategory);

// PUT /api/subcategories/:id - Aktualizuj subkategorię
router.put('/:id', noteSubCategoryController.updateSubCategory);

// PUT /api/subcategories/:id/unlock - Odblokuj subkategorię (poziomy 3-5)
router.put('/:id/unlock', noteSubCategoryController.unlockSubCategory);

// DELETE /api/subcategories/:id - Usuń subkategorię (soft delete z kaskadą)
router.delete('/:id', noteSubCategoryController.deleteSubCategory);

module.exports = router;
