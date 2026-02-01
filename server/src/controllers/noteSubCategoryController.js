const { NoteSubCategory, NoteCategory, Note } = require('../models');
const { Op } = require('sequelize');

// Pobierz subkategorie (z możliwością filtrowania po kategorii i parent)
exports.getSubCategories = async (req, res) => {
  try {
    const { categoryId, parentId, level } = req.query;
    
    const where = {
      userId: req.user.id,
      isActive: true
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (parentId) {
      where.parentSubCategoryId = parentId;
    } else if (parentId === null || req.query.rootOnly === 'true') {
      // Pobierz tylko root level (poziom 1)
      where.parentSubCategoryId = null;
      where.level = 1;
    }

    if (level) {
      where.level = parseInt(level);
    }

    const subcategories = await NoteSubCategory.findAll({
      where,
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'parentSubCategory',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'childSubCategories',
          where: { isActive: true },
          attributes: ['id', 'name', 'level', 'isUnlocked'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania subkategorii' });
  }
};

// Pobierz drzewo hierarchii subkategorii dla kategorii
exports.getSubCategoryTree = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Sprawdź czy kategoria istnieje i należy do użytkownika
    const category = await NoteCategory.findOne({
      where: {
        id: categoryId,
        userId: req.user.id
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    // Pobierz wszystkie subkategorie dla tej kategorii
    const allSubCategories = await NoteSubCategory.findAll({
      where: {
        categoryId,
        userId: req.user.id,
        isActive: true
      },
      order: [['level', 'ASC'], ['name', 'ASC']]
    });

    // Zbuduj drzewo hierarchii
    const buildTree = (parentId = null) => {
      return allSubCategories
        .filter(sub => sub.parentSubCategoryId === parentId)
        .map(sub => ({
          ...sub.toJSON(),
          children: buildTree(sub.id)
        }));
    };

    const tree = buildTree(null);

    res.json({
      category,
      tree
    });
  } catch (error) {
    console.error('Error fetching subcategory tree:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania drzewa subkategorii' });
  }
};

// Pobierz pojedynczą subkategorię
exports.getSubCategoryById = async (req, res) => {
  try {
    const subcategory = await NoteSubCategory.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'parentSubCategory',
          attributes: ['id', 'name', 'level'],
          required: false
        },
        {
          model: NoteSubCategory,
          as: 'childSubCategories',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!subcategory) {
      return res.status(404).json({ message: 'Subkategoria nie została znaleziona' });
    }

    res.json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania subkategorii' });
  }
};

// Utwórz nową subkategorię
exports.createSubCategory = async (req, res) => {
  try {
    const { categoryId, parentSubCategoryId, name, level } = req.body;

    if (!categoryId || !name) {
      return res.status(400).json({ message: 'categoryId i name są wymagane' });
    }

    // Sprawdź czy kategoria istnieje
    const category = await NoteCategory.findOne({
      where: {
        id: categoryId,
        userId: req.user.id,
        isActive: true
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategoria nie została znaleziona' });
    }

    // Jeśli jest parent, sprawdź czy istnieje i ustal poziom
    let calculatedLevel = 1;
    if (parentSubCategoryId) {
      const parentSubCategory = await NoteSubCategory.findOne({
        where: {
          id: parentSubCategoryId,
          userId: req.user.id,
          categoryId,
          isActive: true
        }
      });

      if (!parentSubCategory) {
        return res.status(404).json({ message: 'Rodzic subkategorii nie został znaleziony' });
      }

      calculatedLevel = parentSubCategory.level + 1;

      if (calculatedLevel > 5) {
        return res.status(400).json({ message: 'Maksymalny poziom zagnieżdżenia to 5' });
      }

      // Sprawdź czy poziomy 3-5 są odblokowane
      if (calculatedLevel >= 3 && !parentSubCategory.isUnlocked) {
        return res.status(403).json({ message: 'Poziomy 3-5 są zablokowane. Odblokuj najpierw rodzica.' });
      }
    }

    // Sprawdź czy subkategoria o takiej nazwie już istnieje na tym poziomie
    const existingSubCategory = await NoteSubCategory.findOne({
      where: {
        userId: req.user.id,
        categoryId,
        parentSubCategoryId: parentSubCategoryId || null,
        name,
        isActive: true
      }
    });

    if (existingSubCategory) {
      return res.status(400).json({ message: 'Subkategoria o tej nazwie już istnieje na tym poziomie' });
    }

    // Utwórz subkategorię
    const subcategory = await NoteSubCategory.create({
      userId: req.user.id,
      categoryId,
      parentSubCategoryId: parentSubCategoryId || null,
      level: calculatedLevel,
      name,
      isActive: true,
      isUnlocked: calculatedLevel < 3 // Poziomy 1-2 odblokowane domyślnie
    });

    // Pobierz pełne dane z relacjami
    const fullSubCategory = await NoteSubCategory.findByPk(subcategory.id, {
      include: [
        {
          model: NoteCategory,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        },
        {
          model: NoteSubCategory,
          as: 'parentSubCategory',
          attributes: ['id', 'name', 'level'],
          required: false
        }
      ]
    });

    res.status(201).json(fullSubCategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Błąd podczas tworzenia subkategorii',
      error: error.message 
    });
  }
};

// Aktualizuj subkategorię
exports.updateSubCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const subcategory = await NoteSubCategory.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!subcategory) {
      return res.status(404).json({ message: 'Subkategoria nie została znaleziona' });
    }

    // Sprawdź czy nowa nazwa nie jest zajęta na tym poziomie
    if (name && name !== subcategory.name) {
      const existingSubCategory = await NoteSubCategory.findOne({
        where: {
          userId: req.user.id,
          categoryId: subcategory.categoryId,
          parentSubCategoryId: subcategory.parentSubCategoryId,
          name,
          isActive: true,
          id: { [Op.ne]: req.params.id }
        }
      });

      if (existingSubCategory) {
        return res.status(400).json({ message: 'Subkategoria o tej nazwie już istnieje na tym poziomie' });
      }
    }

    await subcategory.update({
      name: name || subcategory.name,
      isActive: isActive !== undefined ? isActive : subcategory.isActive
    });

    res.json(subcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji subkategorii' });
  }
};

// Odblokuj subkategorię (dla poziomów 3-5)
exports.unlockSubCategory = async (req, res) => {
  try {
    const subcategory = await NoteSubCategory.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!subcategory) {
      return res.status(404).json({ message: 'Subkategoria nie została znaleziona' });
    }

    if (subcategory.level < 3) {
      return res.status(400).json({ message: 'Poziomy 1-2 są odblokowane domyślnie' });
    }

    await subcategory.update({ isUnlocked: true });

    res.json(subcategory);
  } catch (error) {
    console.error('Error unlocking subcategory:', error);
    res.status(500).json({ message: 'Błąd podczas odblokowywania subkategorii' });
  }
};

// Usuń subkategorię (soft delete, kaskada na dzieci)
exports.deleteSubCategory = async (req, res) => {
  try {
    const subcategory = await NoteSubCategory.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!subcategory) {
      return res.status(404).json({ message: 'Subkategoria nie została znaleziona' });
    }

    // Funkcja rekurencyjna do usuwania dzieci
    const deleteChildren = async (parentId) => {
      const children = await NoteSubCategory.findAll({
        where: {
          parentSubCategoryId: parentId,
          userId: req.user.id
        }
      });

      for (const child of children) {
        await deleteChildren(child.id);
        await child.update({ isActive: false });
      }
    };

    // Usuń wszystkie dzieci
    await deleteChildren(subcategory.id);

    // Usuń samą subkategorię
    await subcategory.update({ isActive: false });

    res.json({ message: 'Subkategoria i jej dzieci zostały usunięte' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania subkategorii' });
  }
};

// Pobierz ścieżkę (breadcrumb) do subkategorii
exports.getSubCategoryPath = async (req, res) => {
  try {
    const { id } = req.params;
    const path = [];

    let currentSubCategory = await NoteSubCategory.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [{
        model: NoteCategory,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    if (!currentSubCategory) {
      return res.status(404).json({ message: 'Subkategoria nie została znaleziona' });
    }

    // Dodaj kategorię na początek
    path.unshift({
      type: 'category',
      ...currentSubCategory.category.toJSON()
    });

    // Wspinaj się w górę drzewa
    while (currentSubCategory) {
      path.push({
        type: 'subcategory',
        id: currentSubCategory.id,
        name: currentSubCategory.name,
        level: currentSubCategory.level
      });

      if (currentSubCategory.parentSubCategoryId) {
        currentSubCategory = await NoteSubCategory.findOne({
          where: {
            id: currentSubCategory.parentSubCategoryId,
            userId: req.user.id
          }
        });
      } else {
        currentSubCategory = null;
      }
    }

    res.json({ path });
  } catch (error) {
    console.error('Error fetching subcategory path:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania ścieżki subkategorii' });
  }
};
