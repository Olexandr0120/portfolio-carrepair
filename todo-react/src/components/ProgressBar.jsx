function ProgressBar({ label, value, max }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="progress">
      <span className="progress__label">{label}</span>
      <progress value={value} max={max === 0 ? 1 : max} aria-label={label} />
      <span>{percent}%</span>
    </div>
  );
}
export default ProgressBar;