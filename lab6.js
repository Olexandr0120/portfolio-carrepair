// === ЧАСТИНА 1. КОНВЕРТЕР ШВИДКОСТІ ===
const units = {
    "м/с": 1,
    "км/год": 0.2777777778,
    "миля/год": 0.44704,
    "вузол": 0.5144444444
};

function convert(value, from, to) {
    const inBase = value * units[from];
    return inBase / units[to];
}

console.log("Тест конвертера 1:", convert(100, "км/год", "м/с"));
console.log("Тест конвертера 2:", convert(10, "м/с", "вузол"));

function parseValue(text) {
    const normalized = text.trim().replace(",", ".");
    if (normalized === "") {
        return { error: "Введіть значення." };
    }
    const number = Number(normalized);
    if (!Number.isFinite(number)) {
        return { error: "Введіть коректне число, наприклад 5,5." };
    }
    if (number < 0) {
        return { error: "Значення не може бути від'ємним." };
    }
    return { number: number };
}

console.log('parseValue("5,5"):', parseValue("5,5"));
console.log('parseValue(""):', parseValue(""));
console.log('parseValue("abc"):', parseValue("abc"));
console.log('parseValue("-3"):', parseValue("-3"));
console.log('parseValue(" 12 "):', parseValue(" 12 "));

const form = document.querySelector("#converter");
const valueInput = document.querySelector("#value");
const fromSelect = document.querySelector("#from");
const toSelect = document.querySelector("#to");
const resultBox = document.querySelector("#conv-result");

// Заповнюємо списки одиницями
for (const name in units) {
    fromSelect.add(new Option(name, name));
    toSelect.add(new Option(name, name));
}
toSelect.selectedIndex = 1;

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const parsed = parseValue(valueInput.value);
    if (parsed.error) {
        resultBox.textContent = parsed.error;
        return;
    }
    const result = convert(parsed.number, fromSelect.value, toSelect.value);
    const pretty = result.toLocaleString("uk-UA", { maximumFractionDigits: 4 });
    resultBox.textContent = `${parsed.number} ${fromSelect.value} = ${pretty} ${toSelect.value}`;
});

// === ЧАСТИНА 2. КАТАЛОГ АВТОТОВАРІВ ===
const products = [
    { id: 1, name: "Моторна олива 5W-30", category: "Мастила", price: 1200, qty: 15, rating: 4.8 },
    { id: 2, name: "Фільтр масляний", category: "Запчастини", price: 250, qty: 30, rating: 4.5 },
    { id: 3, name: "Гальмівні колодки передні", category: "Запчастини", price: 1800, qty: 0, rating: 4.9 },
    { id: 4, name: "Акумулятор 60Ah", category: "Електрика", price: 3200, qty: 5, rating: 4.7 },
    { id: 5, name: "Свічки запалювання (4 шт)", category: "Запчастини", price: 600, qty: 20, rating: 4.6 },
    { id: 6, name: "Антифриз G12 5л", category: "Рідини", price: 450, qty: 2, rating: 4.4 },
    { id: 7, name: "Щітки склоочисника", category: "Аксесуари", price: 350, qty: 12, rating: 4.3 },
    { id: 8, name: "Трансмісійна олива ATF", category: "Мастила", price: 1500, qty: 0, rating: 4.8 },
    { id: 9, name: "Компресор автомобільний", category: "Аксесуари", price: 900, qty: 4, rating: 4.5 },
    { id: 10, name: "Ремінь ГРМ комплект", category: "Запчастини", price: 2200, qty: 3, rating: 4.7 }
];

const PRICE_LIMIT = 1000;
const DISCOUNT = 15;
const LOW_STOCK = 5;

function formatMoney(amount) {
    return amount.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " грн";
}

function priceWithDiscount(price) {
    return price * (100 - DISCOUNT) / 100;
}

function getStatus(qty) {
    if (qty === 0) {
        return "немає в наявності";
    } else if (qty <= LOW_STOCK) {
        return "закінчується";
    } else {
        return "є в наявності";
    }
}

function addDiscount(product) {
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        qty: product.qty,
        rating: product.rating,
        discounted: priceWithDiscount(product.price)
    };
}

const catalog = products.map(addDiscount);
console.table(catalog);

const tbody = document.querySelector("#products-body");
const summary = document.querySelector("#summary");

function renderTable(list) {
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Нічого не знайдено</td></tr>';
        return;
    }
    let rows = "";
    for (const item of list) {
        rows += `<tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${formatMoney(item.price)}</td>
            <td>${formatMoney(item.discounted)}</td>
            <td>${item.qty}</td>
            <td>${getStatus(item.qty)}</td>
        </tr>`;
    }
    tbody.innerHTML = rows;
}

function renderSummary(list) {
    if (list.length === 0) {
        summary.textContent = "Немає товарів для розрахунку підсумків.";
        return;
    }
    const totalValue = list.reduce((sum, item) => sum + item.price * item.qty, 0);
    const avgRating = list.reduce((sum, item) => sum + item.rating, 0) / list.length;
    const maxPrice = list.reduce((max, item) => (item.price > max ? item.price : max), 0);
    summary.textContent = `Товари: ${list.length}. Вартість залишків: ${formatMoney(totalValue)}. Середній рейтинг: ${avgRating.toFixed(2)}. Найвища ціна: ${formatMoney(maxPrice)}.`;
}

function show(list) {
    renderTable(list);
    renderSummary(list);
}

show(catalog);

const toolbar = document.querySelector(".toolbar");
toolbar.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (!action) return;
    
    let list = catalog;
    
    if (action === "expensive") {
        list = catalog.filter((item) => item.price > PRICE_LIMIT);
    } else if (action === "available") {
        list = catalog.filter((item) => item.qty > 0);
    } else if (action === "sort-asc") {
        list = catalog.slice().sort((a, b) => a.price - b.price);
    } else if (action === "sort-desc") {
        list = catalog.slice().sort((a, b) => b.price - a.price);
    }
    
    show(list);
});

const countByCategory = catalog.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
}, {});
console.log("Кількість товарів за категоріями:", countByCategory);