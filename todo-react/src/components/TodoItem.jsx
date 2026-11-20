function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="todo-item">
      <label className="todo-label">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span className={todo.completed ? 'todo-title done' : 'todo-title'}>
          {todo.title}
        </span>
        {todo.meta && <span className="todo-badge">{todo.meta}</span>}
      </label>
      <button
        type="button"
        className="todo-delete"
        aria-label={`Видалити завдання: ${todo.title}`}
        onClick={() => onDelete(todo.id)}
      >
        ✕
      </button>
    </li>
  );
}

export default TodoItem;