const BASE = process.env.API_BASE ?? 'http://localhost:3018';
const ADMIN_EMAIL = 'admin@example.com';
const ALICE_EMAIL = 'alice@example.com';
const BOB_EMAIL = 'bob@example.com';
const PASSWORD = 'Passw0rd!';

let passed = 0;
let failed = 0;

function check(name, condition, details = '') {
  if (condition) {
    passed++;
    console.log(`[OK]   ${name}${details ? ' - ' + details : ''}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}${details ? ' - ' + details : ''}`);
  }
}

async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // 204 No Content - тіла немає
  }
  return { status: res.status, data, headers: res.headers };
}

async function login(email) {
  const { status, data } = await request('POST', '/api/auth/login', {
    body: { email, password: PASSWORD },
  });
  if (status !== 200) throw new Error(`Логін ${email} не вдався: ${status}`);
  return data.token;
}

console.log('=== Перевірка автентифікації та авторизації (ЛР №14, варіант 18) ===');
console.log(`Базовий URL: ${BASE}`);
console.log('');

// 1. Логін alice
const aliceToken = await login(ALICE_EMAIL);
check(
  'Логін alice повертає токен',
  typeof aliceToken === 'string' && aliceToken.split('.').length === 3
);

// 2. Логін admin
const adminToken = await login(ADMIN_EMAIL);
check('Логін admin повертає токен', typeof adminToken === 'string');

// 3. TTL = 7200 секунд
const payload = JSON.parse(
  Buffer.from(aliceToken.split('.')[1], 'base64url').toString()
);
check(
  'TTL токена = 7200 секунд (2 години)',
  payload.exp - payload.iat === 7200,
  `exp - iat = ${payload.exp - payload.iat}`
);

// 4. GET /api/auth/me з токеном
const me = await request('GET', '/api/auth/me', { token: aliceToken });
check('GET /api/auth/me з токеном -> 200', me.status === 200);
check('У відповіді немає passwordHash', me.data && !('passwordHash' in me.data));

// 5. GET /api/auth/me без токена -> 401
const meNoToken = await request('GET', '/api/auth/me');
check('GET /api/auth/me без токена -> 401', meNoToken.status === 401);
check(
  'Присутній заголовок WWW-Authenticate: Bearer',
  (meNoToken.headers.get('www-authenticate') ?? '').includes('Bearer')
);

// 6. GET /api/auth/users як user -> 403
const usersAsUser = await request('GET', '/api/auth/users', { token: aliceToken });
check('GET /api/auth/users як user -> 403', usersAsUser.status === 403);

// 7. GET /api/auth/users як admin -> 200
const usersAsAdmin = await request('GET', '/api/auth/users', { token: adminToken });
check('GET /api/auth/users як admin -> 200', usersAsAdmin.status === 200);
check(
  'У списку користувачів немає passwordHash',
  Array.isArray(usersAsAdmin.data) &&
    usersAsAdmin.data.every((u) => !('passwordHash' in u))
);

// 8. POST /api/cars без токена -> 401
const createNoToken = await request('POST', '/api/cars', {
  body: { brand: 'Test', model: 'NoToken', year: 2020 },
});
check('POST /api/cars без токена -> 401', createNoToken.status === 401);

// 9. POST /api/cars з токеном alice -> 201
const created = await request('POST', '/api/cars', {
  token: aliceToken,
  body: { brand: 'Volkswagen', model: 'Passat', year: 2021 },
});
check('POST /api/cars з токеном alice -> 201', created.status === 201);
const carId = created.data?.id;

// 10. GET /api/cars/mine - власні записи
const mine = await request('GET', '/api/cars/mine', { token: aliceToken });
check(
  'GET /api/cars/mine повертає масив',
  Array.isArray(mine.data) && mine.data.length > 0
);

// 11. ТИП 2: спроба видалити як bob (не власник) -> 403
const bobToken = await login(BOB_EMAIL);
const deleteAsBob = await request('DELETE', `/api/cars/${carId}`, { token: bobToken });
check('Тип 2: DELETE запису alice як bob -> 403', deleteAsBob.status === 403);

// 12. ТИП 2: спроба видалити як alice (власник) -> 403 (бо не адмін)
const deleteAsAlice = await request('DELETE', `/api/cars/${carId}`, { token: aliceToken });
check(
  'Тип 2: DELETE власного запису alice -> 403 (лише адмін)',
  deleteAsAlice.status === 403
);

// 13. ТИП 2: видалення як admin -> 204
const deleteAsAdmin = await request('DELETE', `/api/cars/${carId}`, { token: adminToken });
check('Тип 2: DELETE як admin -> 204', deleteAsAdmin.status === 204);

// Підсумок
console.log('');
console.log(`Результат: ${passed} пройдено, ${failed} провалено`);
if (failed > 0) {
  console.error('[FAIL] Є помилки - перевір сервер, .env та seed.js');
  process.exit(1);
}
console.log('Усі перевірки пройдено успішно!');