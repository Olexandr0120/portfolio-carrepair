
import { useEffect, useState } from 'react';
import {
  request,
  getToken,
  setToken,
  clearToken,
} from './api.js';

// Компонент для входу та реєстрації користувача.
function AuthForm({ onLoggedIn }) {
  const [mode, setMode] = useState('login');

  // Дані, які користувач вводить у форму.
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Змінюємо значення потрібного поля форми.
  function change(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  // Виконуємо реєстрацію або авторизацію.
  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Якщо обрана реєстрація, спочатку
      // створюємо нового користувача в базі даних.
      if (mode === 'register') {
        await request('/api/auth/register', {
          method: 'POST',
          body: form,
        });
      }

      // Надсилаємо email і пароль на сервер.
      const { data } = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
        },
      });

      // Зберігаємо отриманий JWT-токен.
      setToken(data.token);

      // Передаємо інформацію про користувача
      // до головного компонента.
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h2>
        {mode === 'login'
          ? 'Вхід до системи'
          : 'Реєстрація користувача'}
      </h2>

      {mode === 'register' && (
        <label>
          Ім'я
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={change}
            minLength={2}
            required
          />
        </label>
      )}

      <label>
        Електронна пошта
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={change}
          required
        />
      </label>

      <label>
        Пароль
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={change}
          minLength={8}
          required
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading}>
        {loading
          ? 'Зачекайте…'
          : mode === 'login'
            ? 'Увійти'
            : 'Зареєструватися'}
      </button>

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode((prev) =>
            prev === 'login' ? 'register' : 'login'
          );
          setError('');
        }}
      >
        {mode === 'login'
          ? 'Немає акаунта? Зареєструватися'
          : 'Вже є акаунт? Увійти'}
      </button>
    </form>
  );
}

