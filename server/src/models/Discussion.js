const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Discussion = sequelize.define('Discussion', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Nowa rozmowa'
  },
  noteCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_categories',
      key: 'id'
    },
    onDelete: 'SET NULL',
    field: 'note_category_id'
  },
  noteSubCategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'note_sub_categories',
      key: 'id'
    },
    onDelete: 'SET NULL',
    field: 'note_sub_category_id'
  },
  contextLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    field: 'context_level',
    comment: 'Poziom w hierarchii (1-5)'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'discussions',
  timestamps: true,
  underscored: true
});

module.exports = Discussion;
