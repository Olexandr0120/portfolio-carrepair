function Counter({ total, done }) {
  return (
    <p className="counter">
      Залишилось виконати: {total - done} із {total}
    </p>
  );
}
export default Counter;