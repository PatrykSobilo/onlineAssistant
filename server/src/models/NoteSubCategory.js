const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const NoteCategory = require('./NoteCategory');

const NoteSubCategory = sequelize.define('NoteSubCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'note_categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  parentSubCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_sub_categories',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'For hierarchical subcategories (subcategory of subcategory)'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Level 1-5, corresponds to noteSubCategoryId1-5'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isUnlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Levels 3-5 are locked by default'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'note_sub_categories',
  timestamps: true
});

// Define relationships
User.hasMany(NoteSubCategory, { foreignKey: 'userId', as: 'noteSubCategories' });
NoteSubCategory.belongsTo(User, { foreignKey: 'userId' });

NoteCategory.hasMany(NoteSubCategory, { foreignKey: 'categoryId', as: 'subCategories' });
NoteSubCategory.belongsTo(NoteCategory, { foreignKey: 'categoryId', as: 'category' });

// Self-referencing relationship for hierarchical subcategories
NoteSubCategory.hasMany(NoteSubCategory, { 
  foreignKey: 'parentSubCategoryId', 
  as: 'childSubCategories' 
});
NoteSubCategory.belongsTo(NoteSubCategory, { 
  foreignKey: 'parentSubCategoryId', 
  as: 'parentSubCategory' 
});

module.exports = NoteSubCategory;
