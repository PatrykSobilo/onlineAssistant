const { NoteCategory, NoteSubCategory, Note } = require('../models');
const { Op } = require('sequelize');

// Pobierz wszystkie kategorie użytkownika
exports.getCategories = async (req, res) => {
  try {
    const categories = await NoteCategory.findAll({
      where: { 
        userId: req.user.id,
        isActive: true 
      },
      include: [{
        model: NoteSubCategory,
        as: 'subCategories',
        where: { isActive: true },
        required: false
      }],
      order: [['name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania kategorii' });
  }
};

// Pobierz pojedynczą kategorię
exports.getCategoryById = async (req, res) => {
  try {
    const category = await NoteCategory.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: NoteSubCategory,
        as: 'subCategories',
        where: { isActive: true },
        required: false
      }]
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania kategorii' });
  }
};

// Utwórz nową kategorię
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nazwa kategorii jest wymagana' });
    }

    // Sprawdź czy kategoria o takiej nazwie już istnieje
    const existingCategory = await NoteCategory.findOne({
      where: {
        userId: req.user.id,
        name: name,
        isActive: true
      }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Kategoria o tej nazwie już istnieje' });
    }

    const category = await NoteCategory.create({
      userId: req.user.id,
      name,
      icon: icon || '📁',
      color: color || '#3B82F6',
      isActive: true
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia kategorii' });
  }
};

// Aktualizuj kategorię
exports.updateCategory = async (req, res) => {
  try {
    const { name, icon, color, isActive } = req.body;

    const category = await NoteCategory.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    // Sprawdź czy nowa nazwa nie jest zajęta
    if (name && name !== category.name) {
      const existingCategory = await NoteCategory.findOne({
        where: {
          userId: req.user.id,
          name: name,
          isActive: true,
          id: { [Op.ne]: req.params.id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({ message: 'Kategoria o tej nazwie już istnieje' });
      }
    }

    await category.update({
      name: name || category.name,
      icon: icon || category.icon,
      color: color || category.color,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji kategorii' });
  }
};

// Usuń kategorię (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await NoteCategory.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    // Sprawdź czy kategoria jest używana w notatkach
    const notesCount = await Note.count({
      where: {
        userId: req.user.id,
        noteCategoryId: req.params.id
      }
    });

    if (notesCount > 0) {
      return res.status(400).json({ 
        message: `Nie można usunąć kategorii, ponieważ jest używana w ${notesCount} ${notesCount === 1 ? 'notatce' : 'notatkach'}. Najpierw usuń lub przenieś notatki.` 
      });
    }

    // Soft delete - oznacz jako nieaktywną
    await category.update({ isActive: false });

    // Oznacz również wszystkie subkategorie jako nieaktywne
    await NoteSubCategory.update(
      { isActive: false },
      { where: { categoryId: req.params.id, userId: req.user.id } }
    );

    res.json({ message: 'Kategoria została usunięta' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania kategorii' });
  }
};

// Pobierz statystyki kategorii
exports.getCategoryStats = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const category = await NoteCategory.findOne({
      where: { 
        id: categoryId,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    // Policz notatki w tej kategorii
    const notesCount = await Note.count({
      where: {
        userId: req.user.id,
        noteCategoryId: categoryId
      }
    });

    // Policz subkategorie
    const subcategoriesCount = await NoteSubCategory.count({
      where: {
        userId: req.user.id,
        categoryId: categoryId,
        isActive: true
      }
    });

    res.json({
      category,
      stats: {
        notesCount,
        subcategoriesCount
      }
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania statystyk kategorii' });
  }
};
