const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const { protect, restrictTo } = require('../middleware/auth');

// Получение общей статистики (только для директора и администратора)
router.get('/general', protect, restrictTo('director', 'admin'), statController.getGeneralStats);

// Получение статистики для дашборда (только для директора и администратора)
router.get('/dashboard', protect, restrictTo('director', 'admin'), statController.getDashboardStats);

// Получение статистики для мастера
router.get('/master/:id', protect, statController.getMasterStats);

// Экспорт статистики в Excel (только для директора и администратора)
router.get('/export', protect, restrictTo('director', 'admin'), statController.exportStatsToExcel);

module.exports = router;