const { Order, Master, OrderMaster, OrderWork, OrderMaterial, OrderPart, Setting, Bonus } = require('../models');
const { Op } = require('sequelize');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Получение всех заказов
const getAllOrders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status, date_from, date_to, search } = req.query;
  
  const offset = (page - 1) * limit;
  
  // Формируем условия для поиска
  const whereClause = {};
  
  if (status) {
    whereClause.status = status;
  }
  
  if (date_from || date_to) {
    whereClause.created_at = {};
    
    if (date_from) {
      whereClause.created_at[Op.gte] = new Date(date_from);
    }
    
    if (date_to) {
      whereClause.created_at[Op.lte] = new Date(date_to);
    }
  }
  
  // Формируем условия для поиска по клиенту или автомобилю
  if (search) {
    whereClause[Op.or] = [
      { client_name: { [Op.iLike]: `%${search}%` } },
      { client_phone: { [Op.iLike]: `%${search}%` } },
      { car_model: { [Op.iLike]: `%${search}%` } },
      { car_number: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  // Определяем, какие заказы может видеть пользователь
  let includeCondition = {};
  
  if (req.user.role === config.roles.MASTER) {
    // Мастер может видеть только свои заказы
    includeCondition = {
      model: Master,
      as: 'masters',
      where: { id: req.user.id },
      through: { attributes: [] }
    };
  } else {
    // Директор и администратор видят все заказы
    includeCondition = {
      model: Master,
      as: 'masters',
      through: { attributes: [] }
    };
  }
  
  // Получаем заказы с пагинацией
  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    include: [
      includeCondition,
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
  });
  
  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: {
      orders
    }
  });
});

// Получение информации о заказе по ID
const getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const order = await Order.findByPk(id, {
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
    ]
  });
  
  if (!order) {
    return next(new AppError('Заказ не найден', 404));
  }
  
  // Проверка прав доступа: мастер может видеть только свои заказы
  if (req.user.role === config.roles.MASTER) {
    const isMasterAssigned = order.masters.some(master => master.id === req.user.id);
    
    if (!isMasterAssigned) {
      return next(new AppError('У вас нет прав для просмотра этого заказа', 403));
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      order
    }
  });
});

// Создание нового заказа
const createOrder = catchAsync(async (req, res, next) => {
  const {
    client_name,
    client_phone,
    car_model,
    car_number,
    car_year,
    problem_description,
    masters,
    works,
    materials,
    parts
  } = req.body;
  
  // Проверяем, что указаны обязательные поля
  if (!client_name || !client_phone || !car_model || !car_number) {
    return next(new AppError('Пожалуйста, укажите все обязательные поля', 400));
  }
  
  // Проверяем, что указан хотя бы один мастер
  if (!masters || masters.length === 0) {
    return next(new AppError('Пожалуйста, укажите хотя бы одного мастера', 400));
  }
  
  // Проверяем, что все указанные мастера существуют
  const masterIds = masters.map(m => m.id);
  const existingMasters = await Master.findAll({
    where: { id: { [Op.in]: masterIds }, is_active: true }
  });
  
  if (existingMasters.length !== masterIds.length) {
    return next(new AppError('Один или несколько указанных мастеров не найдены или неактивны', 400));
  }
  
  // Получаем настройки системы
  const settings = await Setting.findOne();
  const directorPercentage = settings ? settings.director_percentage : 50;
  
  // Создаем заказ
  const order = await Order.create({
    client_name,
    client_phone,
    car_model,
    car_number,
    car_year,
    problem_description,
    status: 'pending',
    created_by: req.user.id
  });
  
  // Добавляем мастеров к заказу
  for (const master of masters) {
    await OrderMaster.create({
      order_id: order.id,
      master_id: master.id,
      work_percentage: master.work_percentage || (100 / masters.length)
    });
  }
  
  // Добавляем работы, если они указаны
  if (works && works.length > 0) {
    for (const work of works) {
      await OrderWork.create({
        order_id: order.id,
        name: work.name,
        price: work.price || 0
      });
    }
  }
  
  // Добавляем материалы, если они указаны
  if (materials && materials.length > 0) {
    for (const material of materials) {
      await OrderMaterial.create({
        order_id: order.id,
        name: material.name,
        quantity: material.quantity || 1,
        price: material.price || 0
      });
    }
  }
  
  // Добавляем запчасти, если они указаны
  if (parts && parts.length > 0) {
    for (const part of parts) {
      await OrderPart.create({
        order_id: order.id,
        name: part.name,
        quantity: part.quantity || 1,
        price: part.price || 0
      });
    }
  }
  
  // Рассчитываем общую стоимость заказа
  const orderWithDetails = await Order.findByPk(order.id, {
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
  });
  
  // Рассчитываем общую стоимость
  let totalAmount = 0;
  
  for (const orderMaster of orderWithDetails.orderMasters) {
    // Стоимость работ
    const worksTotal = orderMaster.works.reduce((sum, work) => sum + parseFloat(work.price), 0);
    
    // Стоимость материалов
    const materialsTotal = orderMaster.materials.reduce((sum, material) => 
      sum + (parseFloat(material.price) * parseFloat(material.quantity)), 0);
    
    // Стоимость запчастей
    const partsTotal = orderMaster.parts.reduce((sum, part) => 
      sum + (parseFloat(part.price) * parseFloat(part.quantity)), 0);
    
    // Общая стоимость для этого мастера
    const masterTotal = worksTotal + materialsTotal + partsTotal;
    
    // Добавляем к общей стоимости заказа
    totalAmount += masterTotal;
  }
  
  // Обновляем общую стоимость заказа
  order.total_amount = totalAmount;
  await order.save();
  
  // Получаем обновленный заказ
  const updatedOrder = await Order.findByPk(order.id, {
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
    ]
  });
  
  res.status(201).json({
    success: true,
    message: 'Заказ успешно создан',
    data: {
      order: updatedOrder
    }
  });
});

