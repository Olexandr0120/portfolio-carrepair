function FilterButton({ label, active, onSelect }) {
  return (
    <button
      type="button"
      className={active ? "is-active" : ""}
      aria-pressed={active}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}
export default FilterButton;