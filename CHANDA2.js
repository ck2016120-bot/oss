// Select elements
const form = document.getElementById("taskForm");
const input = document.getElementById("taskInput");
const dateInput = document.getElementById("taskDate");
const timeInput = document.getElementById("taskTime");
const list = document.getElementById("taskList");
const clearAllBtn = document.getElementById("clearAll");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Render tasks
function renderTasks() {
  list.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";

    li.innerHTML = `
      <div>
        <strong>${task.text}</strong><br>
        <small>${task.date ? task.date : ""} ${task.time ? task.time : ""}</small>
      </div>
      <div>
        <button class="completeBtn">✔</button>
        <button class="deleteBtn">🗑</button>
      </div>
    `;

    li.querySelector(".completeBtn").addEventListener("click", () => toggleComplete(index));
    li.querySelector(".deleteBtn").addEventListener("click", () => deleteTask(index));

    list.appendChild(li);
  });
}

// Add task
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  if (text === "") return;

  const newTask = { text, date, time, completed: false };
  tasks.push(newTask);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
  form.reset();
});

// Toggle complete
function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// Delete task
function deleteTask(index) {
  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// Clear all
clearAllBtn.addEventListener("click", () => {
  if (confirm("Clear all tasks?")) {
    tasks = [];
    localStorage.removeItem("tasks");
    renderTasks();
  }
});

// Initial render
renderTasks();
