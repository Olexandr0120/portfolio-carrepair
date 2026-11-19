import FilterButton from "./FilterButton.jsx";

function Filters({ filters, activeId, onChange }) {
  return (
    <div className="filters" role="group" aria-label="Фільтр завдань">
      {filters.map((filter) => (
        <FilterButton
          key={filter.id}
          label={filter.label}
          active={filter.id === activeId}
          onSelect={() => onChange(filter.id)}
        />
      ))}
    </div>
  );
}
export default Filters;