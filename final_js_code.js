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

/* Dark Mode */
const toggle = document.getElementById("themeToggle");
toggle.onclick = () => {
    document.body.classList.toggle("dark-mode");
    toggle.textContent = document.body.classList.contains("dark-mode")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
};

/* Inverted Colour Mode */
const invertedToggle = document.getElementById("invertedToggle");
invertedToggle.onclick = () => {
    document.body.classList.toggle("inverted-colour");
    invertedToggle.textContent = document.body.classList.contains("inverted-colour")
        ? "🌙 Normal Mode"
        : "🔲 Inverted Mode";
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

/* Task Manager */
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let currentCategory = null;
let taskPriority = 'low'; // Default priority

// Saving tasks to Local Storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Rendering Tasks
function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks
        .filter(t =>
            (currentFilter === "all" ||
            (currentFilter === "active" && !t.completed) ||
            (currentFilter === "completed" && t.completed)) &&
            (!currentCategory || t.category === currentCategory)
        )
        .forEach((task, idx) => {
            const li = document.createElement("li");
            li.classList.add(task.priority);
            li.innerHTML = `
                ${task.text} (${task.category}) - <b>Priority: ${task.priority}</b>
                <button class="complete">✔</button>
                <button class="delete">❌</button>
            `;
            li.querySelector(".complete").onclick = () => {
                task.completed = true;
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
}

// Add a new task with priority and deadline
document.getElementById("taskForm").onsubmit = e => {
    e.preventDefault();
    tasks.push({
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        completed: false,
        priority: taskPriority,  // Set the task's priority
        deadline: taskDeadline.value, // New deadline feature
    });
    saveTasks();
    renderTasks();
    e.target.reset();
};

// Filtering tasks based on filter or category
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#task-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        renderTasks();
    };
});

// Export tasks to JSON file
document.getElementById("exportJSON").onclick = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
};

/* Task Prioritization - Adding priority buttons */
document.querySelectorAll("#task-filters button.priority").forEach(btn => {
    btn.onclick = () => {
        taskPriority = btn.dataset.priority;
        renderTasks();
    };
});

// Show notifications for task updates
function showNotification(message) {
    const notification = document.querySelector(".notification");
    notification.textContent = message;
    notification.classList.add("active");
    setTimeout(() => {
        notification.classList.remove("active");
    }, 3000);  // Show for 3 seconds
}

/* Notifications and Reminders for Tasks */
document.querySelector("#task-manager .add-reminder").onclick = () => {
    const reminderTime = prompt("Set reminder time (in minutes): ");
    if (reminderTime && !isNaN(reminderTime)) {
        setTimeout(() => {
            showNotification("Reminder: You have a task due soon!");
        }, reminderTime * 60000); // Convert minutes to milliseconds
    }
};

/* Gamification: Progress bar for task completion */
function updateTaskProgress() {
    const progressBars = document.querySelectorAll(".task-completion .progress");
    progressBars.forEach(bar => {
        let taskCompletion = bar.parentNode.getAttribute("data-completed"); // get task completion
        bar.style.width = `${taskCompletion}%`;
    });
}

/* Collaborative Features (Extended for scalability) */
document.querySelector("#task-manager .add-collaborator").onclick = () => {
    const email = prompt("Enter collaborator's email:");
    if (email) {
        // For now, just mock a collaborator
        showNotification(`Collaborator (${email}) added!`);
    }
};

// Reset tasks
document.getElementById("resetTasks").onclick = () => {
    if (confirm("Are you sure you want to reset all tasks?")) {
        tasks = [];
        saveTasks();
        renderTasks();
        showNotification("All tasks have been reset.");
    }
};

// Call this function to start rendering tasks
renderTasks();
