// Middleware логування: ТИП 2 
// Формат: час ISO + метод + URL + статус-код
export function logger(req, res, next) {
  res.on('finish', () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode}`
    );
  });
  next();
}