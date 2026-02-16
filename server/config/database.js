const { Sequelize } = require('sequelize');
const path = require('path');

// Создание экземпляра Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'electric_service_crm',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true // Включение мягкого удаления (deletedAt)
    }
  }
);

// Проверка подключения к базе данных
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных успешно установлено.');
  } catch (error) {
    console.error('Невозможно подключиться к базе данных:', error);
  }
};

// Импорт моделей
const Master = require('../models/Master');
const Order = require('../models/Order');
const OrderWork = require('../models/OrderWork');
const OrderMaterial = require('../models/OrderMaterial');
const OrderPart = require('../models/OrderPart');
const OrderMaster = require('../models/OrderMaster');
const Setting = require('../models/Setting');
const Bonus = require('../models/Bonus');

// Определение связей между моделями
const defineRelations = () => {
  // Master имеет много Order
  Master.hasMany(Order, { foreignKey: 'created_by', as: 'createdOrders' });
  Order.belongsTo(Master, { foreignKey: 'created_by', as: 'creator' });
  
  // Order имеет много OrderWork
  Order.hasMany(OrderWork, { foreignKey: 'order_id', as: 'works' });
  OrderWork.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  
  // Order имеет много OrderMaterial
  Order.hasMany(OrderMaterial, { foreignKey: 'order_id', as: 'materials' });
  OrderMaterial.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  
  // Order имеет много OrderPart
  Order.hasMany(OrderPart, { foreignKey: 'order_id', as: 'parts' });
  OrderPart.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  
  // Order имеет много OrderMaster (многие-ко-многим с Master)
  Order.belongsToMany(Master, { 
    through: OrderMaster, 
    foreignKey: 'order_id', 
    otherKey: 'master_id',
    as: 'masters' 
  });
  Master.belongsToMany(Order, { 
    through: OrderMaster, 
    foreignKey: 'master_id', 
    otherKey: 'order_id',
    as: 'orders' 
  });
  
  // Master имеет много Bonus
  Master.hasMany(Bonus, { foreignKey: 'master_id', as: 'bonuses' });
  Bonus.belongsTo(Master, { foreignKey: 'master_id', as: 'master' });
  
  // OrderPart имеет много Bonus
  OrderPart.hasMany(Bonus, { foreignKey: 'order_part_id', as: 'bonuses' });
  Bonus.belongsTo(OrderPart, { foreignKey: 'order_part_id', as: 'orderPart' });
  
  // OrderMaterial имеет много Bonus
  OrderMaterial.hasMany(Bonus, { foreignKey: 'order_material_id', as: 'bonuses' });
  Bonus.belongsTo(OrderMaterial, { foreignKey: 'order_material_id', as: 'orderMaterial' });
};

// Синхронизация моделей с базой данных
const syncModels = async () => {
  try {
    // В режиме разработки используем force: true для пересоздания таблиц
    const force = process.env.NODE_ENV === 'development';
    await sequelize.sync({ force });
    console.log('Модели успешно синхронизированы с базой данных.');
  } catch (error) {
    console.error('Ошибка синхронизации моделей:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  defineRelations,
  syncModels
};