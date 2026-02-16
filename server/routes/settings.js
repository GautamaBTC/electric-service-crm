const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { validateUpdateSettings } = require('../middleware/validation');
const { protect, restrictTo } = require('../middleware/auth');

// Получение настроек системы (только для директора и администратора)
router.get('/', protect, restrictTo('director', 'admin'), settingController.getSettings);

// Обновление настроек системы (только для директора и администратора)
router.put('/', protect, restrictTo('director', 'admin'), validateUpdateSettings, settingController.updateSettings);

// Получение информации о компании (доступно всем)
router.get('/company', settingController.getCompanyInfo);

module.exports = router;