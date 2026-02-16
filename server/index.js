require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

// Импортируем функции для работы с базой данных
const { sequelize, testConnection, defineRelations, syncModels } = require('./config/database');
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Добавляем маршруты API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/masters', require('./routes/masters'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/bonuses', require('./routes/bonuses'));
app.use('/api/stats', require('./routes/stats'));

// Обслуживание статических файлов фронтенда в production
if (process.env.NODE_ENV === 'production') {
  // Путь к собранным статическим файлам
  const staticPath = path.join(__dirname, '..', 'client', 'build');
  
  // Обслуживание статических файлов
  app.use(express.static(staticPath));
  
  // Обработка маршрута для фронтенда - отдаем index.html для всех немаршрутизированных запросов
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  // ✅ ТОЛЬКО ТЕСТОВЫЙ РОУТ (для разработки)
  app.get('/', (req, res) => {
    res.json({ message: '🚀 CRM сервер работает!' });
  });
}

// Функция для запуска сервера с инициализацией базы данных
const startServer = async () => {
  try {
    // Проверяем подключение к базе данных
    await testConnection();
    
    // Определяем связи между моделями
    defineRelations(models);
    
    // Синхронизируем модели с базой данных
    await syncModels();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer();