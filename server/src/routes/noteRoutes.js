const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Wszystkie routy wymagają autentykacji
router.use(authMiddleware);

// GET /api/notes - Pobierz wszystkie notatki z filtrowaniem
router.get('/', noteController.getNotes);

// GET /api/notes/stats - Pobierz statystyki notatek
router.get('/stats', noteController.getNoteStats);

// GET /api/notes/:id - Pobierz pojedynczą notatkę
router.get('/:id', noteController.getNoteById);

// POST /api/notes - Utwórz nową notatkę
router.post('/', noteController.createNote);

// PUT /api/notes/:id - Aktualizuj notatkę
router.put('/:id', noteController.updateNote);

// DELETE /api/notes/:id - Usuń notatkę
router.delete('/:id', noteController.deleteNote);

// POST /api/notes/:id/tags - Dodaj tag do notatki
router.post('/:id/tags', noteController.addTag);

// DELETE /api/notes/:id/tags - Usuń tag z notatki
router.delete('/:id/tags', noteController.removeTag);

// POST /api/notes/ai-organize - AI organization of unassigned notes
router.post('/ai-organize', noteController.aiOrganizeUnassigned);

// POST /api/notes/ai-reorganize - AI reorganization of all notes in category
router.post('/ai-reorganize', noteController.aiReorganizeAll);

// POST /api/notes/ai-merge - AI merging of notes in a category
router.post('/ai-merge', noteController.aiMergeNotes);

// POST /api/notes/ai-create - AI-based note creation from user input
router.post('/ai-create', noteController.aiCreateNote);

module.exports = router;
