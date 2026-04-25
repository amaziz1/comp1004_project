/* ===================== SPA Navigation ===================== */
const sections = document.querySelectorAll(".spa-section");
const navButtons = document.querySelectorAll("nav button.nav-button");

navButtons.forEach(button => {
    button.addEventListener("click", e => {
        e.preventDefault();

        sections.forEach(s => s.classList.add("hidden"));
        const targetId = button.dataset.target.substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
});

/* ===================== Persistent Dark Mode ===================== */
const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("darkMode", isDark);
});

/* ===================== Facts Section ===================== */
const facts = [
    "SPAs load content dynamically.",
    "Dark mode reduces eye strain.",
    "Task managers boost productivity."
];
let factIndex = 0;
const factText = document.getElementById("fact-text");
const factCounter = document.getElementById("fact-counter");

function updateFact() {
    factText.textContent = facts[factIndex];
    factCounter.textContent = `${factIndex + 1}/${facts.length}`;
}

document.querySelector(".next-fact").addEventListener("click", () => {
    factIndex = (factIndex + 1) % facts.length;
    updateFact();
});

updateFact();

/* ===================== Task Manager ===================== */
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority");
const taskProject = document.getElementById("taskProject");
const taskRecurrence = document.getElementById("taskRecurrence");
const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar");
const taskSearch = document.getElementById("taskSearch");
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let currentCategory = null;
let currentProject = null;
let currentSearch = "";

/* ===================== Save and Render Tasks ===================== */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = "";
    const now = new Date();

    const filteredTasks = tasks.filter(t => {
        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "active" && !t.completed) ||
            (currentFilter === "completed" && t.completed);
        const matchesCategory = !currentCategory || t.category === currentCategory;
        const matchesProject = !currentProject || t.project === currentProject;
        const matchesSearch = !currentSearch || t.text.toLowerCase().includes(currentSearch);

        return matchesFilter && matchesCategory && matchesProject && matchesSearch;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        li.classList.add(task.priority);

        const taskDue = new Date(task.date);
        if (!task.completed && (taskDue - now) <= 86400000 && taskDue > now) {
            li.classList.add("reminder");
        }

        li.innerHTML = `
            ${task.text} (${task.category}) [${task.priority}] - Project: ${task.project || 'N/A'}
            <button class="complete">${task.completed ? "↺" : "✔"}</button>
            <button class="delete">❌</button>
            <button class="timer">${task.timeElapsed || 0}s ⏱</button>
        `;

        // Complete toggle
        li.querySelector(".complete").addEventListener("click", () => {
            if (!task.completed) {
                task.completed = true;

                // Handle recurrence
                if (["daily", "weekly"].includes(task.recurrence)) {
                    const nextDate = new Date(task.date);
                    nextDate.setDate(nextDate.getDate() + (task.recurrence === "daily" ? 1 : 7));

                    tasks.push({
                        ...task,
                        date: nextDate.toISOString().split("T")[0],
                        completed: false,
                        timeElapsed: 0
                    });
                }
            } else {
                task.completed = false;
            }

            saveTasks();
            renderTasks();
        });

        // Delete task
        li.querySelector(".delete").addEventListener("click", () => {
            tasks = tasks.filter(t => t !== task);
            saveTasks();
            renderTasks();
        });

        // Timer
        const timerBtn = li.querySelector(".timer");
        let timerInterval = null;
        timerBtn.addEventListener("click", () => {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            } else {
                timerInterval = setInterval(() => {
                    task.timeElapsed = (task.timeElapsed || 0) + 1;
                    timerBtn.textContent = `${task.timeElapsed}s ⏱`;
                    saveTasks();
                }, 1000);
            }
        });

        taskList.appendChild(li);
    });

    // Update progress bar
    const completedCount = tasks.filter(t => t.completed).length;
    progressBar.style.width = tasks.length ? `${(completedCount / tasks.length) * 100}%` : "0%";
}

/* ===================== Add Task ===================== */
taskForm.addEventListener("submit", e => {
    e.preventDefault();

    const newTask = {
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        project: taskProject.value || null,
        recurrence: taskRecurrence.value || null,
        completed: false,
        timeElapsed: 0
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskForm.reset();
});

/* ===================== Task Filters ===================== */
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#task-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        currentProject = btn.dataset.project || null;

        renderTasks();
    });
});

/* ===================== Task Search ===================== */
taskSearch.addEventListener("input", e => {
    currentSearch = e.target.value.toLowerCase();
    renderTasks();
});

/* ===================== Export / Import JSON ===================== */
const exportJSON = document.getElementById("exportJSON");
const importBtn = document.getElementById("importJSONBtn");
const importInput = document.getElementById("importJSON");

exportJSON.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
});

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (!Array.isArray(importedTasks)) throw new Error("Invalid JSON format.");
            tasks = importedTasks;
            saveTasks();
            renderTasks();
            alert("Tasks imported successfully!");
        } catch (err) {
            alert("Error importing tasks: " + err.message);
        }
    };
    reader.readAsText(file);
});

/* ===================== Export CSV ===================== */
const exportCSVBtn = document.getElementById("exportCSV");
exportCSVBtn.addEventListener("click", () => {
    if (!tasks.length) return alert("No tasks to export.");

    const csvRows = [["Text","Date","Category","Priority","Project","Completed","TimeElapsed"]];
    tasks.forEach(t => csvRows.push([
        `"${t.text}"`,
        t.date,
        t.category,
        t.priority,
        `"${t.project || ""}"`,
        t.completed,
        t.timeElapsed || 0
    ]));

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = "tasks.csv";
    a.click();
});

/* ===================== Contact Form ===================== */
const contactFormEl = document.getElementById('contactForm');
const msg = document.getElementById("message");
const counter = document.getElementById("wordCounter");
const thankYou = document.getElementById("thankYou");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

msg.addEventListener("input", () => {
    const words = msg.value.trim() ? msg.value.trim().split(/\s+/).length : 0;
    counter.textContent = `${words}/250`;
    if (words > 250) alert("Word limit exceeded.");
});

contactFormEl.addEventListener("submit", e => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const words = msg.value.trim().split(/\s+/).filter(Boolean).length;

    if (!/^[A-Za-z]{2,}( [A-Za-z]{2,})+$/.test(name)) return alert("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return alert("Invalid email.");
    if (words > 250) return alert("Message exceeds the 250-word limit.");

    contactFormEl.classList.add("hidden");
    thankYou.classList.remove("hidden");

    setTimeout(() => {
        thankYou.classList.add("hidden");
        contactFormEl.classList.remove("hidden");
        contactFormEl.reset();
        counter.textContent = "0/250";
    }, 5000);
});

/* ===================== Initial Render ===================== */
renderTasks();
