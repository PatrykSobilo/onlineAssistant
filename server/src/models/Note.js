const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Note = sequelize.define('Note', {
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
  noteCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_categories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  noteSubCategoryId1: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_subcategories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  noteSubCategoryId2: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_subcategories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  noteSubCategoryId3: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_subcategories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  noteSubCategoryId4: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_subcategories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  noteSubCategoryId5: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_subcategories',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  source: {
    type: DataTypes.ENUM('voice', 'text'),
    defaultValue: 'text'
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  wasMerged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  tableName: 'notes',
  timestamps: true
});

// Define relationships
User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId' });

module.exports = Note;
