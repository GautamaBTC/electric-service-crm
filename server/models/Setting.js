const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  director_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 50.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  company_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'VIPАвто'
  },
  company_address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'RUB'
  },
  work_time_start: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '09:00'
  },
  work_time_end: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: '18:00'
  },
  working_days: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    defaultValue: [1, 2, 3, 4, 5] // Пн-Пт
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
        director_percentage: 50.00,
        company_name: 'VIPАвто',
        company_address: '',
        company_phone: '',
        currency: 'RUB',
        work_time_start: '09:00',
        work_time_end: '18:00',
        working_days: [1, 2, 3, 4, 5] // Пн-Пт
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