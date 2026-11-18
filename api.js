"use strict";

// 1. Клас для HTTP-помилок
class HttpError extends Error {
    constructor(status) {
        super(`HTTP ${status}`);
        this.name = "HttpError";
        this.status = status;
    }
}

// 2. Універсальна функція запиту JSON із тайм-аутом
async function fetchJson(url, options = {}) {
    const { timeoutMs = 8000, signal } = options;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = signal
        ? AbortSignal.any([timeoutSignal, signal])
        : timeoutSignal;

    let response;
    try {
        response = await fetch(url, { signal: combinedSignal });
    } catch (error) {
        if (error.name === "AbortError") throw error;
        if (error.name === "TimeoutError") {
            throw new Error("Сервер не відповів вчасно. Спробуйте ще раз.");
        }
        throw new Error("Немає з'єднання з сервером. Перевірте інтернет.");
    }

    if (!response.ok) {
        throw new HttpError(response.status);
    }

    try {
        return await response.json();
    } catch {
        throw new Error("Сервер повернув некоректні дані (не у форматі JSON).");
    }
}

// 3. Перетворення технічної помилки на зрозуміле повідомлення
function describeError(error) {
    if (error instanceof HttpError) {
        if (error.status === 404) return "Нічого не знайдено (код 404). Перевірте рік та код країни.";
        if (error.status === 429) return "Забагато запитів. Зачекайте хвилину і спробуйте знову.";
        if (error.status >= 500) return "Помилка на боці сервісу. Спробуйте пізніше.";
        return `Сервіс відповів помилкою (код ${error.status}).`;
    }
    return error.message || "Сталася невідома помилка.";
}

// 4. Посилання на DOM-елементи
const form = document.querySelector("#search-form");
const queryInput = document.querySelector("#query-input");
const formError = document.querySelector("#form-error");
const statusBox = document.querySelector("#status");
const resultBox = document.querySelector("#result");
const loadMoreBtn = document.querySelector("#load-more-btn");

// 5. Стан інтерфейсу
const state = { status: "idle", message: "" };
let lastAction = null;
let currentController = null;

function setStatus(status, message = "") {
    state.status = status;
    state.message = message;
    renderStatus();
}

function renderStatus() {
    statusBox.replaceChildren();
    
    if (state.status === "loading") {
        statusBox.textContent = "Завантаження...";
    } else if (state.status === "empty") {
        statusBox.textContent = state.message;
    } else if (state.status === "error") {
        const text = document.createElement("p");
        text.textContent = state.message;
        const retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.textContent = "Повторити";
        retryBtn.addEventListener("click", () => {
            if (lastAction) lastAction();
        });
        statusBox.append(text, retryBtn);
    }
}

// 6. Пагінація (Варіант А)
const API_URL = "https://date.nager.at/api/v3/PublicHolidays";
let allHolidays = [];
let currentIndex = 0;
const PAGE_SIZE = 6;

// 7. Завантаження свят
async function loadHolidays(year, countryCode) {
    if (currentController) currentController.abort();
    currentController = new AbortController();
    
    lastAction = () => loadHolidays(year, countryCode);
    setStatus("loading");
    resultBox.replaceChildren();
    loadMoreBtn.hidden = true;
    allHolidays = [];
    currentIndex = 0;
    
    try {
        const data = await fetchJson(`${API_URL}/${year}/${countryCode}`, {
            signal: currentController.signal
        });
        
        if (!data || data.length === 0) {
            setStatus("empty", `За запитом "${year} ${countryCode}" нічого не знайдено.`);
            return;
        }
        
        setStatus("success");
        allHolidays = data;
        renderHolidays(true);
    } catch (error) {
        if (error.name === "AbortError") return;
        
        // Спеціальна обробка для 404 (стан empty)
        if (error instanceof HttpError && error.status === 404) {
            setStatus("empty", `Для країни з кодом "${countryCode}" у ${year} році свят не знайдено.`);
            return;
        }
        
        setStatus("error", describeError(error));
    }
}

// 8. Відображення свят порціями
function renderHolidays(reset) {
    if (reset) resultBox.replaceChildren();
    
    const chunk = allHolidays.slice(currentIndex, currentIndex + PAGE_SIZE);
    
    for (const holiday of chunk) {
        const card = document.createElement("div");
        card.className = "holiday-card";
        
        const title = document.createElement("h3");
        title.textContent = holiday.localName || holiday.name || "Невідоме свято";
        
        const date = document.createElement("span");
        date.className = "date";
        date.textContent = `Дата: ${holiday.date}`;
        
        card.append(title, date);
        resultBox.append(card);
    }
    
    currentIndex += chunk.length;
    
    if (currentIndex < allHolidays.length) {
        loadMoreBtn.hidden = false;
    } else {
        loadMoreBtn.hidden = true;
    }
}

// 9. Обробник форми
form.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";
    
    const parts = queryInput.value.trim().split(/\s+/);
    if (parts.length !== 2) {
        formError.textContent = "Введіть рік та код країни через пробіл (наприклад, 2026 UA).";
        return;
    }
    
    const [year, countryCode] = parts;
    if (!/^\d{4}$/.test(year) || !/^[A-Za-z]{2}$/.test(countryCode)) {
        formError.textContent = "Рік має бути 4 цифри, код країни - 2 літери.";
        return;
    }
    
    loadHolidays(year, countryCode.toUpperCase());
});

// 10. Кнопка "Показати ще"
loadMoreBtn.addEventListener("click", () => {
    renderHolidays(false);
});

// 11. Ініціалізація
setStatus("idle");