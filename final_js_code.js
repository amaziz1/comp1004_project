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

    // Group by project
    const projects = [...new Set(tasks.map(t => t.project || "Default Project"))];

    projects.forEach(proj => {
        const projectHeader = document.createElement("h3");
        projectHeader.textContent = proj;
        projectHeader.addEventListener("click", () => {
            const container = document.querySelector(`#proj-${proj.replace(/\s/g,"_")}`);
            container.classList.toggle("hidden");
        });
        taskList.appendChild(projectHeader);

        const container = document.createElement("div");
        container.id = `proj-${proj.replace(/\s/g,"_")}`;
        container.classList.add("project-tasks");
        taskList.appendChild(container);

        const filteredTasks = tasks.filter(t => {
            const matchesFilter =
                currentFilter === "all" ||
                (currentFilter === "active" && !t.completed) ||
                (currentFilter === "completed" && t.completed);
            const matchesCategory = !currentCategory || t.category === currentCategory;
            const matchesProject = t.project === proj || (proj === "Default Project" && !t.project);
            const matchesSearch = !currentSearch || t.text.toLowerCase().includes(currentSearch);

            return matchesFilter && matchesCategory && matchesProject && matchesSearch;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement("li");
            li.classList.add(task.priority);

            const taskDue = new Date(task.date);
            if (!task.completed && taskDue < now) li.classList.add("overdue");
            else if (!task.completed && (taskDue - now) <= 86400000) li.classList.add("reminder");

            const nextRecurrence = task.recurrence && !task.completed
                ? `<span title="Next occurrence: ${nextDateString(task)}">↻</span>` : "";

            li.innerHTML = `
                ${task.text} (${task.category}) [${task.priority}] - Project: ${task.project || 'N/A'} ${nextRecurrence}
                <button class="complete">${task.completed ? "↺" : "✔"}</button>
                <button class="delete">❌</button>
                <button class="timer" title="Click to start/stop timer">${task.timeElapsed || 0}s ⏱</button>
            `;

            // Complete toggle
            li.querySelector(".complete").addEventListener("click", () => {
                if (!task.completed) {
                    task.completed = true;
                    if (["daily","weekly"].includes(task.recurrence)) {
                        const next = new Date(task.date);
                        next.setDate(next.getDate() + (task.recurrence==="daily"?1:7));
                        tasks.push({...task, date: next.toISOString().split("T")[0], completed:false, timeElapsed:0});
                    }
                } else task.completed = false;
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
                if(timerInterval){ clearInterval(timerInterval); timerInterval=null; timerBtn.title="Click to start/stop timer"; }
                else{
                    timerInterval=setInterval(()=>{ task.timeElapsed=(task.timeElapsed||0)+1; timerBtn.textContent=`${task.timeElapsed}s ⏱`; saveTasks(); timerBtn.title="Timer running"; },1000);
                }
            });

            container.appendChild(li);
        });
    });

    // Update progress bar
    const completedCount = tasks.filter(t=>t.completed).length;
    const percent = tasks.length ? Math.round((completedCount/tasks.length)*100) : 0;
    progressBar.style.width = percent+"%";
    progressBar.title = `Completed: ${percent}%`;
}

function nextDateString(task){
    const date = new Date(task.date);
    if(task.recurrence==="daily") date.setDate(date.getDate()+1);
    else if(task.recurrence==="weekly") date.setDate(date.getDate()+7);
    return date.toISOString().split("T")[0];
}

/* ===================== Add Task ===================== */
taskForm.addEventListener("submit", e => {
    e.preventDefault();
    tasks.push({
        text: taskInput.value,
        date: taskDate.value,
        category: taskCategory.value,
        priority: taskPriority.value,
        project: taskProject.value || null,
        recurrence: taskRecurrence.value || null,
        completed: false,
        timeElapsed: 0
    });
    saveTasks();
    renderTasks();
    taskForm.reset();
});

/* ===================== Task Filters ===================== */
document.querySelectorAll("#task-filters button").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("#task-filters button").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");

        currentFilter = btn.dataset.filter || "all";
        currentCategory = btn.dataset.category || null;
        currentProject = btn.dataset.project || null;

        renderTasks();
    });
});

/* ===================== Set Default Active Filter on Page Load ===================== */
document.addEventListener("DOMContentLoaded", () => {
    const defaultFilter = document.querySelector('#task-filters button[data-filter="all"]');
    if (defaultFilter) defaultFilter.classList.add("active");
});

// Update renderTasks() if needed — your current code already toggles `.active`
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
taskSearch.addEventListener("input", e=>{
    currentSearch = e.target.value.toLowerCase();
    renderTasks();
});

/* ===================== Export / Import JSON ===================== */
const exportJSON = document.getElementById("exportJSON");
const importBtn = document.getElementById("importJSONBtn");
const importInput = document.getElementById("importJSON");

exportJSON.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(tasks,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="tasks.json";
    a.click();
});

importBtn.addEventListener("click",()=>importInput.click());
importInput.addEventListener("change",e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try{
            const importedTasks=JSON.parse(event.target.result);
            if(!Array.isArray(importedTasks)) throw new Error("Invalid JSON");
            tasks=importedTasks;
            saveTasks();
            renderTasks();
            alert("Tasks imported successfully!");
        }catch(err){ alert("Error importing tasks: "+err.message);}
    };
    reader.readAsText(file);
});

/* ===================== Export CSV ===================== */
const exportCSVBtn = document.getElementById("exportCSV");
exportCSVBtn.addEventListener("click",()=>{
    if(!tasks.length) return alert("No tasks to export.");
    const csvRows=[["Text","Date","Category","Priority","Project","Completed","TimeElapsed"]];
    tasks.forEach(t=>csvRows.push([`"${t.text}"`,t.date,t.category,t.priority,`"${t.project||""}"`,t.completed,t.timeElapsed||0]));
    const csvContent="data:text/csv;charset=utf-8,"+csvRows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a");
    a.href=encodeURI(csvContent);
    a.download="tasks.csv";
    a.click();
});

/* ===================== Contact Form ===================== */
const contactFormEl=document.getElementById('contactForm');
const msg=document.getElementById("message");
const counter=document.getElementById("wordCounter");
const thankYou=document.getElementById("thankYou");
const nameInput=document.getElementById("name");
const emailInput=document.getElementById("email");

msg.addEventListener("input",()=>{
    const words=msg.value.trim()?msg.value.trim().split(/\s+/).length:0;
    counter.textContent=`${words}/250`;
    if(words>250) msg.value=msg.value.split(/\s+/).slice(0,250).join(" ");
});

contactFormEl.addEventListener("submit",e=>{
    e.preventDefault();
    const name=nameInput.value.trim();
    const email=emailInput.value.trim();
    const words=msg.value.trim().split(/\s+/).filter(Boolean).length;
    if(!/^[A-Za-z]{2,}( [A-Za-z]{2,})+$/.test(name)) return alert("Please enter your full name.");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return alert("Invalid email.");
    if(words>250) return alert("Message exceeds 250 words.");
    contactFormEl.classList.add("hidden");
    thankYou.classList.remove("hidden");
    setTimeout(()=>{
        thankYou.classList.add("hidden");
        contactFormEl.classList.remove("hidden");
        contactFormEl.reset();
        counter.textContent="0/250";
    },5000);
});

/* ===================== Initial Render ===================== */
renderTasks();
