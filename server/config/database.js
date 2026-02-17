// Загружаем переменные окружения из .env файла для локальной разработки
// В продакшене (Render) переменные будут загружены из окружения
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '../.env' });
}
const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/errorHandler');

// Создание экземпляра Sequelize
let sequelize;

// Общие опции для Sequelize
const commonOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true // Включение мягкого удаления (deletedAt)
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 3, // Максимальное количество попыток повторного подключения
    match: [
      /ConnectionError/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};

if (process.env.DATABASE_URL) {
  // Используем DATABASE_URL для Render
  try {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      ...commonOptions,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Необходимо для Render
        }
      }
    });
    console.log('Настройка подключения к PostgreSQL через DATABASE_URL');
  } catch (error) {
    logger.logError('Ошибка создания экземпляра Sequelize через DATABASE_URL', error);
    throw error;
  }
} else {
  // Используем отдельные параметры для локальной разработки
  try {
    sequelize = new Sequelize(
      process.env.DB_NAME || 'electric_service_crm',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'password',
      {
        ...commonOptions,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432
      }
    );
    console.log('Настройка подключения к PostgreSQL через отдельные параметры');
  } catch (error) {
    logger.logError('Ошибка создания экземпляра Sequelize через отдельные параметры', error);
    throw error;
  }
}

// Проверка подключения к базе данных
const testConnection = async () => {
  try {
    console.log('Попытка подключения к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных успешно установлено.');
    return true;
  } catch (error) {
    console.error('❌ Невозможно подключиться к базе данных:');
    
    // Детальное логирование ошибки
    if (error.name) {
      console.error(`   Тип ошибки: ${error.name}`);
    }
    
    if (error.message) {
      console.error(`   Сообщение об ошибке: ${error.message}`);
    }
    
    if (error.parent && error.parent.message) {
      console.error(`   Детали от драйвера: ${error.parent.message}`);
    }
    
    if (error.original && error.original.code) {
      console.error(`   Код ошибки: ${error.original.code}`);
    }
    
    // Дополнительная информация для отладки
    if (process.env.DATABASE_URL) {
      console.error(`   Используется DATABASE_URL: ${maskSensitiveData(process.env.DATABASE_URL)}`);
    } else {
      console.error(`   Параметры подключения: Хост=${process.env.DB_HOST || 'localhost'}, ` +
                   `Порт=${process.env.DB_PORT || 5432}, ` +
                   `БД=${process.env.DB_NAME || 'electric_service_crm'}, ` +
                   `Пользователь=${process.env.DB_USER || 'postgres'}`);
    }
    
    // Записываем ошибку в логгер
    try {
      const logger = require('../utils/errorHandler');
      logger.logError('Ошибка подключения к базе данных', error);
    } catch (loggerError) {
      console.error('   Не удалось записать ошибку в логгер:', loggerError.message);
    }
    
    return false;
  }
};

// Вспомогательная функция для маскирования конфиденциальных данных
const maskSensitiveData = (str) => {
  if (!str) return 'undefined';
  
  // Маскируем пароль в строке подключения
  return str.replace(/:(.*?)@/, ':***@');
};

// Определение связей между моделями
const defineRelations = (models) => {
  const { Master, Order, OrderWork, OrderMaterial, OrderPart, OrderMaster, Bonus } = models;
  
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
  
  // Order имеет много Bonus
  Order.hasMany(Bonus, { foreignKey: 'order_id', as: 'bonuses' });
  Bonus.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
  
  // OrderPart имеет много Bonus
  OrderPart.hasMany(Bonus, { foreignKey: 'order_part_id', as: 'partBonuses' });
  Bonus.belongsTo(OrderPart, { foreignKey: 'order_part_id', as: 'orderPart' });
  
  // OrderMaterial имеет много Bonus
  OrderMaterial.hasMany(Bonus, { foreignKey: 'order_material_id', as: 'materialBonuses' });
  Bonus.belongsTo(OrderMaterial, { foreignKey: 'order_material_id', as: 'orderMaterial' });
};

// Синхронизация моделей с базой данных
const syncModels = async () => {
  try {
    console.log('Начало синхронизации моделей с базой данных...');
    
    // В режиме разработки используем force: true для пересоздания таблиц
    const force = process.env.NODE_ENV === 'development';
    const alter = process.env.NODE_ENV === 'production';
    
    console.log(`Режим синхронизации: ${force ? 'force' : (alter ? 'alter' : 'none')}`);
    
    await sequelize.sync({ force, alter });
    console.log('✅ Модели успешно синхронизированы с базой данных.');
    return true;
  } catch (error) {
    console.error('❌ Ошибка синхронизации моделей:');
    
    // Детальное логирование ошибки
    if (error.name) {
      console.error(`   Тип ошибки: ${error.name}`);
    }
    
    if (error.message) {
      console.error(`   Сообщение об ошибке: ${error.message}`);
    }
    
    if (error.parent && error.parent.message) {
      console.error(`   Детали от драйвера: ${error.parent.message}`);
    }
    
    if (error.original && error.original.code) {
      console.error(`   Код ошибки: ${error.original.code}`);
    }
    
    // Записываем ошибку в логгер
    try {
      const logger = require('../utils/errorHandler');
      logger.logError('Ошибка синхронизации моделей с базой данных', error);
    } catch (loggerError) {
      console.error('   Не удалось записать ошибку в логгер:', loggerError.message);
    }
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  defineRelations,
  syncModels
};