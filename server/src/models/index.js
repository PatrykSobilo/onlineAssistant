const { sequelize } = require('../config/database');
const User = require('./User');
const UserSettings = require('./UserSettings');
const NoteCategory = require('./NoteCategory');
const NoteSubCategory = require('./NoteSubCategory');
const Note = require('./Note');

// Define additional relationships between Note and Categories
Note.belongsTo(NoteCategory, { foreignKey: 'noteCategoryId', as: 'category' });
NoteCategory.hasMany(Note, { foreignKey: 'noteCategoryId', as: 'notes' });

Note.belongsTo(NoteSubCategory, { foreignKey: 'noteSubCategoryId1', as: 'subCategory1' });
Note.belongsTo(NoteSubCategory, { foreignKey: 'noteSubCategoryId2', as: 'subCategory2' });
Note.belongsTo(NoteSubCategory, { foreignKey: 'noteSubCategoryId3', as: 'subCategory3' });
Note.belongsTo(NoteSubCategory, { foreignKey: 'noteSubCategoryId4', as: 'subCategory4' });
Note.belongsTo(NoteSubCategory, { foreignKey: 'noteSubCategoryId5', as: 'subCategory5' });

// Sync all models
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ All models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing models:', error);
  }
};

module.exports = {
  sequelize,
  User,
  UserSettings,
  NoteCategory,
  NoteSubCategory,
  Note,
  syncDatabase
};
