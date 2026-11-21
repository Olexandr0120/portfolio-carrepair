import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import authRouter from './routes/auth.js';
import carsRouter from './routes/cars.js';
import { logger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT ?? 3018;
const { MONGODB_URI, JWT_SECRET } = process.env;

if (!MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Створіть файл .env за зразком .env.example');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET не задано або він коротший за 32 символи. Див. .env.example');
  process.exit(1);
}

const app = express();

app.use(logger);
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Роутери (auth ПЕРЕД cars, бо cars має захищені маршрути)
app.use('/api/auth', authRouter);
app.use('/api/cars', carsRouter);

// Тестова помилка 500
app.get('/api/error', () => {
  throw new Error('Тестова помилка сервера');
});

// Обробники помилок (завжди останні!)
app.use(notFound);
app.use(errorHandler);

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