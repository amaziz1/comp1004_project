/* SPA Navigation */
const sections = document.querySelectorAll(".spa-section");
document.querySelectorAll("nav a").forEach(link => {
    link.onclick = e => {
        e.preventDefault();
        sections.forEach(s => s.classList.add("hidden"));
        document.getElementById(link.getAttribute("href").substring(1)).classList.remove("hidden");
        window.scrollTo(0,0);
    };
});

/* Persistent Dark Mode */
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

/* Facts */
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

/* Task Manager Updates for MVP */
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskCategory = document.getElementById("taskCategory");
const taskPriority = document.getElementById("taskPriority"); // NEW
const taskList = document.getElementById("taskList");
const progressBar = document.getElementById("progressBar"); // NEW
const taskSearch = document.getElementById("taskSearch"); // NEW

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let currentCategory = null;
let currentSearch = "";

/* Save Tasks */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* Render Tasks (with search and priority) */
function renderTasks() {
    const list = taskList;
    list.innerHTML = "";

    const filteredTasks = tasks
        .filter(t =>
            (currentFilter === "all" ||
            (currentFilter === "active" && !t.completed) ||
            (currentFilter === "completed" && t.completed)) &&
            (!currentCategory || t.category === currentCategory) &&
            (!currentSearch || t.text.toLowerCase().includes(currentSearch))
        );

    filteredTasks.forEach((task, idx) => {
        const li = document.createElement("li");
        li.classList.add(task.priority); // add priority class for color
        li.innerHTML = `
            ${task.text} (${task.category}) [${task.priority}]
            <button class="complete">✔</button>
            <button class="delete">❌</button>
        `;
        li.querySelector(".complete").onclick = () => {
            task.completed = !task.completed; // toggle
            saveTasks();
            renderTasks();
        };
        li.querySelector(".delete").onclick = () => {
            tasks.splice(idx, 1);
            saveTasks();
            renderTasks();
        };
        list.appendChild(li);
    });

    // Update Progress Bar
    const completed = tasks.filter(t => t.completed).length;
    const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
    progressBar.style.width = percent + "%";
}

taskForm.onsubmit = e => {
    e.preventDefault();
    tasks.push({
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        priority: taskPriority.value, // NEW
        completed: false
    });
    saveTasks();
    renderTasks();
    e.target.reset();
};

/* Task Filters */
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#task-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        renderTasks();
    };
});

/* Task Search */
taskSearch.oninput = e => {
    currentSearch = e.target.value.toLowerCase();
    renderTasks();
};

renderTasks();

/* Export JSON */
document.getElementById("exportJSON").onclick = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
};

/* Import JSON */
const importBtn = document.getElementById("importJSONBtn");
const importInput = document.getElementById("importJSON");

importBtn.onclick = () => {
    importInput.click();  // Open file picker
};

importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importTasks = JSON.parse(event.target.result);

            // Validate imported tasks
            if (!Array.isArray(importTasks)) throw new Error("Invalid JSON format");

            importTasks.forEach(task => {
                if (!task.text || !task.date || !task.category) {
                    throw new Error("Invalid task format");
                }
            });

            // Merge or replace tasks
            tasks = importTasks;  // Replace exisiting tasks
            saveTasks();
            renderTasks();
            alert("Tasks imported successfully!");
        } catch (err) {
            alert("Error importing tasks: " + err.message);
        }
    };
    reader.readAsText(file);
};

/* Contact Form */
const msg = document.getElementById("message");
const counter = document.getElementById("wordCounter");
const contactForm = document.getElementById('contactForm');
const thankYou = document.getElementById('thankYou');
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");

// Track the word count for the message
msg.oninput = () => {
    const words = msg.value.trim() ? msg.value.trim().split(/\s+/).length : 0;
    counter.textContent = `${words}/250`;
    if (words > 250) {
      alert("Word limit exceeded.");  
    }
};

contactForm.onsubmit = e => {
    e.preventDefault();  // Prevent default form submission

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const words = msg.value.trim().split(/\s+/).filter(Boolean).length;

    // Validate form data
    if (!/^[A-Za-z]+ [A-Za-z]+$/.test(name)) {
        return alert("Please enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return alert("Invalid email.");
    }
    if (words > 250) {
        return alert("Message exceeds the 250-word limit.");
    }

    // Hide the contact form and show the thank you message
    contactForm.classList.add("hidden");
    thankYou.classList.remove("hidden");

    // Reset the word counter and form after 5 seconds
    setTimeout(() => {
        thankYou.classList.add("hidden");  // Hide the thank you message
        contactForm.classList.remove("hidden");  // Show the contact form again
        contactForm.reset();
        counter.textContent = "0/250"; // Reset the word counter
    }, 5000);  // Wait for 5 seconds before resetting
};
