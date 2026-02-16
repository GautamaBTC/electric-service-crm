const { Setting } = require('../models');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Получение настроек системы
const getSettings = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для просмотра настроек', 403));
  }
  
  // Находим настройки
  let settings = await Setting.findOne();
  
  // Если настроек нет, создаем настройки по умолчанию
  if (!settings) {
    settings = await Setting.create({
      director_percentage: 50,
      company_name: 'VIPАвто',
      company_address: '',
      company_phone: '',
      currency: 'RUB',
      work_time_start: '09:00',
      work_time_end: '18:00',
      working_days: [1, 2, 3, 4, 5] // Пн-Пт
    });
  }
  
  res.status(200).json({
    success: true,
    data: {
      settings
    }
  });
});

// Обновление настроек системы
const updateSettings = catchAsync(async (req, res, next) => {
  // Проверка прав доступа
  if (req.user.role !== config.roles.DIRECTOR && req.user.role !== config.roles.ADMIN) {
    return next(new AppError('У вас нет прав для обновления настроек', 403));
  }
  
  const {
    director_percentage,
    company_name,
    company_address,
    company_phone,
    currency,
    work_time_start,
    work_time_end,
    working_days
  } = req.body;
  
  // Находим настройки
  let settings = await Setting.findOne();
  
  // Если настроек нет, создаем настройки по умолчанию
  if (!settings) {
    settings = await Setting.create({
      director_percentage: director_percentage || 50,
      company_name: company_name || 'VIPАвто',
      company_address: company_address || '',
      company_phone: company_phone || '',
      currency: currency || 'RUB',
      work_time_start: work_time_start || '09:00',
      work_time_end: work_time_end || '18:00',
      working_days: working_days || [1, 2, 3, 4, 5]
    });
  } else {
    // Обновляем настройки
    if (director_percentage !== undefined) settings.director_percentage = director_percentage;
    if (company_name !== undefined) settings.company_name = company_name;
    if (company_address !== undefined) settings.company_address = company_address;
    if (company_phone !== undefined) settings.company_phone = company_phone;
    if (currency !== undefined) settings.currency = currency;
    if (work_time_start !== undefined) settings.work_time_start = work_time_start;
    if (work_time_end !== undefined) settings.work_time_end = work_time_end;
    if (working_days !== undefined) settings.working_days = working_days;
    
    // Сохраняем изменения
    await settings.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'Настройки успешно обновлены',
    data: {
      settings
    }
  });
});

// Получение информации о компании
const getCompanyInfo = catchAsync(async (req, res, next) => {
  // Эта информация доступна всем пользователям
  
  // Находим настройки
  let settings = await Setting.findOne();
  
  // Если настроек нет, создаем настройки по умолчанию
  if (!settings) {
    settings = await Setting.create({
      director_percentage: 50,
      company_name: 'VIPАвто',
      company_address: '',
      company_phone: '',
      currency: 'RUB',
      work_time_start: '09:00',
      work_time_end: '18:00',
      working_days: [1, 2, 3, 4, 5] // Пн-Пт
    });
  }
  
  // Возвращаем только публичную информацию
  const companyInfo = {
    company_name: settings.company_name,
    company_address: settings.company_address,
    company_phone: settings.company_phone,
    currency: settings.currency,
    work_time_start: settings.work_time_start,
    work_time_end: settings.work_time_end,
    working_days: settings.working_days
  };
  
  res.status(200).json({
    success: true,
    data: {
      company: companyInfo
    }
  });
});

module.exports = {
  getSettings,
  updateSettings,
  getCompanyInfo
};