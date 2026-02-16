const { Order, Master, Bonus, OrderMaster, OrderWork, OrderMaterial, OrderPart, Setting } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Получение общей статистики (только для директора и администратора)
const getGeneralStats = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для просмотра общей статистики', 403));
  }
  
  const { date_from, date_to } = req.query;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (date_from || date_to) {
    whereClause.created_at = {};
    
    if (date_from) {
      whereClause.created_at[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.created_at[Op.lte] = new Date(date_to);
    }
  }
  
  // Получаем общую статистику по заказам
  const orderStats = await Order.findAll({
    where: whereClause,
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'total_amount']
    ],
    group: ['status']
  });
  
  // Формируем объект статистики
  const stats = {
    orders: {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      total_amount: 0
    }
  };
  
  // Заполняем статистику по заказам
  orderStats.forEach(stat => {
    stats.orders.total += parseInt(stat.dataValues.count);
    stats.orders.total_amount += parseFloat(stat.dataValues.total_amount || 0);
    
    switch (stat.dataValues.status) {
      case 'pending':
        stats.orders.pending = parseInt(stat.dataValues.count);
        break;
      case 'in_progress':
        stats.orders.in_progress = parseInt(stat.dataValues.count);
        break;
      case 'completed':
        stats.orders.completed = parseInt(stat.dataValues.count);
        break;
      case 'cancelled':
        stats.orders.cancelled = parseInt(stat.dataValues.count);
        break;
    }
  });
  
  // Получаем статистику по мастерам
  const masterStats = await Master.findAll({
    where: { is_active: true },
    attributes: [
      'id',
      'full_name',
      'role'
    ],
    include: [
      {
        model: Order,
        as: 'orders',
        where: whereClause,
        required: false,
        attributes: []
      },
      {
        model: Bonus,
        as: 'bonuses',
        where: date_from || date_to ? {
          date: {}
        } : {},
        required: false,
        attributes: []
      }
    ]
  });
  
  // Рассчитываем статистику по каждому мастеру
  const masters = [];
  
  for (const master of masterStats) {
    // Получаем заказы мастера
    const masterOrders = await Order.findAll({
      include: [
        {
          model: Master,
          as: 'masters',
          where: { id: master.id },
          through: { attributes: [] },
          required: true
        }
      ],
      where: whereClause
    });
    
    // Получаем бонусы мастера
    const masterBonuses = await Bonus.findAll({
      where: {
        master_id: master.id,
        ...(date_from || date_to ? {
          date: {}
        } : {})
      }
    });
    
    // Рассчитываем статистику
    const masterData = {
      id: master.id,
      full_name: master.full_name,
      role: master.role,
      orders_count: masterOrders.length,
      completed_orders: masterOrders.filter(order => order.status === 'completed').length,
      total_amount: masterOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      bonus_amount: masterBonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0)
    };
    
    masters.push(masterData);
  }
  
  // Получаем статистику по финансам
  const financeStats = {
    total_revenue: stats.orders.total_amount,
    director_share: 0,
    masters_share: 0
  };
  
  // Получаем настройки системы
  const settings = await Setting.findOne();
  const directorPercentage = settings ? settings.director_percentage : 50;
  
  // Рассчитываем доли
  financeStats.director_share = financeStats.total_revenue * directorPercentage / 100;
  financeStats.masters_share = financeStats.total_revenue * (100 - directorPercentage) / 100;
  
  res.status(200).json({
    success: true,
    data: {
      general: stats,
      masters,
      finance: financeStats
    }
  });
});

