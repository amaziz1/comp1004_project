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

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

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
            li.innerHTML = `
                ${task.text} (${task.category})
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

document.getElementById("taskForm").onsubmit = e => {
    e.preventDefault();
    tasks.push({
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        completed: false
    });
    saveTasks();
    renderTasks();
    e.target.reset();
};

document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll("#task-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        renderTasks();
    };
});

renderTasks();

/* Export JSON */
document.getElementById("exportJSON").onclick = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tasks.json";
    a.click();
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