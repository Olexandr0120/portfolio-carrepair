import { CATEGORIES } from "../data/todos.js";

function TodoForm({ onAdd }) {
  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") || "").trim();
    const category = String(new FormData(form).get("category") || CATEGORIES[0]);
    if (!text) return;
    onAdd(text, category);
    form.reset();
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label htmlFor="todo-text">Нове завдання</label>
      <input
        id="todo-text"
        name="text"
        type="text"
        maxLength={100}
        autoComplete="off"
        placeholder="Введіть назву завдання..."
      />
      <select name="category" aria-label="Категорія завдання">
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <button type="submit">Додати</button>
    </form>
  );
}
export default TodoForm;