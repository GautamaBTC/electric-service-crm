const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');
const { validateCreateMaster, validateUpdateMaster } = require('../middleware/validation');
const { protect, restrictTo } = require('../middleware/auth');

// Получение всех мастеров (только для директора и администратора)
router.get('/', protect, restrictTo('director', 'admin'), masterController.getAllMasters);

// Получение информации о мастере по ID
router.get('/:id', protect, masterController.getMasterById);

// Создание нового мастера (только для директора и администратора)
router.post('/', protect, restrictTo('director', 'admin'), validateCreateMaster, masterController.createMaster);

// Обновление информации о мастере (только для директора и администратора)
router.put('/:id', protect, restrictTo('director', 'admin'), validateUpdateMaster, masterController.updateMaster);

// Удаление мастера (только для директора и администратора)
router.delete('/:id', protect, restrictTo('director', 'admin'), masterController.deleteMaster);

// Получение статистики по мастеру
router.get('/:id/stats', protect, masterController.getMasterStats);

module.exports = router;