// Получение статистики для дашборда
const getDashboardStats = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для просмотра статистики дашборда', 403));
  }
  
  const { period = 'month' } = req.query;
  
  // Определяем дату начала периода
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }
  
  // Формируем условия для поиска
  const whereClause = {
    created_at: {
      [Op.gte]: startDate
    }
  };
  
  // Получаем статистику по заказам за период
  const orders = await Order.findAll({
    where: whereClause,
    attributes: [
      'id',
      'status',
      'total_amount',
      'created_at'
    ],
    order: [['created_at', 'ASC']]
  });
  
  // Группируем заказы по дням
  const ordersByDay = {};
  
  orders.forEach(order => {
    const date = order.created_at.toISOString().split('T')[0];
    
    if (!ordersByDay[date]) {
      ordersByDay[date] = {
        date,
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        cancelled: 0,
        amount: 0
      };
    }
    
    ordersByDay[date].total += 1;
    ordersByDay[date].amount += parseFloat(order.total_amount || 0);
    
    switch (order.status) {
      case 'completed':
        ordersByDay[date].completed += 1;
        break;
      case 'in_progress':
        ordersByDay[date].in_progress += 1;
        break;
      case 'pending':
        ordersByDay[date].pending += 1;
        break;
      case 'cancelled':
        ordersByDay[date].cancelled += 1;
        break;
    }
  });
  
  // Преобразуем в массив и сортируем по дате
  const chartData = Object.values(ordersByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Получаем статистику по статусам заказов
  const statusStats = {
    pending: orders.filter(order => order.status === 'pending').length,
    in_progress: orders.filter(order => order.status === 'in_progress').length,
    completed: orders.filter(order => order.status === 'completed').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    total: orders.length
  };
  
  // Получаем финансовую статистику
  const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  
  // Получаем настройки системы
  const settings = await Setting.findOne();
  const directorPercentage = settings ? settings.director_percentage : 50;
  
  const financeStats = {
    total_revenue: totalAmount,
    director_share: totalAmount * directorPercentage / 100,
    masters_share: totalAmount * (100 - directorPercentage) / 100
  };
  
  // Получаем статистику по мастерам
  const masters = await Master.findAll({
    where: { is_active: true },
    attributes: [
      'id',
      'full_name',
      'role'
    ],
    include: [
      {
        model: Order,
        as: 'orders',
        where: whereClause,
        required: false,
        attributes: []
      }
    ]
  });
  
  // Рассчитываем статистику по каждому мастеру
  const masterStats = [];
  
  for (const master of masters) {
    // Получаем заказы мастера
    const masterOrders = await Order.findAll({
      include: [
        {
          model: Master,
          as: 'masters',
          where: { id: master.id },
          through: { attributes: [] },
          required: true
        }
      ],
      where: whereClause
    });
    
    // Рассчитываем статистику
    const masterData = {
      id: master.id,
      full_name: master.full_name,
      role: master.role,
      orders_count: masterOrders.length,
      completed_orders: masterOrders.filter(order => order.status === 'completed').length,
      total_amount: masterOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    };
    
    masterStats.push(masterData);
  }
  
  // Сортируем мастеров по количеству заказов
  masterStats.sort((a, b) => b.orders_count - a.orders_count);
  
  res.status(200).json({
    success: true,
    data: {
      chart: {
        data: chartData,
        period
      },
      status: statusStats,
      finance: financeStats,
      masters: masterStats
    }
  });
});

