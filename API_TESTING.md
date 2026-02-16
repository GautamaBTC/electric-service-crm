# Документация по тестированию API CRM-системы

## Обзор

Данный документ содержит информацию по тестированию API эндпоинтов CRM-системы для сервиса электромобилей. Базовый URL API: `https://electric-service-crm-backend.onrender.com/`

## Статус тестирования

✅ **Базовый эндпоинт** - работает корректно
❌ **Эндпоинты аутентификации** - требуют исправления
❌ **Эндпоинты для управления мастерами** - требуют аутентификации
❌ **Эндпоинты для управления заказами** - требуют аутентификации
❌ **Прочие эндпоинты** - требуют исправления

## Тестирование эндпоинтов

### 1. Базовый эндпоинт

**GET /** - Проверка работоспособности сервера

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/
```

**Успешный ответ:**
```json
{
  "message": "🚀 CRM сервер работает!"
}
```

### 2. Эндпоинты аутентификации

#### POST /api/auth/register - Регистрация нового пользователя

**Проблема:** В модели Master отсутствует поле `password_hash`, которое используется в контроллере.

**Запрос:**
```bash
curl -X POST https://electric-service-crm-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "+79991234567",
    "password": "password123",
    "role": "admin"
  }'
```

**Ожидаемый успешный ответ:**
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован",
  "data": {
    "master": {
      "id": 1,
      "full_name": "Test User",
      "phone": "+79991234567",
      "role": "admin",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Фактический ответ:** `Internal Server Error`

#### POST /api/auth/login - Вход в систему

**Запрос:**
```bash
curl -X POST https://electric-service-crm-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "password": "password123"
  }'
```

**Ожидаемый успешный ответ:**
```json
{
  "success": true,
  "message": "Вход выполнен успешно",
  "data": {
    "master": {
      "id": 1,
      "full_name": "Test User",
      "phone": "+79991234567",
      "role": "admin",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/auth/me - Получение данных текущего пользователя

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый успешный ответ:**
```json
{
  "success": true,
  "data": {
    "master": {
      "id": 1,
      "full_name": "Test User",
      "phone": "+79991234567",
      "role": "admin",
      "is_active": true
    }
  }
}
```

#### POST /api/auth/logout - Выход из системы

**Запрос:**
```bash
curl -X POST https://electric-service-crm-backend.onrender.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Ожидаемый успешный ответ:**
```json
{
  "success": true,
  "message": "Выход выполнен успешно"
}
```

### 3. Эндпоинты для управления мастерами

Все эндпоинты для управления мастерами требуют аутентификации и соответствующих прав доступа.

#### GET /api/masters - Получение списка мастеров

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/masters \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Требуемые права:** director, admin

#### POST /api/masters - Создание нового мастера

**Запрос:**
```bash
curl -X POST https://electric-service-crm-backend.onrender.com/api/masters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "full_name": "Новый мастер",
    "phone": "+79991234568",
    "role": "master"
  }'
```

**Требуемые права:** director, admin

#### GET /api/masters/:id - Получение данных мастера по ID

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/masters/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### PUT /api/masters/:id - Обновление данных мастера

**Запрос:**
```bash
curl -X PUT https://electric-service-crm-backend.onrender.com/api/masters/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "full_name": "Обновленное имя",
    "phone": "+79991234569"
  }'
```

**Требуемые права:** director, admin

#### DELETE /api/masters/:id - Удаление мастера

**Запрос:**
```bash
curl -X DELETE https://electric-service-crm-backend.onrender.com/api/masters/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Требуемые права:** director, admin

### 4. Эндпоинты для управления заказами

Все эндпоинты для управления заказами требуют аутентификации.

#### GET /api/orders - Получение списка заказов

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### POST /api/orders - Создание нового заказа

**Запрос:**
```bash
curl -X POST https://electric-service-crm-backend.onrender.com/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "client_name": "Иван Иванов",
    "client_phone": "+79991234567",
    "car_model": "Tesla Model 3",
    "description": "Замена аккумулятора",
    "estimated_cost": 150000
  }'
```

#### GET /api/orders/:id - Получение данных заказа по ID

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### PUT /api/orders/:id - Обновление данных заказа

**Запрос:**
```bash
curl -X PUT https://electric-service-crm-backend.onrender.com/api/orders/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "в работе",
    "actual_cost": 145000
  }'
```

#### DELETE /api/orders/:id - Удаление заказа

**Запрос:**
```bash
curl -X DELETE https://electric-service-crm-backend.onrender.com/api/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Прочие эндпоинты

#### GET /api/settings - Получение настроек системы

**Проблема:** В модели Setting определено только поле `director_percent`, но в контроллере используются также поля `company_name`, `company_address`, `company_phone`, `currency`, `work_time_start`, `work_time_end`, `working_days`.

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Требуемые права:** director, admin

#### GET /api/settings/company - Получение информации о компании

**Проблема:** Та же проблема с несоответствием полей в модели и контроллере.

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/settings/company
```

**Фактический ответ:** `Internal Server Error`

#### GET /api/bonuses - Получение бонусов

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/bonuses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET /api/stats - Получение статистики

**Запрос:**
```bash
curl -X GET https://electric-service-crm-backend.onrender.com/api/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Инструкция по использованию Postman

1. Создайте новый запрос в Postman
2. Укажите метод запроса (GET, POST, PUT, DELETE)
3. Введите URL эндпоинта
4. Для запросов с телом (POST, PUT):
   - Перейдите на вкладку "Body"
   - Выберите "raw" и "JSON"
   - Введите JSON данные запроса
5. Для запросов, требующих аутентификации:
   - Перейдите на вкладку "Authorization"
   - Выберите тип "Bearer Token"
   - Введите ваш JWT токен
6. Нажмите кнопку "Send"

## Инструкция по использованию curl

Для Windows используйте двойные кавычки для JSON данных:

```bash
curl -X POST URL -H "Content-Type: application/json" -d "{\"key\":\"value\"}"
```

Или создайте файл с JSON данными и используйте его:

```bash
curl -X POST URL -H "Content-Type: application/json" -d @data.json
```

## Выявленные проблемы

1. **Модель Master:** отсутствует поле `password_hash`, которое используется в контроллере аутентификации.
2. **Модель Setting:** определено только поле `director_percent`, но в контроллере используются также поля `company_name`, `company_address`, `company_phone`, `currency`, `work_time_start`, `work_time_end`, `working_days`.
3. **Несоответствие имен:** в модели Setting поле называется `director_percent`, но в контроллере оно используется как `director_percentage`.

## Рекомендации по исправлению

1. Добавить поле `password_hash` в модель Master.
2. Добавить недостающие поля в модель Setting или исправить контроллер для использования существующих полей.
3. Унифицировать имена полей между моделью Setting и контроллером.
4. После исправления этих проблем повторить тестирование API.