// 1. Ключ сховища localStorage 
const STORAGE_KEY = "lab7-todos-18";

// 2. Стан застосунку (єдине джерело правди)
let tasks = []; 
let filter = "all"; 
let editingId = null; 

// 3. Посилання на елементи DOM
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-text");
const categorySelect = document.querySelector("#todo-category");
const errorBox = document.querySelector("#form-error");
const list = document.querySelector("#todo-list");
const counter = document.querySelector("#todo-counter");
const filtersBox = document.querySelector(".filters");
const clearDoneBtn = document.querySelector("#clear-done");

// === Допоміжні функції ===
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error("Не вдалося зберегти дані", e);
    }
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Не вдалося завантажити дані", e);
        return [];
    }
}

function makeButton(action, text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.action = action;
    btn.textContent = text;
    return btn;
}

function validateText(text, ignoreId) {
    if (text === "") return "Введіть текст завдання.";
    if (text.length > 100) return "Максимум 100 символів.";
    const duplicate = tasks.some(
        (t) => t.id !== ignoreId && t.text.toLowerCase() === text.toLowerCase()
    );
    if (duplicate) return "Таке завдання вже є у списку.";
    return "";
}

// === Функції відображення ===
function createItem(task) {
    const li = document.createElement("li");
    li.dataset.id = task.id;
    if (task.done) li.classList.add("is-done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.action = "toggle";
    checkbox.setAttribute("aria-label", "Виконано: " + task.text);
    li.append(checkbox);

    if (task.id === editingId) {
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "edit-input";
        editInput.value = task.text;
        editInput.maxLength = 100;
        editInput.setAttribute("aria-label", "Редагування завдання");
        li.append(
            editInput,
            makeButton("save", "Зберегти"),
            makeButton("cancel", "Скасувати")
        );
    } else {
        const span = document.createElement("span");
        span.className = "text";
        span.textContent = task.text;
        
        const meta = document.createElement("span");
        meta.className = "meta";
        meta.textContent = "Категорія: " + (task.category || "Загальне");
        
        li.append(
            span,
            meta,
            makeButton("edit", "Редагувати"),
            makeButton("delete", "Видалити")
        );
    }
    return li;
}

function getVisibleTasks() {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
}

function render() {
    list.replaceChildren();
    const visible = getVisibleTasks();

    if (visible.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "Завдань немає";
        list.append(empty);
    } else {
        for (const task of visible) {
            list.append(createItem(task));
        }
    }

    const left = tasks.filter((t) => !t.done).length;
    counter.textContent = `Залишилось виконати: ${left} із ${tasks.length}`;

    for (const button of filtersBox.querySelectorAll("button")) {
        button.classList.toggle("is-active", button.dataset.filter === filter);
    }

    // Робимо кнопку "Очистити виконані" неактивною, якщо немає виконаних завдань
    clearDoneBtn.disabled = !tasks.some((t) => t.done);

    const editField = list.querySelector(".edit-input");
    if (editField) {
        editField.focus();
        editField.select();
    }
}

//  Обробники подій 
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    const message = validateText(text, null);
    errorBox.textContent = message;

    if (message !== "") {
        input.focus();
        return;
    }

    tasks.push({
        id: Date.now(),
        text: text,
        done: false,
        category: categorySelect.value
    });

    input.value = "";
    save();
    render();
    input.focus();
});

// Делегування подій на списку
list.addEventListener("click", (event) => {
    const control = event.target.closest("[data-action]");
    if (!control) return;

    const li = control.closest("li");
    if (!li) return;

    const id = Number(li.dataset.id);
    const action = control.dataset.action;

    if (action === "toggle") {
        const task = tasks.find((t) => t.id === id);
        if (task) {
            task.done = !task.done;
            save();
            render();
        }
    } else if (action === "delete") {
        if (editingId === id) editingId = null;
        tasks = tasks.filter((t) => t.id !== id);
        save();
        render();
    } else if (action === "edit") {
        editingId = id;
        render();
    } else if (action === "cancel") {
        editingId = null;
        render();
    } else if (action === "save") {
        const editInput = li.querySelector(".edit-input");
        const newText = editInput.value.trim();
        const message = validateText(newText, id);
        errorBox.textContent = message;

        if (message === "") {
            const task = tasks.find((t) => t.id === id);
            if (task) task.text = newText;
            editingId = null;
            save();
            render();
        }
    }
});

// Фільтрація
filtersBox.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-filter]");
    if (!btn) return;
    filter = btn.dataset.filter;
    render();
});

// Очистити виконані (Варіант 18)
clearDoneBtn.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    editingId = null;
    save();
    render();
});

// Ініціалізація
tasks = load();
render();