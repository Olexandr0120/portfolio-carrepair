import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import Car from './models/Car.js';

const PORT = process.env.PORT ?? 3018;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Створіть файл .env за зразком .env.example');
  process.exit(1);
}

const app = express();

// === Middleware логування: ТИП 2 ===
// Формат: час ISO + метод + URL + статус-код
function logger(req, res, next) {
  res.on('finish', () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode}`
    );
  });
  next();
}

app.use(logger);
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));

// === Допоміжна функція: екранує спецсимволи регулярних виразів ===
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// === 1. Список із пошуком ?q= (за полем brand) та обмеженням ?limit= ===
app.get('/api/cars', async (req, res) => {
  const { q, limit } = req.query;
  const filter = q
    ? { brand: { $regex: escapeRegex(String(q)), $options: 'i' } }
    : {};
  const max = Math.min(Number(limit) || 50, 100);

  const cars = await Car.find(filter).sort({ createdAt: -1 }).limit(max);
  res.json(cars);
});

// === 2. Один запис за ObjectId ===
app.get('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Некоректний формат id' });
  }
  const car = await Car.findById(id);
  if (!car) {
    return res.status(404).json({ error: `Автомобіль з id=${id} не знайдено` });
  }
  res.json(car);
});

// === 3. Створення нового запису ===
app.post('/api/cars', async (req, res) => {
  const { brand, model, year } = req.body ?? {};
  const car = await Car.create({ brand, model, year });
  res.status(201).json(car);
});

// === Навмисна помилка для перевірки обробника 500 ===
app.get('/api/error', () => {
  throw new Error('Тестова помилка сервера');
});

// === 404: жоден маршрут вище не підійшов ===
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не знайдено',
    path: req.originalUrl,
  });
});

// === Централізований обробник помилок (4 параметри) — завжди останній ===
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Некоректний JSON у тілі запиту',
    });
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Дані не пройшли перевірку',
      details,
    });
  }
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка сервера' : err.message,
  });
});

// === Спочатку підключаємося до бази, і лише потім запускаємо сервер ===
try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log(
    `Підключено до MongoDB, база даних: ${mongoose.connection.name}`
  );
} catch (err) {
  console.error('Не вдалося підключитися до MongoDB:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});