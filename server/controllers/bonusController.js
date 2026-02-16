const { Bonus, Master, Order } = require('../models');
const { Op } = require('sequelize');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Получение всех бонусов (только для директора и администратора)
const getAllBonuses = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для просмотра всех бонусов', 403));
  }
  
  const { page = 1, limit = 10, master_id, date_from, date_to } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (master_id) {
    whereClause.master_id = master_id;
  }
  
  if (date_from || date_to) {
    whereClause.date = {};
    
    if (date_from) {
      whereClause.date[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.date[Op.lte] = new Date(date_to);
    }
  }
  
  // Получаем бонусы с пагинацией
  const { count, rows: bonuses } = await Bonus.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['date', 'DESC']],
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['id', 'full_name', 'role']
      },
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'client_name', 'car_model', 'car_number', 'total_amount', 'status']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: {
      bonuses
    }
  });
});

// Получение бонусов текущего мастера
const getMyBonuses = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.MASTER) {
    return next(new AppError('Эта функция доступна только мастерам', 403));
  }
  
  const { page = 1, limit = 10, date_from, date_to } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Формируем условия для поиска
  const whereClause = {
    master_id: req.user.id
  };
  
  if (date_from || date_to) {
    whereClause.date = {};
    
    if (date_from) {
      whereClause.date[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.date[Op.lte] = new Date(date_to);
    }
  }
  
  // Получаем бонусы с пагинацией
  const { count, rows: bonuses } = await Bonus.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['date', 'DESC']],
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'client_name', 'car_model', 'car_number', 'total_amount', 'status']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: {
      bonuses
    }
  });
});

// Получение информации о бонусе по ID
const getBonusById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const bonus = await Bonus.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['id', 'full_name', 'role']
      },
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: Master,
            as: 'masters',
            through: { attributes: [] }
          }
        ]
      }
    ]
  });
  
  if (!bonus) {
    return next(new AppError('Бонус не найден', 404));
  }
  
  // Проверка прав доступа: мастер может видеть только свои бонусы
  if (req.user.role === config.roles.MASTER && bonus.master_id !== req.user.id) {
    return next(new AppError('У вас нет прав для просмотра этого бонуса', 403));
  }
  
  res.status(200).json({
    success: true,
    data: {
      bonus
    }
  });
});

// Создание нового бонуса (только для директора и администратора)
const createBonus = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для создания бонусов', 403));
  }
  
  const { master_id, order_id, amount, percentage, date } = req.body;
  
  // Проверяем, что указаны обязательные поля
  if (!master_id || !order_id || !amount) {
    return next(new AppError('Пожалуйста, укажите все обязательные поля', 400));
  }
  
  // Проверяем, что мастер существует и активен
  const master = await Master.findOne({
    where: { id: master_id, is_active: true }
  });
  
  if (!master) {
    return next(new AppError('Мастер не найден или неактивен', 404));
  }
  
  // Проверяем, что заказ существует
  const order = await Order.findByPk(order_id);
  
  if (!order) {
    return next(new AppError('Заказ не найден', 404));
  }
  
  // Создаем бонус
  const bonus = await Bonus.create({
    master_id,
    order_id,
    amount,
    percentage: percentage || 0,
    date: date || new Date()
  });
  
  // Получаем созданный бонус с связанными данными
  const createdBonus = await Bonus.findByPk(bonus.id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['id', 'full_name', 'role']
      },
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'client_name', 'car_model', 'car_number', 'total_amount', 'status']
      }
    ]
  });
  
  res.status(201).json({
    success: true,
    message: 'Бонус успешно создан',
    data: {
      bonus: createdBonus
    }
  });
});

