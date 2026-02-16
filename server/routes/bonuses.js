const express = require('express');
const router = express.Router();
const bonusController = require('../controllers/bonusController');
const { validateCreateBonus, validateUpdateBonus } = require('../middleware/validation');
const { protect, restrictTo } = require('../middleware/auth');

// Получение всех бонусов (только для директора и администратора)
router.get('/', protect, restrictTo('director', 'admin'), bonusController.getAllBonuses);

// Получение бонусов текущего мастера
router.get('/my-bonuses', protect, restrictTo('master'), bonusController.getMyBonuses);

// Получение информации о бонусе по ID
router.get('/:id', protect, bonusController.getBonusById);

// Создание нового бонуса (только для директора и администратора)
router.post('/', protect, restrictTo('director', 'admin'), validateCreateBonus, bonusController.createBonus);

// Обновление информации о бонусе (только для директора и администратора)
router.put('/:id', protect, restrictTo('director', 'admin'), validateUpdateBonus, bonusController.updateBonus);

// Удаление бонуса (только для директора и администратора)
router.delete('/:id', protect, restrictTo('director', 'admin'), bonusController.deleteBonus);

// Получение статистики по бонусам
router.get('/stats/:master_id?', protect, bonusController.getBonusStats);

module.exports = router;