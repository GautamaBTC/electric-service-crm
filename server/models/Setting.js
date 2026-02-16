const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  director_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 50.00,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'settings',
  timestamps: true,
  underscored: true // Использование snake_case вместо camelCase
});

// Методы класса
Setting.associate = function(models) {
  // Определение ассоциаций здесь, если необходимо
};

// Статический метод для получения текущих настроек
Setting.getCurrentSettings = async function() {
  try {
    let settings = await this.findOne();
    
    // Если настроек нет, создаем настройки по умолчанию
    if (!settings) {
      settings = await this.create({
        director_percent: 50.00
      });
    }
    
    return settings;
  } catch (error) {
    throw new Error(`Ошибка при получении настроек: ${error.message}`);
  }
};

// Статический метод для обновления настроек
Setting.updateSettings = async function(settingsData) {
  try {
    const settings = await this.getCurrentSettings();
    
    // Обновляем настройки
    return await settings.update(settingsData);
  } catch (error) {
    throw new Error(`Ошибка при обновлении настроек: ${error.message}`);
  }
};

module.exports = Setting;