const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Регистрация нового пользователя
router.post('/register', validateRegister, authController.register);

// Вход в систему
router.post('/login', validateLogin, authController.login);

// Выход из системы
router.post('/logout', protect, authController.logout);

// Получение информации о текущем пользователе
router.get('/me', protect, authController.getMe);

// Обновление профиля пользователя
router.put('/update-profile', protect, validateUpdateProfile, authController.updateProfile);

module.exports = router;