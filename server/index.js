const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Добавляем маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/masters', require('./routes/masters'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/bonuses', require('./routes/bonuses'));
app.use('/api/stats', require('./routes/stats'));

// ✅ ТОЛЬКО ТЕСТОВЫЙ РОУТ
app.get('/', (req, res) => {
  res.json({ message: '🚀 CRM сервер работает!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});