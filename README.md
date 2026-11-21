# Автосервіс «МоторЛайн» — фінальний fullstack-проєкт

Вебзастосунок для обліку автомобілів автосервісу. Клієнтська частина на React і Vite взаємодіє з REST API на Node.js та Express. Дані зберігаються в MongoDB Atlas, автентифікація працює на JWT.

**Клієнт:** https://portfolio-carrepair.netlify.app  
**REST API:** https://portfolio-carrepair-production.up.railway.app  
**Перевірка стану API:** https://portfolio-carrepair-production.up.railway.app/health

## Індивідуальне завдання

- Варіант: 18
- Тема: СТО та автосервіс
- Репозиторій: [Olexandr0120/portfolio-carrepair](https://github.com/Olexandr0120/portfolio-carrepair)
- Колекція автомобілів: `/api/cars`
- Поля автомобіля: `brand`, `model`, `year`
- Додаткова вимога типу 2: пагінація через `page`, `limit` і заголовок `X-Total-Count`

## Використані технології

React, Vite, Node.js, Express, Mongoose, MongoDB Atlas, JWT, bcrypt, CORS, Railway, Netlify.

## Архітектура

Браузер → Netlify (React SPA і CDN) → Railway (Node.js та Express REST API) → MongoDB Atlas (база `lr15`).

## Запуск локально

Сервер:

```bash
cd lr11-server
npm install
# Створіть .env на основі .env.example і заповніть локальні значення.
npm run seed
npm run dev
```

Клієнт у другому терміналі:

```bash
cd client
npm install
npm run dev
```

Клієнт відкривається на `http://localhost:5173`.

## Змінні середовища

| Змінна | Де задається | Призначення |
|---|---|---|
| `MONGODB_URI` | Railway / локальний `.env` | Підключення до MongoDB Atlas (секрет) |
| `JWT_SECRET` | Railway / локальний `.env` | Підпис JWT (секрет, щонайменше 32 символи) |
| `CLIENT_ORIGIN` | Railway | Дозволена адреса клієнта для CORS |
| `NODE_ENV` | Railway | Режим сервера; у production — `production` |
| `PORT` | Railway | Порт сервера, який задає платформа |
| `VITE_API_URL` | Netlify / локальне середовище клієнта | Публічна базова адреса REST API, вбудована під час збірки |

Не додавайте до Git файли `.env` або `.env.production` і не публікуйте значення секретів.

## Основні маршрути API

| Метод | Маршрут | Призначення |
|---|---|---|
| `GET` | `/health` | Стан сервера та з'єднання з базою |
| `POST` | `/api/auth/register` | Реєстрація |
| `POST` | `/api/auth/login` | Вхід і отримання JWT |
| `GET` | `/api/auth/me` | Поточний користувач |
| `GET` | `/api/cars?page=1&limit=5&q=` | Пошук і посторінковий список |
| `POST` | `/api/cars` | Додати автомобіль (потрібен вхід) |
| `PATCH` / `PUT` | `/api/cars/:id` | Оновити автомобіль згідно з правилами доступу сервера |
| `DELETE` | `/api/cars/:id` | Видалити автомобіль згідно з роллю користувача |

Загальна кількість результатів списку повертається у заголовку `X-Total-Count`.

## Демонстраційні облікові записи

Тестові облікові записи створюються скриптом `seed.js`. Для локальної перевірки використовуйте демонстраційні дані з цього скрипту; не публікуйте паролі й не використовуйте ці облікові записи для реальних даних.

## Розгортання

Клієнт зібрано та опубліковано на Netlify з базовою директорією `client`, командою `npm run build` і каталогом публікації `dist`. Сервер розгорнуто на Railway з директорії `lr11-server` та командою `npm start`.

Поточна production-перевірка `/health` повертає `status: ok` і `db: true`. Після простою перший запит може тривати довше, поки сервіс відновлює роботу.

## Автор

Олександр Варакута, КІ-24-1, варіант 18.
