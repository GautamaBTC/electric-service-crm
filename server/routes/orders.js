const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { validateCreateOrder, validateUpdateOrder, validateChangeOrderStatus } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Получение всех заказов
router.get('/', protect, orderController.getAllOrders);

// Получение информации о заказе по ID
router.get('/:id', protect, orderController.getOrderById);

// Создание нового заказа
router.post('/', protect, validateCreateOrder, orderController.createOrder);

// Обновление информации о заказе
router.put('/:id', protect, validateUpdateOrder, orderController.updateOrder);

// Удаление заказа
router.delete('/:id', protect, orderController.deleteOrder);

// Изменение статуса заказа
router.patch('/:id/status', protect, validateChangeOrderStatus, orderController.changeOrderStatus);

module.exports = router;