// Обновление информации о бонусе (только для директора и администратора)
const updateBonus = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для обновления бонусов', 403));
  }
  
  const { id } = req.params;
  const { master_id, order_id, amount, percentage, date } = req.body;
  
  // Находим бонус
  const bonus = await Bonus.findByPk(id);
  
  if (!bonus) {
    return next(new AppError('Бонус не найден', 404));
  }
  
  // Если указан новый мастер, проверяем, что он существует и активен
  if (master_id) {
    const master = await Master.findOne({
      where: { id: master_id, is_active: true }
    });
    
    if (!master) {
      return next(new AppError('Мастер не найден или неактивен', 404));
    }
    
    bonus.master_id = master_id;
  }
  
  // Если указан новый заказ, проверяем, что он существует
  if (order_id) {
    const order = await Order.findByPk(order_id);
    
    if (!order) {
      return next(new AppError('Заказ не найден', 404));
    }
    
    bonus.order_id = order_id;
  }
  
  // Обновляем остальные поля
  if (amount !== undefined) bonus.amount = amount;
  if (percentage !== undefined) bonus.percentage = percentage;
  if (date !== undefined) bonus.date = date;
  
  // Сохраняем изменения
  await bonus.save();
  
  // Получаем обновленный бонус с связанными данными
  const updatedBonus = await Bonus.findByPk(bonus.id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['id', 'full_name', 'role']
      },
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'client_name', 'car_model', 'car_number', 'total_amount', 'status']
      }
    ]
  });
  
  res.status(200).json({
    success: true,
    message: 'Информация о бонусе успешно обновлена',
    data: {
      bonus: updatedBonus
    }
  });
});

// Удаление бонуса (только для директора и администратора)
const deleteBonus = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для удаления бонусов', 403));
  }
  
  const { id } = req.params;
  
  // Находим бонус
  const bonus = await Bonus.findByPk(id);
  
  if (!bonus) {
    return next(new AppError('Бонус не найден', 404));
  }
  
  // Удаляем бонус
  await bonus.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Бонус успешно удален'
  });
});

// Получение статистики по бонусам
const getBonusStats = catchAsync(async (req, res, next) => {
  const { master_id, date_from, date_to } = req.query;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (master_id) {
    // Проверка прав доступа: мастер может видеть только свою статистику
    if (req.user.role === config.roles.MASTER && parseInt(master_id) !== req.user.id) {
      return next(new AppError('У вас нет прав для просмотра этой статистики', 403));
    }
    
    whereClause.master_id = master_id;
  } else if (req.user.role === config.roles.MASTER) {
    // Если мастер не указал ID, показываем его статистику
    whereClause.master_id = req.user.id;
  }
  
  if (date_from || date_to) {
    whereClause.date = {};
    
    if (date_from) {
      whereClause.date[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.date[Op.lte] = new Date(date_to);
    }
  }
  
  // Получаем бонусы
  const bonuses = await Bonus.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['id', 'full_name', 'role']
      },
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'status']
      }
    ]
  });
  
  // Рассчитываем статистику
  const stats = {
    totalBonuses: bonuses.length,
    totalAmount: bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0),
    
    // Количество бонусов по статусам заказов
    completedOrdersBonuses: bonuses.filter(bonus => bonus.order.status === 'completed').length,
    completedOrdersAmount: bonuses
      .filter(bonus => bonus.order.status === 'completed')
      .reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0),
    
    inProgressOrdersBonuses: bonuses.filter(bonus => bonus.order.status === 'in_progress').length,
    inProgressOrdersAmount: bonuses
      .filter(bonus => bonus.order.status === 'in_progress')
      .reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0),
    
    pendingOrdersBonuses: bonuses.filter(bonus => bonus.order.status === 'pending').length,
    pendingOrdersAmount: bonuses
      .filter(bonus => bonus.order.status === 'pending')
      .reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0),
    
    // Средний размер бонуса
    averageBonus: bonuses.length > 0 
      ? bonuses.reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0) / bonuses.length 
      : 0
  };
  
  // Если указан мастер, добавляем информацию о нем
  let masterInfo = null;
  
  if (master_id || req.user.role === config.roles.MASTER) {
    const masterId = master_id ? parseInt(master_id) : req.user.id;
    const master = await Master.findByPk(masterId, {
      attributes: ['id', 'full_name', 'role']
    });
    
    if (master) {
      masterInfo = {
        id: master.id,
        full_name: master.full_name,
        role: master.role
      };
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      master: masterInfo,
      stats
    }
  });
});

module.exports = {
  getAllBonuses,
  getMyBonuses,
  getBonusById,
  createBonus,
  updateBonus,
  deleteBonus,
  getBonusStats
};