// Получение статистики для мастера
const getMasterStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Проверка прав доступа: мастер может видеть только свою статистику
  if (req.user.role === config.roles.MASTER && req.user.id !== parseInt(id)) {
    return next(new AppError('У вас нет прав для просмотра этой статистики', 403));
  }
  
  const { period = 'month' } = req.query;
  
  // Находим мастера
  const master = await Master.findByPk(id);
  
  if (!master) {
    return next(new AppError('Мастер не найден', 404));
  }
  
  // Определяем дату начала периода
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }
  
  // Формируем условия для поиска
  const whereClause = {
    created_at: {
      [Op.gte]: startDate
    }
  };
  
  // Получаем заказы мастера
  const orders = await Order.findAll({
    include: [
      {
        model: Master,
        as: 'masters',
        where: { id: master.id },
        through: { attributes: [] },
        required: true
      }
    ],
    where: whereClause,
    attributes: [
      'id',
      'status',
      'total_amount',
      'created_at'
    ],
    order: [['created_at', 'ASC']]
  });
  
  // Группируем заказы по дням
  const ordersByDay = {};
  
  orders.forEach(order => {
    const date = order.created_at.toISOString().split('T')[0];
    
    if (!ordersByDay[date]) {
      ordersByDay[date] = {
        date,
        total: 0,
        completed: 0,
        in_progress: 0,
        pending: 0,
        cancelled: 0,
        amount: 0
      };
    }
    
    ordersByDay[date].total += 1;
    ordersByDay[date].amount += parseFloat(order.total_amount || 0);
    
    switch (order.status) {
      case 'completed':
        ordersByDay[date].completed += 1;
        break;
      case 'in_progress':
        ordersByDay[date].in_progress += 1;
        break;
      case 'pending':
        ordersByDay[date].pending += 1;
        break;
      case 'cancelled':
        ordersByDay[date].cancelled += 1;
        break;
    }
  });
  
  // Преобразуем в массив и сортируем по дате
  const chartData = Object.values(ordersByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Получаем статистику по статусам заказов
  const statusStats = {
    pending: orders.filter(order => order.status === 'pending').length,
    in_progress: orders.filter(order => order.status === 'in_progress').length,
    completed: orders.filter(order => order.status === 'completed').length,
    cancelled: orders.filter(order => order.status === 'cancelled').length,
    total: orders.length
  };
  
  // Получаем финансовую статистику
  const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
  
  // Получаем бонусы мастера
  const bonuses = await Bonus.findAll({
    where: {
      master_id: master.id,
      date: {
        [Op.gte]: startDate
      }
    }
  });
  
  const totalBonusAmount = bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0);
  
  // Получаем настройки системы
  const settings = await Setting.findOne();
  const directorPercentage = settings ? settings.director_percentage : 50;
  
  const financeStats = {
    total_revenue: totalAmount,
    director_share: totalAmount * directorPercentage / 100,
    master_share: totalAmount * (100 - directorPercentage) / 100,
    bonus_amount: totalBonusAmount
  };
  
  res.status(200).json({
    success: true,
    data: {
      master: {
        id: master.id,
        full_name: master.full_name,
        role: master.role
      },
      chart: {
        data: chartData,
        period
      },
      status: statusStats,
      finance: financeStats
    }
  });
});

// Экспорт статистики в Excel (только для директора и администратора)
const exportStatsToExcel = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для экспорта статистики', 403));
  }
  
  const { date_from, date_to } = req.query;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (date_from || date_to) {
    whereClause.created_at = {};
    
    if (date_from) {
      whereClause.created_at[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.created_at[Op.lte] = new Date(date_to);
    }
  }
  
  // Получаем заказы
  const orders = await Order.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'masters',
        through: { attributes: [] }
      },
      {
        model: OrderMaster,
        as: 'orderMasters',
        include: [
          {
            model: OrderWork,
            as: 'works'
          },
          {
            model: OrderMaterial,
            as: 'materials'
          },
          {
            model: OrderPart,
            as: 'parts'
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });
  
  // Формируем данные для экспорта
  const exportData = [];
  
  // Заголовки
  exportData.push([
    'ID заказа',
    'Клиент',
    'Телефон',
    'Автомобиль',
    'Год',
    'Статус',
    'Мастера',
    'Работы',
    'Материалы',
    'Запчасти',
    'Общая сумма',
    'Дата создания'
  ]);
  
  // Данные
  for (const order of orders) {
    // Формируем список мастеров
    const mastersList = order.masters.map(master => master.full_name).join(', ');
    
    // Формируем список работ
    const worksList = [];
    for (const orderMaster of order.orderMasters) {
      for (const work of orderMaster.works) {
        worksList.push(`${work.name}: ${work.price}`);
      }
    }
    
    // Формируем список материалов
    const materialsList = [];
    for (const orderMaster of order.orderMasters) {
      for (const material of orderMaster.materials) {
        materialsList.push(`${material.name} (${material.quantity} шт.): ${material.price}`);
      }
    }
    
    // Формируем список запчастей
    const partsList = [];
    for (const orderMaster of order.orderMasters) {
      for (const part of orderMaster.parts) {
        partsList.push(`${part.name} (${part.quantity} шт.): ${part.price}`);
      }
    }
    
    // Добавляем строку с данными
    exportData.push([
      order.id,
      order.client_name,
      order.client_phone,
      order.car_model,
      order.car_year || '',
      order.status,
      mastersList,
      worksList.join('; '),
      materialsList.join('; '),
      partsList.join('; '),
      order.total_amount || 0,
      order.created_at.toISOString().split('T')[0]
    ]);
  }
  
  // Возвращаем данные для экспорта
  res.status(200).json({
    success: true,
    data: {
      exportData
    }
  });
});

module.exports = {
  getGeneralStats,
  getDashboardStats,
  getMasterStats,
  exportStatsToExcel
};