const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Master } = require('../models');
const { AppError, catchAsync } = require('../utils/errorHandler');
const config = require('../config/config');

// Логирование для диагностики проблемы
console.log('bcrypt загружен:', typeof bcrypt);
console.log('jwt загружен:', typeof jwt);
console.log('Master загружен:', typeof Master);
console.log('AppError загружен:', typeof AppError);
console.log('catchAsync загружен:', typeof catchAsync);
console.log('config загружен:', typeof config);

// Генерация JWT токена
const generateToken = (id) => {
  console.log('Генерация токена для пользователя ID:', id);
  console.log('Используемый секрет:', config.jwt.secret ? 'существует' : 'отсутствует');
  console.log('Время истечения токена:', config.jwt.expiresIn);
  
  try {
    const token = jwt.sign({ id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
    console.log('Токен успешно сгенерирован');
    return token;
  } catch (error) {
    console.error('Ошибка при генерации токена:', error);
    throw error;
  }
};

// Регистрация нового пользователя
const register = catchAsync(async (req, res, next) => {
  const { full_name, phone, password, role } = req.body;
  
  // Проверяем, что роль является допустимой
  if (role && !Object.values(config.roles).includes(role)) {
    return next(new AppError('Недопустимая роль пользователя', 400));
  }
  
  // Хешируем пароль
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Создаем нового мастера
  const master = await Master.create({
    full_name,
    phone,
    password_hash: hashedPassword,
    role: role || config.roles.MASTER
  });
  
  // Удаляем пароль из ответа
  master.password_hash = undefined;
  
  // Генерируем токен
  const token = generateToken(master.id);
  
  res.status(201).json({
    success: true,
    message: 'Пользователь успешно зарегистрирован',
    data: {
      master,
      token
    }
  });
});

// Вход в систему
const login = catchAsync(async (req, res) => {
  console.log('=== НАЧАЛО ВХОДА В СИСТЕМУ ===');
  
  const { phone, password } = req.body;
  console.log('Тело запроса:', { phone, password: '***' });
  
  // Поиск пользователя
  console.log('Поиск пользователя в базе данных...');
  const master = await Master.findOne({ 
    where: { phone },
    attributes: ['id', 'full_name', 'phone', 'role', 'is_active', 'password_hash']
  });
  
  if (!master) {
    console.log('Результат поиска пользователя: Пользователь не найден');
    return res.status(401).json({ 
      success: false, 
      message: 'Пользователь не найден' 
    });
  }
  
  console.log('Результат поиска пользователя: Пользователь найден');
  console.log('Данные пользователя:', {
    id: master.id,
    full_name: master.full_name,
    phone: master.phone,
    role: master.role,
    is_active: master.is_active,
    password_hash_exists: !!master.password_hash
  });
  
  // Проверка активности пользователя
  if (!master.is_active) {
    console.log('Результат проверки активности: Пользователь неактивен');
    return res.status(401).json({ 
      success: false, 
      message: 'Пользователь неактивен' 
    });
  }
  
  // Проверка пароля
  console.log('Проверка пароля...');
  const isPasswordValid = await bcrypt.compare(password, master.password_hash);
  console.log('Результат проверки пароля:', isPasswordValid ? 'Пароль верный' : 'Пароль неверный');
  
  if (!isPasswordValid) {
    return res.status(401).json({ 
      success: false, 
      message: 'Неверный пароль' 
    });
  }
  
  // Генерация токена
  console.log('Генерация JWT токена...');
  const token = jwt.sign(
    { id: master.id, role: master.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  console.log('=== ВХОД В СИСТЕМУ УСПЕШНО ЗАВЕРШЕН ===');
  
  // ЕДИНСТВЕННЫЙ res.json() В КОНЦЕ
  return res.json({
    success: true,
    data: {
      token,
      master: {
        id: master.id,
        full_name: master.full_name,
        phone: master.phone,
        role: master.role
      }
    }
  });
});

// Получение информации о текущем пользователе
const getMe = catchAsync(async (req, res, next) => {
  // Пользователь уже добавлен в запрос через middleware аутентификации
  const master = await Master.findByPk(req.user.id);
  
  if (!master) {
    return next(new AppError('Пользователь не найден', 404));
  }
  
  // Удаляем пароль из ответа
  master.password_hash = undefined;
  
  res.status(200).json({
    success: true,
    data: {
      master
    }
  });
});

// Обновление профиля пользователя
const updateProfile = catchAsync(async (req, res, next) => {
  const { full_name, phone, currentPassword, newPassword } = req.body;
  
  // Находим пользователя, включая поле password_hash
  const master = await Master.findByPk(req.user.id, {
    attributes: { include: ['password_hash'] }
  });
  
  if (!master) {
    return next(new AppError('Пользователь не найден', 404));
  }
  
  // Если указан текущий пароль и новый пароль
  if (currentPassword && newPassword) {
    // Проверяем текущий пароль
    const isPasswordCorrect = await bcrypt.compare(currentPassword, master.password_hash);
    
    if (!isPasswordCorrect) {
      return next(new AppError('Неверный текущий пароль', 401));
    }
    
    // Хешируем новый пароль
    master.password_hash = await bcrypt.hash(newPassword, 12);
  }
  
  // Обновляем остальные поля
  if (full_name) master.full_name = full_name;
  if (phone) master.phone = phone;
  
  // Сохраняем изменения
  await master.save();
  
  // Удаляем пароль из ответа
  master.password_hash = undefined;
  
  res.status(200).json({
    success: true,
    message: 'Профиль успешно обновлен',
    data: {
      master
    }
  });
});

// Выход из системы (инвалидация токена на клиенте)
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Выход выполнен успешно'
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout
};