const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const NoteCategory = sequelize.define('NoteCategory', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'note_categories',
  timestamps: true
});

// Define relationships
User.hasMany(NoteCategory, { foreignKey: 'userId', as: 'noteCategories' });
NoteCategory.belongsTo(User, { foreignKey: 'userId' });

module.exports = NoteCategory;
