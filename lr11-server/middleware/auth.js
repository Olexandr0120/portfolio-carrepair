import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function unauthorized(res, message) {
  res.set('WWW-Authenticate', 'Bearer');
  return res.status(401).json({ error: message });
}

// Перевіряє JWT із заголовка Authorization: Bearer <токен> і кладе користувача в req.user
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('Authorization') ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    return unauthorized(res, 'Потрібна автентифікація: заголовок Authorization: Bearer <токен>');
  }

  let payload;
  try {
    // Жорстко фіксуємо алгоритм HS256 для захисту від атаки alg: none
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Термін дії токена минув' : 'Недійсний токен';
    return unauthorized(res, message);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return unauthorized(res, 'Користувача не існує');
  }

  req.user = user;
  next();
}

// Пропускає лише користувачів із однією з указаних ролей
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав для цієї дії' });
    }
    next();
  };
}