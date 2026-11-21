// Автоматична перевірка API. Запуск: npm run check (сервер має бути запущений)
import assert from 'node:assert/strict';

const PORT = process.env.PORT ?? 3018;
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const URL_PATH = '/api/cars'; // шлях варіанта 18

const api = (path, options = {}) =>
  fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

const send = (method, path, body) =>
  api(path, { method, body: JSON.stringify(body) });

let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ${name}\n  ${err.message.split('\n')[0]}`);
  }
}

const brand = `TestBrand${Date.now()}`;
const model = `TestModel${Date.now()}`;
let id;

// 1. Створення запису
await check('POST: створення -> 201, Location, id', async () => {
  const res = await send('POST', URL_PATH, { brand, model, year: 2020 });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id, 'у відповіді немає id');
  assert.equal(res.headers.get('location'), `${URL_PATH}/${body.id}`);
  id = body.id;
});

// 2. Дублікат унікального поля
await check('POST: дублікат унікального поля -> 409', async () => {
  const res = await send('POST', URL_PATH, { brand, model, year: 2020 });
  assert.equal(res.status, 409);
});

// 3. Помилка валідації
await check('POST: порожні поля -> 400 і details', async () => {
  const res = await send('POST', URL_PATH, { brand: '', model: '', year: 1800 });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray((await res.json()).details));
});

// 4. Отримання одного запису
await check('GET: один запис -> 200', async () => {
  const res = await api(`${URL_PATH}/${id}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).brand, brand);
});

// 5. Список записів
await check('GET: список -> 200, масив, X-Total-Count', async () => {
  const res = await api(`${URL_PATH}?limit=5`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(await res.json()));
  assert.ok(Number(res.headers.get('x-total-count')) >= 1);
});

// 6. Недозволене поле сортування
await check('GET: sort за недозволеним полем -> 400', async () => {
  assert.equal((await api(`${URL_PATH}?sort=password`)).status, 400);
});

// 7. Некоректний формат id
await check('GET: некоректний id -> 400', async () => {
  assert.equal((await api(`${URL_PATH}/abc`)).status, 400);
});

// 8. Неіснуючий id
await check('GET: неіснуючий id -> 404', async () => {
  assert.equal((await api(`${URL_PATH}/000000000000000000000000`)).status, 404);
});

// 9. Повна заміна
await check('PUT: повна заміна -> 200', async () => {
  const res = await send('PUT', `${URL_PATH}/${id}`, {
    brand: 'UpdatedBrand',
    model: 'UpdatedModel',
    year: 2021,
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).brand, 'UpdatedBrand');
});

// 10. PUT без обов'язкового поля
await check('PUT: без обов\'язкового поля -> 400', async () => {
  assert.equal((await send('PUT', `${URL_PATH}/${id}`, { brand: 'Test' })).status, 400);
});

// 11. Часткове оновлення
await check('PATCH: часткове оновлення -> 200', async () => {
  const res = await send('PATCH', `${URL_PATH}/${id}`, { year: 2022 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.year, 2022);
  assert.equal(body.brand, 'UpdatedBrand', 'інші поля не повинні змінитися');
});

// 12. PATCH з порожнім тілом
await check('PATCH: порожнє тіло -> 400', async () => {
  assert.equal((await send('PATCH', `${URL_PATH}/${id}`, {})).status, 400);
});

// 13. Видалення
await check('DELETE: видалення -> 204 без тіла', async () => {
  const res = await api(`${URL_PATH}/${id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
});

// 14. Повторне видалення
await check('DELETE: повторне видалення -> 404', async () => {
  assert.equal((await api(`${URL_PATH}/${id}`, { method: 'DELETE' })).status, 404);
});

// 15. GET після видалення
await check('GET: після видалення -> 404', async () => {
  assert.equal((await api(`${URL_PATH}/${id}`)).status, 404);
});

console.log(failed === 0 ? '\nУсі перевірки пройдено.' : `\nНевдалих перевірок: ${failed}.`);
process.exitCode = failed === 0 ? 0 : 1;