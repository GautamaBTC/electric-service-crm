const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderPart = sequelize.define('OrderPart', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
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
  seller_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'masters',
      key: 'id'
    }
  }
}, {
  tableName: 'order_parts',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true // Использование snake_case вместо camelCase
});

// Методы класса
OrderPart.associate = function(models) {
  // Этот метод оставлен пустым, так как все ассоциации определены в database.js
};

// Метод экземпляра для обновления общей суммы заказа после изменения запчасти
OrderPart.prototype.updateOrderTotalSum = async function() {
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

// Хук после создания запчасти
OrderPart.afterCreate(async (part, options) => {
  try {
    await part.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после создания запчасти:', error);
  }
});

// Хук после обновления запчасти
OrderPart.afterUpdate(async (part, options) => {
  try {
    await part.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после обновления запчасти:', error);
  }
});

// Хук после удаления запчасти
OrderPart.afterDestroy(async (part, options) => {
  try {
    await part.updateOrderTotalSum();
  } catch (error) {
    console.error('Ошибка после удаления запчасти:', error);
  }
});

module.exports = OrderPart;