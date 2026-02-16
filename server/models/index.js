const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/config');
const { sequelize } = require('../config/database');

// Импорт всех моделей
const Master = require('./Master');
const Order = require('./Order');
const OrderWork = require('./OrderWork');
const OrderMaterial = require('./OrderMaterial');
const OrderPart = require('./OrderPart');
const OrderMaster = require('./OrderMaster');
const Setting = require('./Setting');
const Bonus = require('./Bonus');

// Объект с моделями
const models = {
  Master,
  Order,
  OrderWork,
  OrderMaterial,
  OrderPart,
  OrderMaster,
  Setting,
  Bonus
};

// Установка связей между моделями
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = models;