import express from 'express';
import path from 'node:path';

const app = express();
const PORT = Number(process.env.PORT) || 3018;

// === Дані зберігаються в пам'яті процесу  ===
const cars = [
  { id: 1, brand: 'Toyota', model: 'Camry', year: 2020 },
  { id: 2, brand: 'Honda', model: 'Civic', year: 2019 },
  { id: 3, brand: 'BMW', model: 'X5', year: 2021 },
  { id: 4, brand: 'Mercedes', model: 'E-Class', year: 2022 },
  { id: 5, brand: 'Audi', model: 'A6', year: 2020 },
];
let nextId = cars.length + 1;

// === Middleware логування: ТИП 2 (час ISO + метод + URL + статус-код) ===
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

// === Колекція: список (із пошуком ?q= за першим текстовим полем — brand) ===
app.get('/api/cars', (req, res) => {
  const { q } = req.query;
  if (q) {
    const search = String(q).trim().toLowerCase();
    const result = cars.filter((c) =>
      c.brand.toLowerCase().includes(search)
    );
    return res.json(result);
  }
  res.json(cars);
});

// === Створення нового запису з валідацією полів та їхніх типів ===
app.post('/api/cars', (req, res) => {
  const { brand, model, year } = req.body ?? {};

  if (
    typeof brand !== 'string' ||
    brand.trim() === '' ||
    typeof model !== 'string' ||
    model.trim() === ''
  ) {
    return res.status(400).json({
      error: 'Поля brand і model є обов\'язковими і мають бути непорожніми рядками',
    });
  }

  if (typeof year !== 'number' || !Number.isFinite(year) || year <= 0) {
    return res.status(400).json({
      error: 'Поле year є обов\'язковим і має бути додатним числом (тип number)',
    });
  }

  const car = {
    id: nextId++,
    brand: brand.trim(),
    model: model.trim(),
    year,
  };
  cars.push(car);
  res.status(201).json(car);
});

// === Один елемент за параметром маршруту :id ===
app.get('/api/cars/:id', (req, res) => {
  const id = Number(req.params.id);
  const car = cars.find((c) => c.id === id);
  if (!car) {
    return res.status(404).json({
      error: `Автомобіль з id=${req.params.id} не знайдено`,
    });
  }
  res.json(car);
});

// === Навмисна помилка для перевірки обробника помилок (500) ===
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

// === Централізований обробник помилок  ===
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Некоректний JSON у тілі запиту',
    });
  }
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка сервера' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});