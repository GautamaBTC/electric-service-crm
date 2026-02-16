const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const config = require('../config/config');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  client_phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/i
    }
  },
  car_model: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  car_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  car_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  problem_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'in_progress', 'completed', 'cancelled']]
    }
  },
  payment_method: {
    type: DataTypes.ENUM(
      config.paymentMethods.CASH, 
      config.paymentMethods.TERMINAL, 
      config.paymentMethods.TRANSFER
    ),
    allowNull: false,
    validate: {
      isIn: [[
        config.paymentMethods.CASH, 
        config.paymentMethods.TERMINAL, 
        config.paymentMethods.TRANSFER
      ]]
    }
  },
  bank: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [config.banks]
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'masters',
      key: 'id'
    }
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true // Использование snake_case вместо camelCase
});

// Методы класса
Order.associate = function(models) {
  // Этот метод оставлен пустым, так как все ассоциации определены в database.js
};

// Метод экземпляра для расчета общей суммы
Order.prototype.calculateTotalSum = async function() {
  try {
    const { OrderWork, OrderMaterial, OrderPart } = require('./index');
    
    // Получаем все работы, материалы и запчасти для этого заказа
    const works = await OrderWork.findAll({
      where: { order_id: this.id }
    });
    
    const materials = await OrderMaterial.findAll({
      where: { order_id: this.id }
    });
    
    const parts = await OrderPart.findAll({
      where: { order_id: this.id }
    });
    
    // Рассчитываем общую сумму
    const worksSum = works.reduce((sum, work) => sum + parseFloat(work.price), 0);
    const materialsSum = materials.reduce((sum, material) => sum + (parseFloat(material.price) * parseFloat(material.quantity)), 0);
    const partsSum = parts.reduce((sum, part) => sum + (parseFloat(part.price) * parseFloat(part.quantity)), 0);
    
    const totalSum = worksSum + materialsSum + partsSum;
    
    // Обновляем общую сумму в заказе
    this.total_amount = totalSum;
    await this.save();
    
    return totalSum;
  } catch (error) {
    throw new Error(`Ошибка при расчете общей суммы заказа: ${error.message}`);
  }
};

// Статический метод для создания заказа с автоматическим расчетом суммы
Order.createWithDetails = async function(orderData, worksData = [], materialsData = [], partsData = []) {
  const transaction = await sequelize.transaction();
  
  try {
    // Создаем заказ
    const order = await Order.create(orderData, { transaction });
    
    // Создаем работы, если они есть
    if (worksData.length > 0) {
      const works = worksData.map(work => ({
        ...work,
        order_id: order.id
      }));
      await OrderWork.bulkCreate(works, { transaction });
    }
    
    // Создаем материалы, если они есть
    if (materialsData.length > 0) {
      const materials = materialsData.map(material => ({
        ...material,
        order_id: order.id
      }));
      await OrderMaterial.bulkCreate(materials, { transaction });
    }
    
    // Создаем запчасти, если они есть
    if (partsData.length > 0) {
      const parts = partsData.map(part => ({
        ...part,
        order_id: order.id
      }));
      await OrderPart.bulkCreate(parts, { transaction });
    }
    
    // Рассчитываем общую сумму
    await order.calculateTotalSum();
    
    // Фиксируем транзакцию
    await transaction.commit();
    
    // Возвращаем заказ со связанными данными
    return await Order.findByPk(order.id, {
      include: [
        { model: OrderWork, as: 'works' },
        { model: OrderMaterial, as: 'materials' },
        { model: OrderPart, as: 'parts' }
      ]
    });
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await transaction.rollback();
    throw new Error(`Ошибка при создании заказа: ${error.message}`);
  }
};

module.exports = Order;