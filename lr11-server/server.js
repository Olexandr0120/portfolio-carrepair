
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';

// Підключаємо маршрути авторизації та автомобілів,
// які були реалізовані у попередніх лабораторних роботах.
import authRouter from './routes/auth.js';
import carsRouter from './routes/cars.js';

// Підключаємо middleware логування та обробки помилок.
import { logger } from './middleware/logger.js';
import {
  notFound,
  errorHandler,
} from './middleware/errorHandler.js';

// У production порт надає хмарна платформа.
// Для локального запуску використовується порт варіанта 18.
const PORT = process.env.PORT ?? 3018;

// Отримуємо конфігурацію зі змінних середовища.
const {
  MONGODB_URI,
  JWT_SECRET,
  NODE_ENV,
} = process.env;

// Змінна CLIENT_ORIGIN містить адреси клієнтських застосунків,
// яким дозволено виконувати запити до нашого API.
// Якщо адрес декілька, розділяємо їх комами.
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Перевіряємо наявність рядка підключення до MongoDB.
if (!MONGODB_URI) {
  console.error(
    'Не задано MONGODB_URI. Створіть файл .env за зразком .env.example'
  );
  process.exit(1);
}

// Перевіряємо секретний ключ для JWT.
// Відповідно до методички він повинен мати мінімум 32 символи.
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    'JWT_SECRET не задано або він коротший за 32 символи. Див. .env.example'
  );
  process.exit(1);
}

// Створюємо застосунок Express.
const app = express();

// Дозволяємо Express враховувати перший зворотний проксі.
// Це потрібно для коректної роботи на Railway або Render.
app.set('trust proxy', 1);

// Реєструємо middleware логування HTTP-запитів.
app.use(logger);

// Налаштовуємо CORS для взаємодії React з Express.
// Заголовок X-Total-Count використовується для пагінації,
// а Location може містити адресу створеного ресурсу.
app.use(
  cors({
    origin: allowedOrigins,
    exposedHeaders: ['X-Total-Count', 'Location'],
  })
);

// Дозволяємо обробку JSON із обмеженням 10 КБ.
app.use(express.json({ limit: '10kb' }));

// Підключаємо обслуговування статичних файлів.
app.use(
  express.static(path.join(import.meta.dirname, 'public'))
);

// Маршрут перевірки стану сервера та MongoDB.
// Використовується для контролю роботи API у production.
app.get('/health', (req, res) => {
  // readyState === 1 означає, що з'єднання з MongoDB активне.
  const dbReady = mongoose.connection.readyState === 1;

  // Повертаємо HTTP 200, якщо база доступна,
  // або HTTP 503, якщо з'єднання відсутнє.
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'ok' : 'degraded',
    db: dbReady,
    uptime: Math.round(process.uptime()),
  });
});

// Підключаємо маршрути авторизації.
// Залишаємо їх перед маршрутами автомобілів.
app.use('/api/auth', authRouter);

// Підключаємо CRUD-маршрути для автомобілів.
// Це індивідуальна колекція варіанта №18.
app.use('/api/cars', carsRouter);

// Тестовий маршрут помилки повинен працювати
// лише під час розробки, але не у production.
if (NODE_ENV !== 'production') {
  app.get('/api/error', () => {
    throw new Error('Тестова помилка сервера');
  });
}

// Обробник неіснуючих маршрутів.
// Обов'язково розташовуємо після всіх API-маршрутів.
app.use(notFound);

// Централізований обробник помилок Express.
app.use(errorHandler);

// Підключаємося до MongoDB перед запуском HTTP-сервера.
try {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });

  console.log(
    `Підключено до MongoDB, база даних: ${mongoose.connection.name}`
  );
} catch (err) {
  console.error(
    'Не вдалося підключитися до MongoDB:',
    err.message
  );

  process.exit(1);
}

// Запускаємо HTTP-сервер.
app.listen(PORT, () => {
  console.log(
    `Сервер запущено: http://localhost:${PORT}`
  );
});
