import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import carsRouter from './routes/cars.js';
import { logger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT ?? 3018;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Створіть файл .env за зразком .env.example');
  process.exit(1);
}

const app = express();

app.use(logger);
app.use(express.json({ limit: '10kb' })); // Ліміт розміру тіла запиту (413)
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Підключаємо роутер
app.use('/api/cars', carsRouter);

// Тестова помилка 500
app.get('/api/error', () => {
  throw new Error('Тестова помилка сервера');
});

// Обробники помилок (завжди останні!)
app.use(notFound);
app.use(errorHandler);

// Підключення до БД та запуск
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`Підключено до MongoDB, база даних: ${mongoose.connection.name}`);
} catch (err) {
  console.error('Не вдалося підключитися до MongoDB:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});