// Обновление информации о заказе
const updateOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const {
    client_name,
    client_phone,
    car_model,
    car_number,
    car_year,
    problem_description,
    status,
    masters,
    works,
    materials,
    parts
  } = req.body;
  
  // Находим заказ
  const order = await Order.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'masters',
        through: { attributes: [] }
      }
    ]
  });
  
  if (!order) {
    return next(new AppError('Заказ не найден', 404));
  }
  
  // Проверка прав доступа: мастер может редактировать только свои заказы
  if (req.user.role === config.roles.MASTER) {
    const isMasterAssigned = order.masters.some(master => master.id === req.user.id);
    
    if (!isMasterAssigned) {
      return next(new AppError('У вас нет прав для редактирования этого заказа', 403));
    }
  }
  
  // Обновляем основные поля заказа
  if (client_name) order.client_name = client_name;
  if (client_phone) order.client_phone = client_phone;
  if (car_model) order.car_model = car_model;
  if (car_number) order.car_number = car_number;
  if (car_year) order.car_year = car_year;
  if (problem_description) order.problem_description = problem_description;
  if (status) order.status = status;
  
  // Сохраняем изменения
  await order.save();
  
  // Обновляем мастеров, если они указаны
  if (masters && masters.length > 0) {
    // Удаляем существующих мастеров
    await OrderMaster.destroy({ where: { order_id: order.id } });
    
    // Добавляем новых мастеров
    for (const master of masters) {
      await OrderMaster.create({
        order_id: order.id,
        master_id: master.id,
        work_percentage: master.work_percentage || (100 / masters.length)
      });
    }
  }
  
  // Обновляем работы, если они указаны
  if (works) {
    // Удаляем существующие работы
    await OrderWork.destroy({ where: { order_id: order.id } });
    
    // Добавляем новые работы
    if (works.length > 0) {
      for (const work of works) {
        await OrderWork.create({
          order_id: order.id,
          name: work.name,
          price: work.price || 0
        });
      }
    }
  }
  
  // Обновляем материалы, если они указаны
  if (materials) {
    // Удаляем существующие материалы
    await OrderMaterial.destroy({ where: { order_id: order.id } });
    
    // Добавляем новые материалы
    if (materials.length > 0) {
      for (const material of materials) {
        await OrderMaterial.create({
          order_id: order.id,
          name: material.name,
          quantity: material.quantity || 1,
          price: material.price || 0
        });
      }
    }
  }
  
  // Обновляем запчасти, если они указаны
  if (parts) {
    // Удаляем существующие запчасти
    await OrderPart.destroy({ where: { order_id: order.id } });
    
    // Добавляем новые запчасти
    if (parts.length > 0) {
      for (const part of parts) {
        await OrderPart.create({
          order_id: order.id,
          name: part.name,
          quantity: part.quantity || 1,
          price: part.price || 0
        });
      }
    }
  }
  
  // Рассчитываем общую стоимость заказа
  const orderWithDetails = await Order.findByPk(order.id, {
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
  });
  
  // Рассчитываем общую стоимость
  let totalAmount = 0;
  
  for (const orderMaster of orderWithDetails.orderMasters) {
    // Стоимость работ
    const worksTotal = orderMaster.works.reduce((sum, work) => sum + parseFloat(work.price), 0);
    
    // Стоимость материалов
    const materialsTotal = orderMaster.materials.reduce((sum, material) => 
      sum + (parseFloat(material.price) * parseFloat(material.quantity)), 0);
    
    // Стоимость запчастей
    const partsTotal = orderMaster.parts.reduce((sum, part) => 
      sum + (parseFloat(part.price) * parseFloat(part.quantity)), 0);
    
    // Общая стоимость для этого мастера
    const masterTotal = worksTotal + materialsTotal + partsTotal;
    
    // Добавляем к общей стоимости заказа
    totalAmount += masterTotal;
  }
  
  // Обновляем общую стоимость заказа
  order.total_amount = totalAmount;
  await order.save();
  
  // Получаем обновленный заказ
  const updatedOrder = await Order.findByPk(order.id, {
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
    ]
  });
  
  res.status(200).json({
    success: true,
    message: 'Информация о заказе успешно обновлена',
    data: {
      order: updatedOrder
    }
  });
});

