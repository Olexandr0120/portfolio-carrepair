import { useState } from 'react';

const MIN_TITLE_LENGTH = 3;

function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();

    if (trimmed.length < MIN_TITLE_LENGTH) {
      setError(`Назва має містити щонайменше ${MIN_TITLE_LENGTH} символи.`);
      return;
    }

    onAdd(trimmed);
    setTitle('');
    setError('');
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-todo">Нове завдання</label>
      <div className="todo-form-row">
        <input
          id="new-todo"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError('');
          }}
          placeholder="Що потрібно зробити?"
        />
        <button type="submit">Додати</button>
      </div>
      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}
    </form>
  );
}

export default TodoForm;