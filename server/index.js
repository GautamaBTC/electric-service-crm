const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Импорт маршрутов
const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/masters');
const orderRoutes = require('./routes/orders');
const settingRoutes = require('./routes/settings');
const bonusRoutes = require('./routes/bonuses');
const statsRoutes = require('./routes/stats');

// Импорт middleware
const { errorHandler } = require('./utils/errorHandler');

// Создание приложения Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы в production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/stats', statsRoutes);

// Проверка работоспособности
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} в браузере`);
});

module.exports = app;