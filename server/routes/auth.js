const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Логирование для диагностики проблемы
console.log('authController загружен:', authController);
console.log('authController.register:', typeof authController.register);
console.log('authController.login:', typeof authController.login);
console.log('authController.logout:', typeof authController.logout);
console.log('authController.getMe:', typeof authController.getMe);
console.log('authController.updateProfile:', typeof authController.updateProfile);

// Регистрация нового пользователя
if (typeof authController.register === 'function') {
  router.post('/register', validateRegister, authController.register);
} else {
  console.error('authController.register не является функцией:', authController.register);
}

// Вход в систему
if (typeof authController.login === 'function') {
  router.post('/login', validateLogin, authController.login);
} else {
  console.error('authController.login не является функцией:', authController.login);
}

// Выход из системы
if (typeof authController.logout === 'function') {
  router.post('/logout', authenticateToken, authController.logout);
} else {
  console.error('authController.logout не является функцией:', authController.logout);
}

// Получение информации о текущем пользователе
if (typeof authController.getMe === 'function') {
  router.get('/me', authenticateToken, authController.getMe);
} else {
  console.error('authController.getMe не является функцией:', authController.getMe);
}

// Обновление профиля пользователя
if (typeof authController.updateProfile === 'function') {
  router.put('/update-profile', authenticateToken, validateUpdateProfile, authController.updateProfile);
} else {
  console.error('authController.updateProfile не является функцией:', authController.updateProfile);
}

module.exports = router;