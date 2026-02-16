const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { validateMaster, handleValidationErrors } = require('../middleware/validation');
const { protect, checkRole } = require('../middleware/auth');

// Получение всех мастеров (только для директора и администратора)
router.get('/', protect, checkRole(['director', 'admin']), masterController.getAllMasters);

// Получение информации о мастере по ID
router.get('/:id', protect, masterController.getMasterById);

// Создание нового мастера (только для директора и администратора)
router.post('/', protect, checkRole(['director', 'admin']), validateMaster, handleValidationErrors, masterController.createMaster);

// Обновление информации о мастере (только для директора и администратора)
router.put('/:id', protect, checkRole(['director', 'admin']), validateMaster, handleValidationErrors, masterController.updateMaster);

// Удаление мастера (только для директора и администратора)
router.delete('/:id', protect, checkRole(['director', 'admin']), masterController.deleteMaster);

// Получение статистики по мастеру
router.get('/:id/stats', protect, masterController.getMasterStats);

module.exports = router;