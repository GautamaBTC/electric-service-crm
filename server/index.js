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
  const fs = require('fs');
  
  // Проверяем существование директории build
  if (fs.existsSync(staticPath)) {
    // Обслуживание статических файлов
    app.use(express.static(staticPath));
    
    // Обработка маршрута для фронтенда - отдаем index.html для всех немаршрутизированных запросов
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  } else {
    console.warn(`⚠️ Директория ${staticPath} не найдена. Статические файлы фронтенда не будут обслуживаться.`);
    
    // Создаем директорию build, если она не существует
    try {
      fs.mkdirSync(staticPath, { recursive: true });
      console.log(`✅ Директория ${staticPath} создана.`);
      
      // Создаем базовый index.html для информирования пользователя
      const indexPath = path.join(staticPath, 'index.html');
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRM Система для автосервиса</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 1rem;
          }
          .message {
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          .note {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            border-left: 4px solid #3498db;
            margin-top: 1rem;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 CRM Система для автосервиса</h1>
          <div class="message">
            <p>Сервер работает в production режиме, но фронтенд еще не собран.</p>
            <p>Это временная страница, которая будет заменена после сборки фронтенда.</p>
          </div>
          <div class="note">
            <p><strong>Примечание:</strong> Если вы видите эту страницу в течение длительного времени, возможно, возникла проблема со сборкой фронтенда. Пожалуйста, проверьте логи сборки.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      fs.writeFileSync(indexPath, htmlContent);
      console.log(`✅ Создан временный index.html в директории ${staticPath}`);
      
      // Обслуживание статических файлов из созданной директории
      app.use(express.static(staticPath));
      
      // Обработка маршрута для фронтенда
      app.get('*', (req, res) => {
        res.sendFile(path.join(staticPath, 'index.html'));
      });
    } catch (error) {
      console.error(`❌ Не удалось создать директорию ${staticPath}:`, error);
      
      // Если не удалось создать директорию, возвращаем JSON
      app.get('/', (req, res) => {
        res.status(503).json({
          message: '🚀 CRM сервер работает в production режиме, но фронтенд не собран!',
          staticPath: staticPath,
          error: 'Не удалось создать директорию для статических файлов',
          note: 'Пожалуйста, выполните сборку фронтенда: npm run build'
        });
      });
    }
  }
} else {
  // ✅ ТОЛЬКО ТЕСТОВЫЙ РОУТ (для разработки)
  app.get('/', (req, res) => {
    res.json({ message: '🚀 CRM сервер работает!' });
  });
}

// Функция для запуска сервера с инициализацией базы данных
const startServer = async () => {
  try {
    console.log('🚀 Запуск CRM-сервера...');
    
    // Проверяем подключение к базе данных
    console.log('📊 Проверка подключения к базе данных...');
    const connectionResult = await testConnection();
    
    if (!connectionResult) {
      throw new Error('Не удалось установить подключение к базе данных. Проверьте настройки подключения.');
    }
    
    // Определяем связи между моделями
    console.log('🔗 Определение связей между моделями...');
    defineRelations(models);
    
    // Синхронизируем модели с базой данных
    console.log('🔄 Синхронизация моделей с базой данных...');
    const syncResult = await syncModels();
    
    if (!syncResult) {
      throw new Error('Не удалось синхронизировать модели с базой данных.');
    }
    
    // Запускаем сервер
    console.log(`🌐 Запуск сервера на порту ${PORT}...`);
    const server = app.listen(PORT, () => {
      console.log(`✅ Сервер успешно запущен на порту ${PORT}`);
      console.log(`📝 Режим работы: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌍 URL приложения: ${process.env.RENDER_EXTERNAL_URL || 'https://your-app-name.onrender.com'}`);
      } else {
        console.log(`🔗 Локальный адрес: http://localhost:${PORT}`);
      }
    });
    
    // Обработка необработанных ошибок
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Необработанное отклонение Promise:', reason);
      // В продакшене можно добавить более детальную обработку
    });
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Необработанное исключение:', error);
      // В продакшене можно добавить более детальную обработку
      process.exit(1);
    });
    
    // Обработка завершения работы сервера
    const gracefulShutdown = () => {
      console.log('🔄 Завершение работы сервера...');
      server.close(() => {
        console.log('✅ Сервер остановлен');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске сервера:');
    
    // Детальное логирование ошибки
    if (error.name) {
      console.error(`   Тип ошибки: ${error.name}`);
    }
    
    if (error.message) {
      console.error(`   Сообщение об ошибке: ${error.message}`);
    }
    
    if (error.stack) {
      console.error(`   Стек вызовов: ${error.stack}`);
    }
    
    // Записываем ошибку в логгер
    try {
      const logger = require('./utils/errorHandler');
      logger.logError('Критическая ошибка при запуске сервера', error);
    } catch (loggerError) {
      console.error('   Не удалось записать ошибку в логгер:', loggerError.message);
    }
    
    process.exit(1);
  }
};

// Запускаем сервер
startServer();