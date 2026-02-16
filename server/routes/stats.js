const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const { protect, checkRole } = require('../middleware/auth');

// Получение общей статистики (только для директора и администратора)
router.get('/general', protect, checkRole(['director', 'admin']), statController.getGeneralStats);

// Получение статистики для дашборда (только для директора и администратора)
router.get('/dashboard', protect, checkRole(['director', 'admin']), statController.getDashboardStats);

// Получение статистики для мастера
router.get('/master/:id', protect, statController.getMasterStats);

// Экспорт статистики в Excel (только для директора и администратора)
router.get('/export', protect, checkRole(['director', 'admin']), statController.exportStatsToExcel);

module.exports = router;