const FILTERS = [
  { value: 'all', label: 'Усі' },
  { value: 'active', label: 'Активні' },
  { value: 'done', label: 'Виконані' },
];

function TodoFilters({ filter, onFilterChange, query, onQueryChange }) {
  return (
    <div className="todo-filters">
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Пошук за назвою..."
        aria-label="Пошук завдань за назвою"
      />
      <div className="filter-group" role="group" aria-label="Фільтр завдань за станом">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'filter-btn active' : 'filter-btn'}
            aria-pressed={filter === value}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TodoFilters;