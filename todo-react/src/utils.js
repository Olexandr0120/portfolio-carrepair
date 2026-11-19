export function filterTodos(todos, filterId) {
  if (filterId === "active") return todos.filter((t) => !t.done);
  if (filterId === "done") return todos.filter((t) => t.done);
  return todos;
}