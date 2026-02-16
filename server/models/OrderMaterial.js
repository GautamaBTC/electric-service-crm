const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderMaterial = sequelize.define('OrderMaterial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'order_materials',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true // Использование snake_case вместо camelCase
});

// Методы класса
OrderMaterial.associate = function(models) {
  // Материал принадлежит заказу
  OrderMaterial.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
  
  // Материал может иметь много бонусов
  OrderMaterial.hasMany(models.Bonus, {
    foreignKey: 'order_material_id',
    as: 'bonuses'
  });
};

// Метод экземпляра для обновления общей суммы заказа после изменения материала
OrderMaterial.prototype.updateOrderTotalSum = async function() {
  try {
    const Order = require('./Order');
    const order = await Order.findByPk(this.order_id);
    if (order) {
      await order.calculateTotalSum();
    }
  } catch (error) {
    throw new Error(`Ошибка при обновлении общей суммы заказа: ${error.message}`);
  }
};

// Хук после создания материала
OrderMaterial.afterCreate(async (material, options) => {
  try {
    await material.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после создания материала:', error);
  }
});

// Хук после обновления материала
OrderMaterial.afterUpdate(async (material, options) => {
  try {
    await material.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после обновления материала:', error);
  }
});

// Хук после удаления материала
OrderMaterial.afterDestroy(async (material, options) => {
  try {
    await material.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после удаления материала:', error);
  }
});

module.exports = OrderMaterial;