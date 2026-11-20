export const CATEGORIES = ["Замовлення", "Закупівля", "Організаційне"];

export const CATEGORY_KINDS = {
  "Замовлення": "high",
  "Закупівля": "medium",
  "Організаційне": "low"
};

export const initialTodos = [
  { id: 1, text: "Замовити гальмівні колодки, комплект P06071", done: true, category: "Замовлення" },
  { id: 2, text: "Купити моторну оливу 5W-30 (30 літрів)", done: true, category: "Закупівля" },
  { id: 3, text: "Зателефонувати клієнту щодо готовності авто", done: false, category: "Організаційне" },
  { id: 4, text: "Провести діагностику ходової частини", done: false, category: "Замовлення" },
  { id: 5, text: "Замовити новий сканер для діагностики", done: false, category: "Закупівля" },
  { id: 6, text: "Прибрати робоче місце в кінці зміни", done: false, category: "Організаційне" }
];

export const FILTERS = [
  { id: "all", label: "Усі" },
  { id: "active", label: "Активні" },
  { id: "done", label: "Виконані" }
];