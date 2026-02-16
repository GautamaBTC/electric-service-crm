require('dotenv').config({ path: '../.env' });
const path = require('path');

// Конфигурация приложения
const config = {
  // Настройки сервера
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // Настройки базы данных
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'electric_service_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  
  // Настройки JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Настройки ролей
  roles: {
    ADMIN: 'admin',
    DIRECTOR: 'director',
    MASTER: 'master'
  },
  
  // Настройки статусов заказов
  orderStatuses: {
    IN_PROGRESS: 'в работе',
    COMPLETED: 'готово'
  },
  
  // Настройки способов оплаты
  paymentMethods: {
    CASH: 'наличные',
    TERMINAL: 'терминал',
    TRANSFER: 'перевод'
  },
  
  // Настройки банков
  banks: [
    'Сбер',
    'Т-Банк',
    'ВТБ',
    'Альфа-Банк',
    'Газпромбанк'
  ],
  
  // Пути к файлам
  paths: {
    root: path.resolve(__dirname, '../..'),
    server: path.resolve(__dirname, '..'),
    client: path.resolve(__dirname, '../../client'),
    uploads: path.resolve(__dirname, '../uploads')
  }
};

// Логирование для диагностики проблемы
console.log('Конфигурация загружена:');
console.log('config.jwt:', config.jwt);
console.log('config.roles:', config.roles);

module.exports = config;