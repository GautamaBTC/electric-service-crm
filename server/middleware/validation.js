const { validationResult, body } = require('express-validator');
const config = require('../config/config');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      errors: errors.array()
    });
  }
  
  next();
};

// Валидация для создания/обновления мастера
const validateMaster = [
  // Проверка поля full_name
  body('full_name')
    .notEmpty().withMessage('Полное имя мастера обязательно для заполнения')
    .isLength({ min: 2, max: 100 }).withMessage('Полное имя должно содержать от 2 до 100 символов'),
  
  // Проверка поля phone (необязательное)
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/i).withMessage('Неверный формат номера телефона'),
  
  // Проверка поля role
  body('role')
    .optional({ checkFalsy: true })
    .isIn([config.roles.ADMIN, config.roles.DIRECTOR, config.roles.MASTER]).withMessage('Недопустимая роль')
];

// Валидация для создания/обновления заказа
const validateOrder = [
  // Проверка поля vehicle_name
  body('vehicle_name')
    .notEmpty().withMessage('Марка автомобиля обязательна для заполнения')
    .isLength({ min: 1, max: 100 }).withMessage('Марка автомобиля должна содержать от 1 до 100 символов'),
  
  // Проверка поля plate_number
  body('plate_number')
    .notEmpty().withMessage('Государственный номер обязателен для заполнения')
    .isLength({ min: 1, max: 20 }).withMessage('Государственный номер должен содержать от 1 до 20 символов'),
  
  // Проверка поля owner_phone
  body('owner_phone')
    .notEmpty().withMessage('Телефон владельца обязателен для заполнения')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/i).withMessage('Неверный формат номера телефона'),
  
  // Проверка поля status
  body('status')
    .optional({ checkFalsy: true })
    .isIn([config.orderStatuses.IN_PROGRESS, config.orderStatuses.COMPLETED]).withMessage('Недопустимый статус заказа'),
  
  // Проверка поля payment_method
  body('payment_method')
    .optional({ checkFalsy: true })
    .isIn([config.paymentMethods.CASH, config.paymentMethods.TERMINAL, config.paymentMethods.TRANSFER]).withMessage('Недопустимый способ оплаты'),
  
  // Проверка поля bank (только если payment_method = 'перевод')
  body('bank')
    .optional({ checkFalsy: true })
    .custom((value, { req }) => {
      if (req.body.payment_method === config.paymentMethods.TRANSFER && !value) {
        throw new Error('Банк обязателен при оплате переводом');
      }
      if (value && !config.banks.includes(value)) {
        throw new Error('Недопустимый банк');
      }
      return true;
    })
];

// Валидация для работ в заказе
const validateOrderWork = [
  // Проверка поля description
  body('description')
    .notEmpty().withMessage('Описание работы обязательно для заполнения'),
  
  // Проверка поля amount
  body('amount')
    .isFloat({ min: 0 }).withMessage('Сумма работы должна быть числом больше или равным 0')
];

// Валидация для материалов в заказе
const validateOrderMaterial = [
  // Проверка поля description
  body('description')
    .notEmpty().withMessage('Описание материала обязательно для заполнения'),
  
  // Проверка поля amount
  body('amount')
    .isFloat({ min: 0 }).withMessage('Сумма материала должна быть числом больше или равным 0')
];

// Валидация для запчастей в заказе
const validateOrderPart = [
  // Проверка поля name
  body('name')
    .notEmpty().withMessage('Название запчасти обязательно для заполнения')
    .isLength({ min: 1, max: 100 }).withMessage('Название запчасти должно содержать от 1 до 100 символов'),
  
  // Проверка поля amount
  body('amount')
    .isFloat({ min: 0 }).withMessage('Сумма запчасти должна быть числом больше или равным 0'),
  
  // Проверка поля seller_id
  body('seller_id')
    .optional({ checkFalsy: true })
    .isInt().withMessage('ID продавца должно быть целым числом')
];

// Валидация для участия мастеров в заказе
const validateOrderMaster = [
  // Проверка поля master_id
  body('master_id')
    .notEmpty().withMessage('ID мастера обязателен для заполнения')
    .isInt().withMessage('ID мастера должно быть целым числом'),
  
  // Проверка поля work_amount
  body('work_amount')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('Сумма работ мастера должна быть числом больше или равным 0'),
  
  // Проверка поля work_percentage
  body('work_percentage')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 100 }).withMessage('Процент участия мастера должен быть числом от 0 до 100'),
  
  // Проверка, что указана либо сумма, либо процент
  body('work_amount')
    .custom((value, { req }) => {
      if (!value && !req.body.work_percentage) {
        throw new Error('Должна быть указана либо сумма работ, либо процент участия');
      }
      return true;
    })
];

// Валидация для настроек
const validateSettings = [
  // Проверка поля director_percent
  body('director_percent')
    .isFloat({ min: 0, max: 100 }).withMessage('Процент директора должен быть числом от 0 до 100')
];

// Валидация для бонусов
const validateBonus = [
  // Проверка поля master_id
  body('master_id')
    .notEmpty().withMessage('ID мастера обязателен для заполнения')
    .isInt().withMessage('ID мастера должно быть целым числом'),
  
  // Проверка поля amount
  body('amount')
    .isFloat({ min: 0 }).withMessage('Сумма бонуса должна быть числом больше или равным 0'),
  
  // Проверка, что указана либо запчасть, либо материал
  body('order_part_id')
    .custom((value, { req }) => {
      if (!value && !req.body.order_material_id) {
        throw new Error('Должна быть указана либо запчасть, либо материал');
      }
      return true;
    }),
  
  body('order_material_id')
    .custom((value, { req }) => {
      if (!value && !req.body.order_part_id) {
        throw new Error('Должна быть указана либо запчасть, либо материал');
      }
      if (value && req.body.order_part_id) {
        throw new Error('Может быть указана либо запчасть, либо материал, но не обе одновременно');
      }
      return true;
    })
];

module.exports = {
  handleValidationErrors,
  validateMaster,
  validateOrder,
  validateOrderWork,
  validateOrderMaterial,
  validateOrderPart,
  validateOrderMaster,
  validateSettings,
  validateBonus
};