/* ===================== SPA Navigation ===================== */
const sections = document.querySelectorAll(".spa-section");
const navButtons = document.querySelectorAll("nav button.nav-button");

navButtons.forEach(button => {
    button.addEventListener("click", e => {
        e.preventDefault();

        sections.forEach(s => s.classList.add("hidden"));

        const targetId = button.dataset.target.replace("#", "");
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
            targetSection.classList.remove("hidden");
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
});

/* ===================== Dark Mode ===================== */
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

/* ===================== Facts ===================== */
const facts = [
    "SPAs load content dynamically without refreshing the page.",
    "Dark mode can help reduce eye strain in low-light environments.",
    "Task managers improve productivity and reduce stress.",
    "Breaking tasks into smaller steps increases completion rates.",
    "Setting deadlines helps improve focus and accountability.",
    "Visual progress tracking boosts motivation.",
    "Recurring tasks help build consistent habits.",
    "Organising tasks by category improves efficiency."
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
const progressLabel = document.getElementById("progressLabel");
const taskSearch = document.getElementById("taskSearch");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let currentCategory = null;
let currentSearch = "";

/* ===================== Save ===================== */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ===================== Recurrence ===================== */
function nextDate(task) {
    const d = new Date(task.date);
    if (task.recurrence === "daily") d.setDate(d.getDate() + 1);
    if (task.recurrence === "weekly") d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
}

/* ===================== Render ===================== */
function renderTasks() {
    taskList.innerHTML = "";
    const now = new Date();

    const projects = [...new Set(tasks.map(t => t.project || "Default Project"))];

    projects.forEach(proj => {
        const header = document.createElement("h3");
        header.textContent = proj;

        const container = document.createElement("div");
        container.classList.add("project-tasks");

        header.addEventListener("click", () => {
            container.classList.toggle("hidden");
        });

        taskList.appendChild(header);
        taskList.appendChild(container);

        const filtered = tasks.filter(t => {
            const matchesFilter =
                currentFilter === "all" ||
                (currentFilter === "active" && !t.completed) ||
                (currentFilter === "completed" && t.completed);

            const matchesCategory = !currentCategory || t.category === currentCategory;
            const matchesProject = (t.project || "Default Project") === proj;
            const matchesSearch = !currentSearch || t.text.toLowerCase().includes(currentSearch);

            return matchesFilter && matchesCategory && matchesProject && matchesSearch;
        });

        filtered.forEach(task => {
            const li = document.createElement("li");
            li.classList.add(task.priority);

            const due = new Date(task.date);

            if (!task.completed && due < now) li.classList.add("overdue");
            else if (!task.completed && (due - now) <= 86400000) li.classList.add("reminder");

            li.innerHTML = `
                ${task.text}
                ${task.recurrence ? "🔁" : ""}
                (${task.category}) [${task.priority}]
                <button class="complete">${task.completed ? "↺" : "✔"}</button>
                <button class="delete">❌</button>
                <button class="timer">${task.timeElapsed || 0}s ⏱</button>
            `;

            /* COMPLETE */
            li.querySelector(".complete").addEventListener("click", () => {
                task.completed = !task.completed;

                if (task.completed && task.recurrence && !task._generatedNext) {
                    task._generatedNext = true;
                    tasks.push({
                        ...task,
                        date: nextDate(task),
                        completed: false,
                        timeElapsed: 0
                    });
                }

                saveTasks();
                renderTasks();
            });

            /* DELETE */
            li.querySelector(".delete").addEventListener("click", () => {
                tasks = tasks.filter(t => t !== task);
                saveTasks();
                renderTasks();
            });

            /* TIMER (fixed but simple) */
            const timerBtn = li.querySelector(".timer");
            task._timer = task._timer || null;

            timerBtn.addEventListener("click", () => {
                if (task._timer) {
                    clearInterval(task._timer);
                    task._timer = null;
                } else {
                    task._timer = setInterval(() => {
                        task.timeElapsed = (task.timeElapsed || 0) + 1;
                        timerBtn.textContent = `${task.timeElapsed}s ⏱`;
                        saveTasks();
                    }, 1000);
                }
            });

            container.appendChild(li);
        });
    });

    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    progressBar.style.width = `${percent}%`;
    progressLabel.textContent = `Tasks Completed: ${completed}/${total} (${percent}%)`;
}

/* ===================== Add Task ===================== */
taskForm.addEventListener("submit", e => {
    e.preventDefault();

    tasks.push({
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        project: taskProject.value.trim() || "Default Project",
        recurrence: taskRecurrence.value !== "none" ? taskRecurrence.value : null,
        completed: false,
        timeElapsed: 0
    });

    saveTasks();
    renderTasks();
    taskForm.reset();
});

/* ===================== Filters ===================== */
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#task-filters button")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;

        renderTasks();
    });
});

/* ===================== Search ===================== */
taskSearch.addEventListener("input", e => {
    currentSearch = e.target.value.toLowerCase();
    renderTasks();
});

/* ===================== JSON EXPORT ===================== */
document.getElementById("exportJSON").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
});

/* ===================== JSON IMPORT ===================== */
document.getElementById("importJSONBtn").addEventListener("click", () => {
    document.getElementById("importJSON").click();
});

document.getElementById("importJSON").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
        try {
            const imported = JSON.parse(event.target.result);

            if (!Array.isArray(imported)) throw new Error("Invalid JSON format");

            tasks = imported.map(t => ({
                ...t,
                project: (t.project || "").trim() || "Default Project"
            }));
            saveTasks();
            renderTasks();
            alert("Tasks imported successfully!");
        } catch (err) {
            alert("Import error: " + err.message);
        }
    };

    reader.readAsText(file);
});

/* ===================== CSV EXPORT ===================== */
document.getElementById("exportCSV").addEventListener("click", () => {
    if (!tasks.length) return alert("No tasks to export.");

    const rows = [
        ["Text", "Date", "Category", "Priority", "Project", "Completed", "Time"]
    ];

    tasks.forEach(t => {
        rows.push([
            t.text,
            t.date,
            t.category,
            t.priority,
            t.project,
            t.completed,
            t.timeElapsed || 0
        ]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.csv";
    a.click();
});

/* ===================== CONTACT FORM (RESTORED ORIGINAL LOGIC) ===================== */
const contactForm = document.getElementById("contactForm");
const msg = document.getElementById("message");
const counter = document.getElementById("wordCounter");
const thankYou = document.getElementById("thankYou");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

msg.addEventListener("input", () => {
    const words = msg.value.trim()
        ? msg.value.trim().split(/\s+/).length
        : 0;

    counter.textContent = `${words}/250`;

    if (words > 250) {
        msg.value = msg.value.split(/\s+/).slice(0, 250).join(" ");
    }
});

contactForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const words = msg.value.trim().split(/\s+/).filter(Boolean).length;

    if (!/^[A-Za-z]{2,}( [A-Za-z]{2,})+$/.test(name))
        return alert("Please enter your full name.");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        return alert("Invalid email.");

    if (words === 0) {
        return alert("Message cannot be empty.");
    }
    if (words > 250) {
        return alert("Message exceeds the 250-word limit.");
    }

    contactForm.classList.add("hidden");
    thankYou.classList.remove("hidden");

    setTimeout(() => {
        thankYou.classList.add("hidden");
        contactForm.classList.remove("hidden");
        contactForm.reset();
        counter.textContent = "0/250";
    }, 5000);
});

/* ===================== INIT ===================== */
renderTasks();
