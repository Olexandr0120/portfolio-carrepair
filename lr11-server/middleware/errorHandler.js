// 404: жоден маршрут не підійшов
export function notFound(req, res) {
  res.status(404).json({ error: 'Маршрут не знайдено', path: req.originalUrl });
}

// Централізований обробник помилок
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Тіло запиту завелике (максимум 10 КБ)' });
  }
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Дані не пройшли перевірку', details });
  }
  // Обробка порушення унікального індексу MongoDB (код 11000) -> 409 Conflict
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue ?? {}).join(', ');
    return res.status(409).json({
      error: `Запис із таким значенням поля (${fields}) уже існує`,
    });
  }
  
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({
    error: status === 500 ? 'Внутрішня помилка сервера' : err.message,
  });
}