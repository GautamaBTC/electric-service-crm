const { DataTypes } = require('sequelize');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const Bonus = sequelize.define('Bonus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  master_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'masters',
      key: 'id'
    }
  },
  order_part_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'order_parts',
      key: 'id'
    }
  },
  order_material_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'order_materials',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'bonuses',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true, // Использование snake_case вместо camelCase
  validate: {
    // Проверка, что указана либо запчасть, либо материал
    eitherOrderPartOrMaterial() {
      if (!this.order_part_id && !this.order_material_id) {
        throw new Error('Должна быть указана либо запчасть, либо материал');
      }
      if (this.order_part_id && this.order_material_id) {
        throw new Error('Может быть указана либо запчасть, либо материал, но не обе одновременно');
      }
    }
  }
});

// Методы класса
Bonus.associate = function(models) {
  // Бонус принадлежит мастеру
  Bonus.belongsTo(models.Master, {
    foreignKey: 'master_id',
    as: 'master'
  });
  
  // Бонус может быть связан с запчастью
  Bonus.belongsTo(models.OrderPart, {
    foreignKey: 'order_part_id',
    as: 'orderPart'
  });
  
  // Бонус может быть связан с материалом
  Bonus.belongsTo(models.OrderMaterial, {
    foreignKey: 'order_material_id',
    as: 'orderMaterial'
  });
};

// Статический метод для создания бонуса за запчасть
Bonus.createForPart = async function(bonusData) {
  try {
    const { OrderPart } = require('./index');
    
    // Проверяем, что существует запчасть
    const orderPart = await OrderPart.findByPk(bonusData.order_part_id);
    if (!orderPart) {
      throw new Error('Запчасть не найдена');
    }
    
    // Создаем бонус
    return await this.create({
      master_id: bonusData.master_id,
      order_part_id: bonusData.order_part_id,
      amount: bonusData.amount,
      description: bonusData.description || `Бонус за продажу запчасти: ${orderPart.name}`
    });
  } catch (error) {
    throw new Error(`Ошибка при создании бонуса за запчасть: ${error.message}`);
  }
};

// Статический метод для создания бонуса за материал
Bonus.createForMaterial = async function(bonusData) {
  try {
    const { OrderMaterial } = require('./index');
    
    // Проверяем, что существует материал
    const orderMaterial = await OrderMaterial.findByPk(bonusData.order_material_id);
    if (!orderMaterial) {
      throw new Error('Материал не найден');
    }
    
    // Создаем бонус
    return await this.create({
      master_id: bonusData.master_id,
      order_material_id: bonusData.order_material_id,
      amount: bonusData.amount,
      description: bonusData.description || `Бонус за продажу материала: ${orderMaterial.description}`
    });
  } catch (error) {
    throw new Error(`Ошибка при создании бонуса за материал: ${error.message}`);
  }
};

// Статический метод для получения бонусов мастера
Bonus.getMasterBonuses = async function(masterId, options = {}) {
  const { startDate, endDate, limit = 50, offset = 0 } = options;
  
  const whereClause = { master_id: masterId };
  
  // Добавляем фильтрацию по дате, если указана
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[Op.gte] = startDate;
    if (endDate) whereClause.created_at[Op.lte] = endDate;
  }
  
  return await this.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: require('./OrderPart'),
        as: 'orderPart',
        include: [
          {
            model: require('./Order'),
            as: 'order',
            attributes: ['id', 'date_created', 'vehicle_name', 'plate_number']
          }
        ]
      },
      {
        model: require('./OrderMaterial'),
        as: 'orderMaterial',
        include: [
          {
            model: require('./Order'),
            as: 'order',
            attributes: ['id', 'date_created', 'vehicle_name', 'plate_number']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

// Статический метод для получения общей суммы бонусов мастера
Bonus.getMasterTotalBonus = async function(masterId, options = {}) {
  const { startDate, endDate } = options;
  
  const whereClause = { master_id: masterId };
  
  // Добавляем фильтрацию по дате, если указана
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[Op.gte] = startDate;
    if (endDate) whereClause.created_at[Op.lte] = endDate;
  }
  
  const result = await this.sum('amount', {
    where: whereClause
  });
  
  return result || 0;
};

module.exports = Bonus;