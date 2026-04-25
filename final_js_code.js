/* ===================== SPA Navigation ===================== */
const sections = document.querySelectorAll(".spa-section");
document.querySelectorAll("nav button.nav-button").forEach(button => {
    button.onclick = e => {
        e.preventDefault();
        sections.forEach(s => s.classList.add("hidden"));
        const targetSectionId = button.dataset.target.substring(1);
        document.getElementById(targetSectionId).classList.remove("hidden");
        window.scrollTo(0,0);
    };
});

/* ===================== Persistent Dark Mode ===================== */
const toggle = document.getElementById("themeToggle");
if(localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    toggle.textContent = "☀️ Light Mode";
}
toggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode")
    toggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("darkMode", isDark);
};

/* ===================== Facts ===================== */
const facts = [
    "SPAs load content dynamically.",
    "Dark mode reduces eye strain.",
    "Task managers boost productivity."
];
let factIndex = 0;
const factText = document.getElementById("fact-text");
const factCounter = document.getElementById("fact-counter");
document.querySelector(".next-fact").onclick = () => {
    factIndex = (factIndex + 1) % facts.length;
    updateFact();
};
function updateFact() {
    factText.textContent = facts[factIndex];
    factCounter.textContent = `${factIndex + 1}/${facts.length}`;
}
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

/* ===================== Save Tasks ===================== */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ===================== Render Tasks ===================== */
function renderTasks() {
    taskList.innerHTML = "";

    const filteredTasks = tasks
        .filter(t =>
            (currentFilter === "all" ||
            (currentFilter === "active" && !t.completed) ||
            (currentFilter === "completed" && t.completed)) &&
            (!currentCategory || t.category === currentCategory) &&
            (!currentProject || t.project === currentProject) &&
            (!currentSearch || t.text.toLowerCase().includes(currentSearch))
        );

    const now = new Date();

    filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        li.classList.add(task.priority);

        // Reminder Highlight if due within 1 day
        const taskDue = new Date(task.date);
        if(!task.completed && taskDue > now && (taskDue - now) <= 86400000 ) {
            li.classList.add("reminder");
        }

        li.innerHTML = `
            ${task.text} (${task.category}) [${task.priority}] - Project: ${task.project || 'N/A'}
            <button class="complete">✔</button>
            <button class="delete">❌</button>
            <button class="timer">${task.timeElapsed || 0}s ⏱</button>
        `;

        // Complete Toggle
        li.querySelector(".complete").onclick = () => {
            
            if (!task.completed) {
                task.completed = true;

                if (task.recurrence === "daily" || task.recurrence === "weekly") {
                    const nextDate = new Date(task.date);

                    if (task.recurrence === "daily") {
                        nextDate.setDate(nextDate.getDate() + 1);
                    } else if (task.recurrence === "weekly") {
                        nextDate.setDate(nextDate.getDate() + 7);
                    }

                    const newTask = {
                        ...task,
                        date: nextDate.toISOString().split("T")[0],
                        completed:false,
                        timeElapsed: 0
                    };

                    tasks.push(newTask);
                }
            } else {
                task.completed = false;
            }

            saveTasks();
            renderTasks();
        };

        // Delete Task
        li.querySelector(".delete").onclick = () => {
            const originalIndex = tasks.indexOf(task);
            tasks.splice(originalIndex, 1);
            saveTasks();
            renderTasks();
        };

        // Timer Start/Stop
        const timerBtn = li.querySelector(".timer");
        let timerInterval;
        timerBtn.onclick = () => {
            if(timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            } else {
                timerInterval = setInterval(() => {
                    task.timeElapsed = (task.timeElapsed || 0) + 1;
                    timerBtn.textContent = `${task.timeElapsed}s ⏱`;
                    saveTasks();
                }, 1000);
            }
        };

        taskList.appendChild(li);
    });

    // Update Progress Bar
    const completed = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
    progressBar.style.width = percent + "%";
}

/* ===================== Add New Task ===================== */
taskForm.onsubmit = e => {
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
    e.target.reset();
};

/* ===================== Task Filters ===================== */
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#task-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        currentProject = btn.dataset.project || null;
        renderTasks();
    };
});

/* ===================== Task Search ===================== */
taskSearch.oninput = e => {
    currentSearch = e.target.value.toLowerCase();
    renderTasks();
};

/* ===================== Export JSON ===================== */
document.getElementById("exportJSON").onclick = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
};

/* ===================== Import JSON ===================== */
const importBtn = document.getElementById("importJSONBtn");
const importInput = document.getElementById("importJSON");

importBtn.onclick = () => importInput.click();

importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importTasks = JSON.parse(event.target.result);
            if (!Array.isArray(importTasks)) throw new Error("Invalid JSON");
            tasks = importTasks;
            saveTasks();
            renderTasks();
            alert("Tasks imported successfully!");
        } catch (err) {
            alert("Error importing tasks: " + err.message);
        }
    };
    reader.readAsText(file);
};

/* ===================== Export CSV ===================== */
const exportCSVBtn = document.getElementById("exportCSV");
exportCSVBtn.onclick = () => {
    if(tasks.length === 0) return alert("No tasks to export.");
    const csvRows = [["Text","Date","Category","Priority","Project","Completed","TimeElapsed"]];
    tasks.forEach(t => {
        csvRows.push([
            `"${t.text}"`,
            t.date,
            t.category,
            t.priority,
            `"${t.project || ""}"`,
            t.completed,
            t.timeElapsed || 0
        ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = "tasks.csv";
    a.click();
};

/* ===================== Contact Form ===================== */
const msg = document.getElementById("message");
const counter = document.getElementById("wordCounter");
const contactForm = document.getElementById('contactForm');
const thankYou = document.getElementById('thankYou');
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

msg.oninput = () => {
    const words = msg.value.trim() ? msg.value.trim().split(/\s+/).length : 0;
    counter.textContent = `${words}/250`;
    if (words > 250) alert("Word limit exceeded.");  
};

contactForm.onsubmit = e => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const words = msg.value.trim().split(/\s+/).filter(Boolean).length;

    if (!/^[A-Za-z]{2,}( [A-Za-z]{2,})+$/.test(name)) return alert("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return alert("Invalid email.");
    if (words > 250) return alert("Message exceeds the 250-word limit.");

    contactForm.classList.add("hidden");
    thankYou.classList.remove("hidden");

    setTimeout(() => {
        thankYou.classList.add("hidden");
        contactForm.classList.remove("hidden");
        contactForm.reset();
        counter.textContent = "0/250";
    }, 5000);
};

/* ===================== Initial Render ===================== */
renderTasks();
