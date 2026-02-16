const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { validateSettings, handleValidationErrors } = require('../middleware/validation');
const { protect, checkRole } = require('../middleware/auth');

// Получение настроек системы (только для директора и администратора)
router.get('/', protect, checkRole(['director', 'admin']), settingController.getSettings);

// Обновление настроек системы (только для директора и администратора)
router.put('/', protect, checkRole(['director', 'admin']), validateSettings, handleValidationErrors, settingController.updateSettings);

// Получение информации о компании (доступно всем)
router.get('/company', settingController.getCompanyInfo);

module.exports = router;