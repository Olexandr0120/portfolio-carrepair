const API_URL = import.meta.env.VITE_API_URL ?? '';

// Ключ для збереження JWT-токена.
const TOKEN_KEY = 'token';

// Отримуємо збережений токен користувача.
export const getToken = () =>
  sessionStorage.getItem(TOKEN_KEY);

// Зберігаємо токен після успішного входу.
export const setToken = (token) =>
  sessionStorage.setItem(TOKEN_KEY, token);

// Видаляємо токен під час виходу.
export const clearToken = () =>
  sessionStorage.removeItem(TOKEN_KEY);

// Універсальна функція для запитів до нашого REST API.
export async function request(path, { method = 'GET', body } = {}) {
  const headers = {};

  // Якщо передаємо дані, повідомляємо серверу,
  // що вони мають формат JSON.
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Для захищених маршрутів додаємо JWT-токен.
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Надсилаємо HTTP-запит до сервера.
  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // HTTP 204 означає успішне виконання без тіла відповіді.
  if (res.status === 204) {
    return { data: null, total: null };
  }

  // Отримуємо JSON-відповідь сервера.
  const data = await res.json().catch(() => null);

  // Обробляємо помилки, якщо сервер повернув
  // статус поза діапазоном 200–299.
  if (!res.ok) {
    const details = data?.details
      ? `: ${data.details.join('; ')}`
      : '';

    const error = new Error(
      (data?.error ?? `Помилка ${res.status}`) + details
    );

    error.status = res.status;
    throw error;
  }

  // Повертаємо дані та загальну кількість записів.
  // X-Total-Count потрібен для пагінації варіанта 18.
  const totalHeader = res.headers.get('X-Total-Count');

  return {
    data,
    total: totalHeader === null ? null : Number(totalHeader),
  };
}
