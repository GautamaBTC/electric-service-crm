const { Master, Order, OrderMaster, Bonus } = require('../models');
const { Op } = require('sequelize');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Получение всех мастеров (только для директора и администратора)
const getAllMasters = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для выполнения этой операции', 403));
  }
  
  const { page = 1, limit = 10, search, is_active } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (is_active !== undefined) {
    whereClause.is_active = is_active === 'true';
  }
  
  // Получаем мастеров с пагинацией
  const { count, rows: masters } = await Master.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['full_name', 'ASC']],
    attributes: { exclude: ['password_hash'] }
  });
  
  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: {
      masters
    }
  });
});

// Получение информации о мастере по ID
const getMasterById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Проверка прав доступа: мастер может видеть только свой профиль, директор и администратор - все профили
  if (req.user.role === config.roles.MASTER && req.user.id !== parseInt(id)) {
    return next(new AppError('У вас нет прав для просмотра этого профиля', 403));
  }
  
  const master = await Master.findByPk(id, {
    attributes: { exclude: ['password_hash'] },
    include: [
      {
        model: Order,
        as: 'orders',
        through: { attributes: [] },
        include: [
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
        ]
      },
      {
        model: Bonus,
        as: 'bonuses'
      }
    ]
  });
  
  if (!master) {
    return next(new AppError('Мастер не найден', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      master
    }
  });
});

// Создание нового мастера (только для директора и администратора)
const createMaster = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для выполнения этой операции', 403));
  }
  
  const { full_name, phone, password, role, is_active } = req.body;
  
  // Проверяем, что роль является допустимой
  if (role && !Object.values(config.roles).includes(role)) {
    return next(new AppError('Недопустимая роль пользователя', 400));
  }
  
  // Проверяем, что мастер с таким телефоном еще не существует
  const existingMaster = await Master.findOne({ where: { phone } });
  
  if (existingMaster) {
    return next(new AppError('Мастер с таким телефоном уже существует', 400));
  }
  
  // Хешируем пароль
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Создаем нового мастера
  const master = await Master.create({
    full_name,
    phone,
    password_hash: hashedPassword,
    role: role || config.roles.MASTER,
    is_active: is_active !== undefined ? is_active : true
  });
  
  // Удаляем пароль из ответа
  master.password_hash = undefined;
  
  res.status(201).json({
    success: true,
    message: 'Мастер успешно создан',
    data: {
      master
    }
  });
});

// Обновление информации о мастере (только для директора и администратора)
const updateMaster = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для выполнения этой операции', 403));
  }
  
  const { full_name, phone, password, role, is_active } = req.body;
  
  // Находим мастера
  const master = await Master.findByPk(id);
  
  if (!master) {
    return next(new AppError('Мастер не найден', 404));
  }
  
  // Проверяем, что роль является допустимой
  if (role && !Object.values(config.roles).includes(role)) {
    return next(new AppError('Недопустимая роль пользователя', 400));
  }
  
  // Если указан новый телефон, проверяем, что он не занят
  if (phone && phone !== master.phone) {
    const existingMaster = await Master.findOne({ where: { phone } });
    
    if (existingMaster) {
      return next(new AppError('Мастер с таким телефоном уже существует', 400));
    }
    
    master.phone = phone;
  }
  
  // Обновляем остальные поля
  if (full_name) master.full_name = full_name;
  if (role) master.role = role;
  if (is_active !== undefined) master.is_active = is_active;
  
  // Если указан новый пароль, хешируем его
  if (password) {
    const bcrypt = require('bcryptjs');
    master.password_hash = await bcrypt.hash(password, 12);
  }
  
  // Сохраняем изменения
  await master.save();
  
  // Удаляем пароль из ответа
  master.password_hash = undefined;
  
  res.status(200).json({
    success: true,
    message: 'Информация о мастере успешно обновлена',
    data: {
      master
    }
  });
});

// Удаление мастера (только для директора и администратора)
const deleteMaster = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для выполнения этой операции', 403));
  }
  
  // Находим мастера
  const master = await Master.findByPk(id);
  
  if (!master) {
    return next(new AppError('Мастер не найден', 404));
  }
  
  // Проверяем, что мастер не является директором или администратором
  if (master.role === config.roles.DIRECTOR || master.role === config.roles.ADMIN) {
    return next(new AppError('Невозможно удалить директора или администратора', 400));
  }
  
  // Удаляем мастера
  await master.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Мастер успешно удален'
  });
});

// Получение статистики по мастеру
const getMasterStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Проверка прав доступа: мастер может видеть только свою статистику, директор и администратор - всю статистику
  if (req.user.role === config.roles.MASTER && req.user.id !== parseInt(id)) {
    return next(new AppError('У вас нет прав для просмотра этой статистики', 403));
  }
  
  const master = await Master.findByPk(id);
  
  if (!master) {
    return next(new AppError('Мастер не найден', 404));
  }
  
  // Получаем заказы мастера
  const orders = await Order.findAll({
    include: [
      {
        model: Master,
        as: 'masters',
        where: { id: master.id },
        through: { attributes: [] }
      }
    ]
  });
  
  // Рассчитываем статистику
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(order => order.status === 'completed').length,
    inProgressOrders: orders.filter(order => order.status === 'in_progress').length,
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
    
    // Суммарная стоимость заказов
    totalAmount: orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
    
    // Средняя стоимость заказа
    averageAmount: orders.length > 0 
      ? orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) / orders.length 
      : 0
  };
  
  res.status(200).json({
    success: true,
    data: {
      master: {
        id: master.id,
        full_name: master.full_name,
        role: master.role
      },
      stats
    }
  });
});

module.exports = {
  getAllMasters,
  getMasterById,
  createMaster,
  updateMaster,
  deleteMaster,
  getMasterStats
};