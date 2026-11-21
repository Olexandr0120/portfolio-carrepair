import { Router } from 'express';
import mongoose from 'mongoose';
import Car from '../models/Car.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const FIELDS = ['brand', 'model', 'year'];
const SORT_FIELDS = ['model', 'year', 'createdAt'];

const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((f) => body?.[f] !== undefined).map((f) => [f, body[f]])
  );

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Middleware 1: перевірка формату ObjectId
function validateId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ error: 'Некоректний формат id' });
  }
  next();
}

// Middleware 2: пошук автомобіля
async function findCar(req, res, next) {
  const car = await Car.findById(req.params.id);
  if (!car) {
    return res.status(404).json({ error: `Автомобіль з id=${req.params.id} не знайдено` });
  }
  req.car = car;
  next();
}

// Middleware 3: лише власник або адмін можуть редагувати (PUT/PATCH)
function requireOwnerOrAdmin(req, res, next) {
  const isOwner = req.car.owner?.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Змінювати запис може лише його власник або адміністратор' });
  }
  next();
}

// Ланцюжки middleware
const withCar = [validateId, findCar];
const ownCar = [requireAuth, validateId, findCar, requireOwnerOrAdmin];
// Тип 2: DELETE лише для адміністратора
const adminDeleteCar = [requireAuth, validateId, findCar, requireRole('admin')];

// === GET /api/cars — Список (публічний) ===
router.get('/', async (req, res) => {
  const { q, brand, sort = '-createdAt' } = req.query;
  const page = Math.max(Number.parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit) || 10, 1), 100);

  const sortName = String(sort);
  const sortField = sortName.replace(/^-/, '');
  if (!SORT_FIELDS.includes(sortField)) {
    return res.status(400).json({ error: `sort: допустимі поля ${SORT_FIELDS.join(', ')}` });
  }

  const filter = {};
  if (q) filter.brand = { $regex: escapeRegex(String(q)), $options: 'i' };
  if (brand) filter.brand = String(brand);

  const [items, total] = await Promise.all([
    Car.find(filter)
      .sort({ [sortField]: sortName.startsWith('-') ? -1 : 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Car.countDocuments(filter),
  ]);

  res.set('X-Total-Count', String(total));
  res.json(items);
});

// === GET /api/cars/mine — Тільки свої записи (ПОВИНЕН бути ПЕРЕД /:id!) ===
router.get('/mine', requireAuth, async (req, res) => {
  const items = await Car.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
});

// === GET /api/cars/:id — Один запис ===
router.get('/:id', withCar, (req, res) => {
  res.json(req.car);
});

// === POST /api/cars — Створення (owner береться з токена!) ===
router.post('/', requireAuth, async (req, res) => {
  const car = await Car.create({ ...pick(req.body), owner: req.user._id });
  res.status(201).location(`${req.baseUrl}/${car.id}`).json(car);
});

// === PUT /api/cars/:id — Повна заміна (лише власник або адмін) ===
router.put('/:id', ownCar, async (req, res) => {
  const data = pick(req.body);
  req.car.set(Object.fromEntries(FIELDS.map((f) => [f, data[f]])));
  await req.car.save();
  res.json(req.car);
});

// === PATCH /api/cars/:id — Часткове оновлення (лише власник або адмін) ===
router.patch('/:id', ownCar, async (req, res) => {
  const data = pick(req.body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: `Передайте хоча б одне з полів: ${FIELDS.join(', ')}` });
  }
  req.car.set(data);
  await req.car.save();
  res.json(req.car);
});

// === DELETE /api/cars/:id — ТИП 2: лише адміністратор ===
router.delete('/:id', adminDeleteCar, async (req, res) => {
  await req.car.deleteOne();
  res.status(204).end();
});

export default router;