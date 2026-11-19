import Header from "./components/Header.jsx";
import TodoForm from "./components/TodoForm.jsx";
import Filters from "./components/Filters.jsx";
import TodoList from "./components/TodoList.jsx";
import Counter from "./components/Counter.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import { initialTodos, FILTERS } from "./data/todos.js";
import { filterTodos } from "./utils.js";

function App() {
  const todos = initialTodos;
  const activeFilter = "all";
  const visibleTodos = filterTodos(todos, activeFilter);
  const doneCount = todos.filter((t) => t.done).length;

  // Тимчасові обробники (на ЛР10 з'явиться useState)
  const handleAdd = (text, category) => console.log("Додати:", text, "| Категорія:", category);
  const handleToggle = (id) => console.log("Перемкнути:", id);
  const handleDelete = (id) => console.log("Видалити:", id);
  const handleFilter = (id) => console.log("Фільтр:", id);

  // Для ProgressBar: підмножина за категорією "Замовлення"
  const subsetTodos = todos.filter((t) => t.category === "Замовлення");
  const subsetDone = subsetTodos.filter((t) => t.done).length;

  return (
    <main className="app">
      <Header
        title="Заявки на ремонт та запчастини СТО"
        subtitle="Компонентна версія на React (ЛР № 9)"
      />
      <TodoForm onAdd={handleAdd} />
      <Filters filters={FILTERS} activeId={activeFilter} onChange={handleFilter} />
      <TodoList
        todos={visibleTodos}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <Counter total={todos.length} done={doneCount} />

      {/* Додатковий компонент — ProgressBar (варіант 18, Б) — використано ДВІЧІ */}
      <ProgressBar label="Усі заявки" value={doneCount} max={todos.length} />
      <ProgressBar
        label="Категорія «Замовлення»"
        value={subsetDone}
        max={subsetTodos.length}
      />
    </main>
  );
}
export default App;