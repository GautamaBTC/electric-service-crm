const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderMaster = sequelize.define('OrderMaster', {
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
  master_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'masters',
      key: 'id'
    }
  },
  work_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  work_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'order_masters',
  timestamps: true,
  paranoid: true, // Включение мягкого удаления (deletedAt)
  underscored: true, // Использование snake_case вместо camelCase
  indexes: [
    // Уникальный индекс для пары заказ-мастер
    {
      unique: true,
      fields: ['order_id', 'master_id']
    }
  ]
});

// Методы класса
OrderMaster.associate = function(models) {
  // Участие мастера в заказе
  OrderMaster.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order'
  });
  
  OrderMaster.belongsTo(models.Master, {
    foreignKey: 'master_id',
    as: 'master'
  });
};

// Статический метод для расчета распределения прибыли между мастерами
OrderMaster.calculateProfitDistribution = async function(orderId) {
  try {
    const { Order, Setting, Bonus } = require('./index');
    
    // Получаем заказ
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderWork, as: 'works' },
        { model: OrderMaterial, as: 'materials' },
        { model: OrderPart, as: 'parts' }
      ]
    });
    
    if (!order) {
      throw new Error('Заказ не найден');
    }
    
    // Получаем текущие настройки
    const settings = await Setting.getCurrentSettings();
    const directorPercent = settings.director_percent;
    const masterPercent = 100 - directorPercent;
    
    // Получаем всех мастеров, участвующих в заказе
    const orderMasters = await this.findAll({
      where: { order_id: orderId },
      include: [
        { model: require('./Master'), as: 'master' }
      ]
    });
    
    // Рассчитываем общую сумму работ
    const worksSum = order.works.reduce((sum, work) => sum + parseFloat(work.amount), 0);
    
    // Распределяем прибыль между мастерами
    const profitDistribution = [];
    
    for (const orderMaster of orderMasters) {
      const masterWorkAmount = parseFloat(orderMaster.work_amount);
      const masterWorkPercentage = parseFloat(orderMaster.work_percentage);
      
      // Рассчитываем долю мастера в прибыли
      let masterProfit = 0;
      
      if (masterWorkPercentage > 0) {
        // Если указан процент, используем его
        masterProfit = worksSum * (masterWorkPercentage / 100) * (masterPercent / 100);
      } else if (masterWorkAmount > 0) {
        // Если указана сумма, используем ее
        const totalWorkAmount = orderMasters.reduce((sum, om) => sum + parseFloat(om.work_amount), 0);
        if (totalWorkAmount > 0) {
          const masterShare = masterWorkAmount / totalWorkAmount;
          masterProfit = worksSum * masterShare * (masterPercent / 100);
        }
      }
      
      // Получаем бонусы мастера
      const bonuses = await Bonus.findAll({
        where: { 
          master_id: orderMaster.master_id,
          [Op.or]: [
            { order_part_id: { [Op.in]: order.parts.map(p => p.id) } },
            { order_material_id: { [Op.in]: order.materials.map(m => m.id) } }
          ]
        }
      });
      
      const bonusAmount = bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0);
      
      profitDistribution.push({
        master: orderMaster.master,
        work_amount: masterWorkAmount,
        work_percentage: masterWorkPercentage,
        profit: masterProfit,
        bonus: bonusAmount,
        total_earnings: masterProfit + bonusAmount
      });
    }
    
    // Рассчитываем долю директора
    const directorProfit = worksSum * (directorPercent / 100) + 
                          order.materials.reduce((sum, material) => sum + parseFloat(material.amount), 0) +
                          order.parts.reduce((sum, part) => sum + parseFloat(part.amount), 0);
    
    return {
      order,
      works_sum: worksSum,
      director_percent,
      director_profit: directorProfit,
      masters: profitDistribution
    };
  } catch (error) {
    throw new Error(`Ошибка при расчете распределения прибыли: ${error.message}`);
  }
};

// Статический метод для обновления участия мастеров в заказе
OrderMaster.updateMastersInOrder = async function(orderId, mastersData) {
  const transaction = await sequelize.transaction();
  
  try {
    // Удаляем все текущие записи об участии мастеров
    await this.destroy({
      where: { order_id: orderId },
      transaction
    });
    
    // Создаем новые записи об участии мастеров
    const orderMasters = mastersData.map(masterData => ({
      order_id: orderId,
      master_id: masterData.master_id,
      work_amount: masterData.work_amount || 0,
      work_percentage: masterData.work_percentage || 0
    }));
    
    await this.bulkCreate(orderMasters, { transaction });
    
    // Фиксируем транзакцию
    await transaction.commit();
    
    // Возвращаем обновленные данные об участии мастеров
    return await this.findAll({
      where: { order_id: orderId },
      include: [
        { model: require('./Master'), as: 'master' }
      ]
    });
  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await transaction.rollback();
    throw new Error(`Ошибка при обновлении мастеров в заказе: ${error.message}`);
  }
};

module.exports = OrderMaster;