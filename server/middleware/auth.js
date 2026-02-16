const jwt = require('jsonwebtoken');
const { Master } = require('../models');
const config = require('../config/config');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен отсутствует'
      });
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Находим пользователя в базе данных
    const master = await Master.findByPk(decoded.id);
    
    if (!master) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Проверяем, что пользователь активен
    if (!master.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь неактивен'
      });
    }
    
    // Добавляем информацию о пользователе в запрос
    req.user = {
      id: master.id,
      full_name: master.full_name,
      phone: master.phone,
      role: master.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Невалидный токен'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Срок действия токена истек'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Ошибка сервера',
        error: error.message
      });
    }
  }
};

// Middleware для проверки роли пользователя
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для выполнения действия'
      });
    }
    
    next();
  };
};

// Middleware для проверки прав доступа к заказу
const checkOrderAccess = async (req, res, next) => {
  try {
    const { Order } = require('../models');
    const orderId = req.params.id;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'ID заказа не указан'
      });
    }
    
    // Находим заказ
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Заказ не найден'
      });
    }
    
    // Проверяем права доступа
    // Мастер может видеть только свои заказы
    if (req.user.role === config.roles.MASTER && order.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для доступа к этому заказу'
      });
    }
    
    // Добавляем заказ в запрос
    req.order = order;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
};

// Middleware для проверки прав доступа к мастеру
const checkMasterAccess = async (req, res, next) => {
  try {
    const masterId = req.params.id;
    
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'ID мастера не указан'
      });
    }
    
    // Находим мастера
    const master = await Master.findByPk(masterId);
    
    if (!master) {
      return res.status(404).json({
        success: false,
        message: 'Мастер не найден'
      });
    }
    
    // Проверяем права доступа
    // Мастер может видеть только свой профиль
    if (req.user.role === config.roles.MASTER && master.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для доступа к этому мастеру'
      });
    }
    
    // Добавляем мастера в запрос
    req.master = master;
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  protect: authenticateToken, // Псевдоним для authenticateToken для обратной совместимости
  checkRole,
  checkOrderAccess,
  checkMasterAccess
};