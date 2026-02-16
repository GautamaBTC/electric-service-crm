const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderWork = sequelize.define('OrderWork', {
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
  tableName: 'order_works',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true // Использование snake_case вместо camelCase
});

// Методы класса
OrderWork.associate = function(models) {
  // Работа принадлежит заказу
  OrderWork.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
};

// Метод экземпляра для обновления общей суммы заказа после изменения работы
OrderWork.prototype.updateOrderTotalSum = async function() {
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

// Хук после создания работы
OrderWork.afterCreate(async (work, options) => {
  try {
    await work.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после создания работы:', error);
  }
});

// Хук после обновления работы
OrderWork.afterUpdate(async (work, options) => {
  try {
    await work.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после обновления работы:', error);
  }
});

// Хук после удаления работы
OrderWork.afterDestroy(async (work, options) => {
  try {
    await work.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после удаления работы:', error);
  }
});

module.exports = OrderWork;