// Компонент для роботи з автомобілями автосервісу.
function Cars({ user }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);

  // Пошуковий запит за маркою автомобіля.
  const [q, setQ] = useState('');

  // Форма додавання автомобіля — варіант 18.
  const [form, setForm] = useState({
    brand: '',
    model: '',
    year: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Додаткова вимога типу 2 — пагінація.
  const [page, setPage] = useState(1);
  const limit = 5;

  // Лічильник для повторного завантаження даних
  // після створення або видалення автомобіля.
  const [refresh, setRefresh] = useState(0);

  // Завантажуємо дані із сервера при зміні
  // сторінки, пошуку або лічильника оновлення.
  useEffect(() => {
    // Цей прапорець дозволяє ігнорувати
    // застарілу відповідь попереднього запиту.
    let cancelled = false;

    // Формуємо URL з параметрами пагінації.
    const url =
      `/api/cars?page=${page}` +
      `&limit=${limit}` +
      `&q=${encodeURIComponent(q)}`;

    // Виконуємо асинхронний запит.
    // setState викликаємо у колбеках Promise,
    // а не синхронно в тілі useEffect.
    request(url)
      .then(({ data, total: count }) => {
        if (cancelled) return;

        setItems(data);
        setTotal(count);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;

        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    // Очищення ефекту при зміні параметрів.
    return () => {
      cancelled = true;
    };
  }, [page, q, refresh]);

  // Повторно завантажуємо список автомобілів.
  function reload() {
    setLoading(true);
    setRefresh((prev) => prev + 1);
  }

  // Створення нового запису.
  async function create(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Перетворюємо рік випуску на число.
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
      };

      await request('/api/cars', {
        method: 'POST',
        body: payload,
      });

      // Очищаємо форму після успішного запиту.
      setForm({
        brand: '',
        model: '',
        year: '',
      });

      // Після додавання повертаємося
      // на першу сторінку каталогу.
      setLoading(true);

      if (page !== 1) {
        setPage(1);
      } else {
        reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Видалення автомобіля за його id.
  async function remove(id) {
    setError('');

    try {
      await request(`/api/cars/${id}`, {
        method: 'DELETE',
      });

      // Якщо після видалення поточна сторінка
      // стала порожньою, повертаємося назад.
      setLoading(true);

      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        reload();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // За правилами ЛР14 варіанта 18
  // видаляти записи може лише адміністратор.
  // Сервер також перевіряє роль користувача.
  const canDelete = user.role === 'admin';

  // Розраховуємо загальну кількість сторінок.
  const pageCount = Math.max(
    1,
    Math.ceil((total ?? 0) / limit)
  );

  return (
    <section>
      <h2>Каталог автомобілів</h2>

      <p className="muted">
        Система обліку автомобілів СТО «МоторЛайн»
      </p>

      {/* Форма додавання нового автомобіля */}
      <form onSubmit={create} className="card row">
        <input
          type="text"
          placeholder="Марка автомобіля"
          value={form.brand}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              brand: e.target.value,
            }))
          }
          minLength={2}
          maxLength={100}
          required
        />

        <input
          type="text"
          placeholder="Модель автомобіля"
          value={form.model}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              model: e.target.value,
            }))
          }
          minLength={2}
          maxLength={100}
          required
        />

        <input
          type="number"
          placeholder="Рік випуску"
          value={form.year}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              year: e.target.value,
            }))
          }
          min={1886}
          max={2100}
          step={1}
          required
        />

        <button type="submit" disabled={saving}>
          {saving ? 'Додавання…' : 'Додати автомобіль'}
        </button>
      </form>

      {/* Пошук за маркою автомобіля */}
      <input
        type="search"
        className="search"
        placeholder="Пошук за маркою автомобіля…"
        value={q}
        onChange={(e) => {
          setLoading(true);
          setQ(e.target.value);
          setPage(1);
        }}
      />

      {/* Повідомлення про помилку */}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {/* Відображення автомобілів */}
      {loading ? (
        <p>Завантаження автомобілів…</p>
      ) : items.length === 0 ? (
        <p>Автомобілів не знайдено.</p>
      ) : (
        <ul className="list">
          {items.map((car) => (
            <li key={car.id}>
              <span>
                <strong>
                  {car.brand} {car.model}
                </strong>
                {' '}— {car.year} рік
              </span>

              {canDelete && (
                <button
                  type="button"
                  className="link"
                  onClick={() => remove(car.id)}
                >
                  Видалити
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Лічильник загальної кількості записів */}
      {total !== null && (
        <p className="muted">
          Усього автомобілів: {total}
        </p>
      )}

      {/* Пагінація — додаткова вимога варіанта 18 */}
      <div className="row pagination">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => {
            setLoading(true);
            setPage((prev) => prev - 1);
          }}
        >
          Попередня
        </button>

        <span>
          Сторінка {page} з {pageCount}
        </span>

        <button
          type="button"
          disabled={
            loading ||
            page * limit >= (total ?? 0)
          }
          onClick={() => {
            setLoading(true);
            setPage((prev) => prev + 1);
          }}
        >
          Наступна
        </button>
      </div>
    </section>
  );
}

// Головний компонент вебзастосунку.
export default function App() {
  const [user, setUser] = useState(null);

  // Якщо токен уже збережений, перевіряємо
  // його дійсність через сервер.
  const [checking, setChecking] = useState(
    Boolean(getToken())
  );

  useEffect(() => {
    if (!getToken()) return;

    // Перевіряємо поточну сесію користувача.
    request('/api/auth/me')
      .then(({ data }) => {
        setUser(data);
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  // Вихід із системи та очищення токена.
  function logout() {
    clearToken();
    setUser(null);
  }

  if (checking) {
    return (
      <main>
        <p>Перевірка сесії користувача…</p>
      </main>
    );
  }

  return (
    <main>
      <header className="top">
        <div>
          <h1>Автосервіс «МоторЛайн»</h1>
          <p className="muted">
            Система обліку автомобілів
          </p>
        </div>

        {user && (
          <span>
            {user.name} ({user.role}){' '}
            <button
              type="button"
              className="link"
              onClick={logout}
            >
              Вийти
            </button>
          </span>
        )}
      </header>

      {user ? (
        <Cars user={user} />
      ) : (
        <AuthForm onLoggedIn={setUser} />
      )}
    </main>
  );
}