// Удаление заказа
const deleteOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Находим заказ
  const order = await Order.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'masters',
        through: { attributes: [] }
      }
    ]
  });
  
  if (!order) {
    return next(new AppError('Заказ не найден', 404));
  }
  
  // Проверка прав доступа: мастер может удалять только свои заказы
  if (req.user.role === config.roles.MASTER) {
    const isMasterAssigned = order.masters.some(master => master.id === req.user.id);
    
    if (!isMasterAssigned) {
      return next(new AppError('У вас нет прав для удаления этого заказа', 403));
    }
  }
  
  // Удаляем связанные записи
  await OrderMaster.destroy({ where: { order_id: order.id } });
  await OrderWork.destroy({ where: { order_id: order.id } });
  await OrderMaterial.destroy({ where: { order_id: order.id } });
  await OrderPart.destroy({ where: { order_id: order.id } });
  
  // Удаляем заказ
  await order.destroy();
  
  res.status(200).json({
    success: true,
    message: 'Заказ успешно удален'
  });
});

// Изменение статуса заказа
const changeOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Проверяем, что статус является допустимым
  const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return next(new AppError('Недопустимый статус заказа', 400));
  }
  
  // Находим заказ
  const order = await Order.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'masters',
        through: { attributes: [] }
      }
    ]
  });
  
  if (!order) {
    return next(new AppError('Заказ не найден', 404));
  }
  
  // Проверка прав доступа: мастер может изменять статус только своих заказов
  if (req.user.role === config.roles.MASTER) {
    const isMasterAssigned = order.masters.some(master => master.id === req.user.id);
    
    if (!isMasterAssigned) {
      return next(new AppError('У вас нет прав для изменения статуса этого заказа', 403));
    }
  }
  
  // Обновляем статус
  order.status = status;
  
  // Если статус "completed", устанавливаем дату завершения
  if (status === 'completed') {
    order.completed_at = new Date();
  } else {
    order.completed_at = null;
  }
  
  // Сохраняем изменения
  await order.save();
  
  // Если заказ завершен, начисляем бонусы мастерам
  if (status === 'completed') {
    // Получаем настройки системы
    const settings = await Setting.findOne();
    const directorPercentage = settings ? settings.director_percentage : 50;
    
    // Получаем мастеров заказа
    const orderMasters = await OrderMaster.findAll({
      where: { order_id: order.id },
      include: [
        {
          model: Master,
          as: 'master'
        }
      ]
    });
    
    // Рассчитываем общую стоимость заказа
    const orderWithDetails = await Order.findByPk(order.id, {
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
    });
    
    let totalAmount = 0;
    
    for (const orderMaster of orderWithDetails.orderMasters) {
      // Стоимость работ
      const worksTotal = orderMaster.works.reduce((sum, work) => sum + parseFloat(work.price), 0);
      
      // Стоимость материалов
      const materialsTotal = orderMaster.materials.reduce((sum, material) => 
        sum + (parseFloat(material.price) * parseFloat(material.quantity)), 0);
      
      // Стоимость запчастей
      const partsTotal = orderMaster.parts.reduce((sum, part) => 
        sum + (parseFloat(part.price) * parseFloat(part.quantity)), 0);
      
      // Общая стоимость для этого мастера
      const masterTotal = worksTotal + materialsTotal + partsTotal;
      
      // Добавляем к общей стоимости заказа
      totalAmount += masterTotal;
    }
    
    // Начисляем бонусы мастерам
    for (const orderMaster of orderMasters) {
      // Рассчитываем долю мастера
      const masterPercentage = orderMaster.work_percentage;
      const masterAmount = (totalAmount * masterPercentage) / 100;
      
      // Рассчитываем бонус мастера (часть, которая остается мастеру)
      const masterBonus = masterAmount * (100 - directorPercentage) / 100;
      
      // Начисляем бонус
      await Bonus.create({
        master_id: orderMaster.master_id,
        order_id: order.id,
        amount: masterBonus,
        percentage: 100 - directorPercentage,
        date: new Date()
      });
    }
  }
  
  // Получаем обновленный заказ
  const updatedOrder = await Order.findByPk(order.id, {
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
    ]
  });
  
  res.status(200).json({
    success: true,
    message: 'Статус заказа успешно изменен',
    data: {
      order: updatedOrder
    }
  });
});

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  changeOrderStatus
};