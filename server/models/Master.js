const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const config = require('../config/config');

const Master = sequelize.define('Master', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/i
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM(config.roles.ADMIN, config.roles.DIRECTOR, config.roles.MASTER),
    allowNull: false,
    defaultValue: config.roles.MASTER,
    validate: {
      isIn: [[config.roles.ADMIN, config.roles.DIRECTOR, config.roles.MASTER]]
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'masters',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true, // Использование snake_case вместо camelCase
  defaultScope: {
    attributes: { exclude: ['password_hash'] }
  }
});

// Методы класса
Master.associate = function(models) {
  // Определение ассоциаций здесь, если необходимо
};

module.exports = Master;