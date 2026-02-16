// Централизованный обработчик ошибок

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Функция для обработки ошибок в Express
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Ошибки валидации Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }
  
  // Ошибки дублирования ключа в Mongoose
  if (err.code === 11000) {
    const message = 'Дублирующее значение поля';
    error = new AppError(message, 400);
  }
  
  // Ошибки JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Невалидный токен. Пожалуйста, войдите снова.';
    error = new AppError(message, 401);
  }
  
  // Ошибки истечения срока действия JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'Срок действия токена истек. Пожалуйста, войдите снова.';
    error = new AppError(message, 401);
  }
  
  // Ошибки Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(err.statusCode || 400).json({
      success: false,
      message: 'Ошибка валидации данных',
      errors
    });
  }
  
  // Ошибки уникальности в Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map(error => error.path);
    const message = `Дублирующее значение полей: ${fields.join(', ')}`;
    error = new AppError(message, 400);
  }
  
  // Ошибки внешнего ключа в Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Ошибка внешнего ключа';
    error = new AppError(message, 400);
  }
  
  // Ошибки проверки ограничения в Sequelize
  if (err.name === 'SequelizeDatabaseError') {
    const message = 'Ошибка базы данных';
    error = new AppError(message, 400);
  }
  
  // Отправляем ответ с ошибкой
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Функция-обертка для асинхронных функций
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync
};