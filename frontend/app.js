const state = {
  token: localStorage.getItem("taskManagerToken") || "",
  user: JSON.parse(localStorage.getItem("taskManagerUser") || "null"),
  page: 1,
  pageSize: 10,
  filter: "all",
  lastPage: 0,
};

const healthStatus = document.getElementById("health-status");
const messageBox = document.getElementById("message-box");
const userSummary = document.getElementById("user-summary");
const logoutButton = document.getElementById("logout-btn");
const tasksContainer = document.getElementById("tasks-container");
const pageIndicator = document.getElementById("page-indicator");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");
const filterSelect = document.getElementById("filter-status");
const pageSizeSelect = document.getElementById("page-size");

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const detail = payload?.detail || "Something went wrong";
    throw new Error(detail);
  }

  return payload;
}

function showMessage(message, type = "success") {
  messageBox.hidden = false;
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
  messageBox.className = "message-box";
}

function persistSession() {
  if (state.token) {
    localStorage.setItem("taskManagerToken", state.token);
  } else {
    localStorage.removeItem("taskManagerToken");
  }

  if (state.user) {
    localStorage.setItem("taskManagerUser", JSON.stringify(state.user));
  } else {
    localStorage.removeItem("taskManagerUser");
  }
}

function renderUserSummary() {
  logoutButton.hidden = !state.token;
  if (!state.user) {
    userSummary.innerHTML = "<p>Not logged in.</p>";
    return;
  }

  userSummary.innerHTML = `
    <p><strong>${state.user.name}</strong></p>
    <p>${state.user.email}</p>
  `;
}

function renderTasks(items = []) {
  if (!items.length) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <p>No tasks found for the selected filter.</p>
      </div>
    `;
    return;
  }

  tasksContainer.innerHTML = items
    .map(
      (task) => `
        <article class="task-card ${task.completed ? "completed" : ""}">
          <div class="task-title-row">
            <div>
              <h3>${escapeHtml(task.title)}</h3>
              <div class="pill ${task.completed ? "completed" : "pending"}">
                ${task.completed ? "Completed" : "Pending"}
              </div>
            </div>
            <div class="task-actions">
              <button class="ghost-button" data-action="toggle" data-id="${task.id}">
                ${task.completed ? "Mark Pending" : "Mark Complete"}
              </button>
              <button class="danger-button" data-action="delete" data-id="${task.id}">
                Delete
              </button>
            </div>
          </div>
          <p class="task-description">${escapeHtml(task.description || "No description provided.")}</p>
          <div class="task-meta">
            <span>Task #${task.id}</span>
            <span>Updated: ${new Date(task.updated_at).toLocaleString()}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadHealth() {
  try {
    const payload = await apiFetch("/health", { method: "GET", headers: {} });
    healthStatus.textContent = payload.status === "ok" ? "Healthy" : "Unavailable";
  } catch (error) {
    healthStatus.textContent = "Unavailable";
  }
}

async function loadTasks() {
  if (!state.token) {
    renderTasks([]);
    pageIndicator.textContent = "Login to view tasks";
    prevPageButton.disabled = true;
    nextPageButton.disabled = true;
    return;
  }

  clearMessage();

  const query = new URLSearchParams({
    page: String(state.page),
    page_size: String(state.pageSize),
  });

  if (state.filter === "completed") {
    query.set("completed", "true");
  } else if (state.filter === "pending") {
    query.set("completed", "false");
  }

  try {
    const payload = await apiFetch(`/tasks?${query.toString()}`);
    state.lastPage = payload.total_pages;
    renderTasks(payload.items);
    pageIndicator.textContent = `Page ${payload.page} of ${payload.total_pages || 1} • ${payload.total} task(s)`;
    prevPageButton.disabled = state.page <= 1;
    nextPageButton.disabled = payload.total_pages === 0 || state.page >= payload.total_pages;
  } catch (error) {
    showMessage(error.message, "error");
  }
}

document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById("register-name").value.trim(),
    email: document.getElementById("register-email").value.trim(),
    password: document.getElementById("register-password").value,
  };

  try {
    const response = await apiFetch("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage(`${response.message}. You can log in now.`);
    event.target.reset();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  };

  try {
    const response = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.token = response.access_token;
    state.user = response.user;
    state.page = 1;
    persistSession();
    renderUserSummary();
    await loadTasks();
    showMessage(response.message);
    event.target.reset();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

document.getElementById("task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.token) {
    showMessage("Please log in before creating tasks.", "error");
    return;
  }

  const payload = {
    title: document.getElementById("task-title").value.trim(),
    description: document.getElementById("task-description").value.trim(),
  };

  try {
    await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage("Task created successfully.");
    event.target.reset();
    state.page = 1;
    await loadTasks();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

tasksContainer.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const taskId = button.dataset.id;
  const action = button.dataset.action;

  try {
    if (action === "toggle") {
      const task = await apiFetch(`/tasks/${taskId}`);
      await apiFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ completed: !task.completed }),
      });
      showMessage("Task updated successfully.");
    }

    if (action === "delete") {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      showMessage("Task deleted successfully.");
    }

    await loadTasks();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

filterSelect.addEventListener("change", async (event) => {
  state.filter = event.target.value;
  state.page = 1;
  await loadTasks();
});

pageSizeSelect.addEventListener("change", async (event) => {
  state.pageSize = Number(event.target.value);
  state.page = 1;
  await loadTasks();
});

prevPageButton.addEventListener("click", async () => {
  if (state.page > 1) {
    state.page -= 1;
    await loadTasks();
  }
});

nextPageButton.addEventListener("click", async () => {
  if (state.lastPage && state.page < state.lastPage) {
    state.page += 1;
    await loadTasks();
  }
});

document.getElementById("refresh-btn").addEventListener("click", loadTasks);

logoutButton.addEventListener("click", async () => {
  state.token = "";
  state.user = null;
  state.page = 1;
  state.lastPage = 0;
  persistSession();
  renderUserSummary();
  clearMessage();
  await loadTasks();
});

filterSelect.value = state.filter;
pageSizeSelect.value = String(state.pageSize);
renderUserSummary();
loadHealth();
loadTasks();

