// Change from an object method to a pure function returning a string
function renderMainContainer() {
  const container = document.getElementById("tasks__container");
  if (!container) return;

  container.innerHTML = `
    <div class="main-task-area">
      ${
        this.isTeachingAssistant
          ? `
          <div class="tasks-view-toggle">
              <div class="toggle-btn-container">
                  <button class="toggle-btn manage-btn" 
                          onclick="tasksManager.showTaskManagementPopup()"
                          style="width: 100%;">
                      ⚙️ Manage Tasks
                  </button>
              </div>
          </div>
          `
          : ""
      }

      <div class="tasks-content">
          ${this.renderUserTasks()}
      </div>
    </div>
    
    ${this.renderHelpChat()} 
    ${this.selectedTask ? this.renderTaskDetail() : ""}
  `;
  if (this.isTeachingAssistant) {
    let popupHost = document.getElementById("task-management-popup-host");
    if (!popupHost) {
      popupHost = document.createElement("div");
      popupHost.id = "task-management-popup-host";
      document.body.appendChild(popupHost);
    }
    popupHost.innerHTML = this.renderManagementPopup();
  }

  if (this.taskInHelpChat) {
    requestAnimationFrame(() => {
      const inputEl = document.querySelector(".help-chat-input");
      if (inputEl) {
        inputEl.onkeypress = (e) =>
          this.handleChatInput(e, this.taskInHelpChat);
      }
    });
  }
  return container;
}

function renderRoomTasksView() {
  const completedCount = this.roomTasks.filter((t) => t.completed).length;

  return `
            <div class="tasks-section active">
                <div class="section-header">
                    <h3>Learning Objectives</h3>
                    <span class="task-count">${completedCount}/${this.roomTasks.length}</span>
                </div>
                <div class="task-list-compact">
                    ${this.roomTasks.map((task) => this.renderCompactTask(task, task.category)).join("")}
                </div>
            </div>
        `;
}

function renderCompactTask(task, category) {
  const color = this.getCategoryColor(category);
  const isSelected = this.selectedTask && this.selectedTask.id === task.id;
  const isChatActive =
    this.taskInHelpChat && this.taskInHelpChat.id === task.id;
  // Determine if this task is from room or user tasks based on category
  const view = ["assigned", "improvement"].includes(category) ? "user" : "room";
  // Escape task.id for safe embedding in HTML attributes
  const safeId = String(task.id).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  return `
            <div class="compact-task ${task.completed ? "completed" : ""} ${isSelected ? "selected" : ""}" 
                 data-task-id="${safeId}"
                 data-category="${category}"
                 data-view="${view}">
                <div class="task-color-bar" style="background: ${color}"></div>
                ${task.completed ? '<div class="task-complete-gradient"></div>' : ""}
                <div class="task-content" onclick="tasksManager.toggleTaskById(this.parentElement)">
                    <span class="task-emoji">${task.emoji}</span>
                    <span class="task-label">${task.title}</span>
                </div>
                <div class="task-help-gradient ${isChatActive ? "chat-active" : ""}" 
                     onclick="tasksManager.requestHelpById(this.parentElement)">
                    <span class="help-icon">${isChatActive ? "💬" : "?"}</span>
                </div>
            </div>
        `;
}

function renderTaskDetail() {
  if (!this.selectedTask) return "";

  const color = this.getCategoryColor(this.selectedTask.category);
  const categoryNames = {
    basics: "Scratch Basics",
    sprites: "Sprites & Movement",
    multimedia: "Sounds & Events",
    assigned: "Assigned Task",
    improvement: "Tomorrow's Task",
  };

  return `
            <div class="task-detail-panel">
                <div class="detail-header">
                    <div class="detail-category" style="color: ${color}">
                        ${categoryNames[this.selectedTask.category] || "Task"}
                    </div>
                    <button class="close-detail" onclick="tasksManager.closeDetail()">×</button>
                </div>
                <h3>${this.selectedTask.title}</h3>
                <div class="detail-content">
                    <p>${this.getTaskDescription(this.selectedTask)}</p>
                    ${this.getTaskResources(this.selectedTask)}
                </div>
                <div class="detail-actions">
                    <button class="help-request-btn" 
                            onclick="tasksManager.requestHelpForTask(${this.selectedTask.id}, '${this.selectedTask.category}', '${this.activeView}')">
                        💬 Start Help Chat
                    </button>
                </div>
            </div>
        `;
}

function renderUserTasks() {
  const currentUserEmail = sessionStorage.getItem("email");
  const userTasks = this.getStudentTasks(currentUserEmail);
  const assignedCount = userTasks.assigned.filter((t) => t.completed).length;
  const improvementCount = userTasks.improvement.filter(
    (t) => t.completed,
  ).length;

  return `
            <div class="tasks-section active">
                <div class="section-header">
                    <h3>Assigned Tasks</h3>
                    <span class="task-count">${assignedCount}/${userTasks.assigned.length}</span>
                </div>
                <div class="task-list-compact">
                    ${userTasks.assigned.map((task) => this.renderCompactTask(task, "assigned")).join("")}
                </div>
                
                <div class="section-header">
                    <h3>Tomorrow's Tasks</h3>
                    <span class="task-count">${improvementCount}/${userTasks.improvement.length}</span>
                </div>
                <div class="task-list-compact">
                    ${userTasks.improvement.map((task) => this.renderCompactTask(task, "improvement")).join("")}
                </div>
            </div>
        `;
}

function renderHelpChat() {
  if (!this.taskInHelpChat) {
    return `
                <div class="help-chat-container closed">
                    <div class="help-chat-header">
                        <span class="header-task-title">Need Help?</span>
                    </div>
                    <div class="help-chat-messages empty-chat">
                        Click the "?" next to any task to open a help chat!
                    </div>
                </div>
            `;
  }

  const task = this.taskInHelpChat;
  const messagesHtml = this.chatMessages
    .map((msg) => this.renderChatMessage(msg))
    .join("");

  return `
            <div class="help-chat-container active">
                <div class="help-chat-header">
                    <span class="header-task-title">Help: ${task.title}</span>
                    <button class="close-chat-btn" onclick="tasksManager.closeHelpChat()">×</button>
                </div>
                <div class="help-chat-messages">
                    ${messagesHtml}
                </div>
                <div class="help-chat-input-area">
                    <input type="text" class="help-chat-input" placeholder="Ask a question..." />
                    <button class="send-btn" onclick="tasksManager.sendChatMessage(document.querySelector('.help-chat-input').value)">
                        <span class="send-icon">➤</span>
                    </button>
                </div>
            </div>
        `;
}

function renderChatMessage(message) {
  return `
    <div class="help-message ${message.sender}">
      ${message.sender === "teacher" ? '<div class="message-avatar">👩\u200d🏫</div>' : ""}
      <div class="message-bubble">
        <div class="message-text">${this.formatMessageText(message.text)}</div>
        <div class="message-time">${message.time}</div>
      </div>
    </div>
  `;
}

function renderManagementPopup() {
  // Get connected users from the room
  const studentsList = Object.values(connectedUsers).map((user) => ({
    email: user.email,
    name: user.name,
  }));
  const selectedStudent =
    this.managementSelectedStudent ||
    (studentsList.length > 0 ? studentsList[0].email : null);

  const studentTasks = this.getStudentTasks(selectedStudent);

  return `
            <div id="task-management-popup" class="task-popup hidden" onclick="if (event.target === this) tasksManager.hideTaskManagementPopup()">
                <div class="management-popup-content" onclick="event.stopPropagation()">
                    <h2>📋 Task Management</h2>
                    
                    <div class="management-main-layout">
                        <div class="room-tasks-pool">
                            <div class="pool-header">
                                <h3>🎓 Room Tasks</h3>
                                <p class="pool-subtitle">Drag tasks to assign to student</p>
                            </div>
                            <div class="pool-tasks-list dropzone" data-category="room"
                                 ondrop="tasksManager.handleDropToRoom(event)" 
                                 ondragover="tasksManager.handleDragOver(event)"
                                 ondragleave="tasksManager.handleDragLeave(event)">
                                ${this.roomTasks.map((task) => this.renderManagementTask(task, task.category, true)).join("")}
                            </div>
                            
                            <div class="add-task-inline">
                                <h4>➕ Add New Room Task</h4>
                                <input type="text" id="new-room-task-title" class="task-input" placeholder="Task title" />
                                
                                <label class="management-label" style="margin-top: 0.5rem; display: block;">Select Emoji</label>
                                <div class="emoji-picker">
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🖱️')">🖱️</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🔗')">🔗</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('▶️')">▶️</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🐱')">🐱</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🏃')">🏃</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('�')">�</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🎵')">🎵</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('⌨️')">⌨️</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('📝')">📝</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🎨')">🎨</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🎮')">🎮</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🚀')">🚀</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('⭐')">⭐</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🔥')">🔥</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('💡')">💡</button>
                                    <button type="button" class="emoji-btn" onclick="tasksManager.selectEmoji('🎯')">🎯</button>
                                </div>
                                <input type="hidden" id="new-room-task-emoji" value="📝" />
                                
                                <select id="new-room-task-category" class="task-input">
                                    <option value="art">Art</option>
                                    <option value="coding">Coding</option>
                                    <option value="music">Music</option>
                                </select>
                                <button class="add-task-submit-btn" onclick="tasksManager.addNewRoomTask()">Add Task</button>
                            </div>
                        </div>

                        <div class="student-tasks-section">
                            <div class="management-section">
                                <label class="management-label">Select Student</label>
                                <select class="student-select" onchange="tasksManager.selectStudent(this.value)">
                                    ${Object.values(connectedUsers)
                                      .map(
                                        (user) => `
                                        <option value="${user.email}" ${user.email === selectedStudent ? "selected" : ""}>
                                            ${user.name} (${user.email})
                                        </option>
                                    `,
                                      )
                                      .join("")}
                                </select>
                            </div>

                            <div class="management-section">
                                <div class="section-title">
                                    <h3>📅 Today's Goals</h3>
                                </div>
                                <div class="task-management-list dropzone" data-category="assigned" 
                                     ondrop="tasksManager.handleDrop(event, 'assigned')" 
                                     ondragover="tasksManager.handleDragOver(event)"
                                     ondragleave="tasksManager.handleDragLeave(event)">
                                    ${studentTasks.assigned.map((task) => this.renderManagementTask(task, "assigned", true)).join("")}
                                    ${studentTasks.assigned.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ""}
                                </div>
                            </div>

                            <div class="management-section">
                                <div class="section-title">
                                    <h3>📌 Tomorrow's Tasks</h3>
                                </div>
                                <div class="task-management-list dropzone" data-category="improvement"
                                     ondrop="tasksManager.handleDrop(event, 'improvement')" 
                                     ondragover="tasksManager.handleDragOver(event)"
                                     ondragleave="tasksManager.handleDragLeave(event)">
                                    ${studentTasks.improvement.map((task) => this.renderManagementTask(task, "improvement", true)).join("")}
                                    ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ""}
                                </div>
                            </div>
                            
                            ${this.renderProgressStats(studentTasks)}
                        </div>
                    </div>

                    <div class="management-actions">
                        <button class="save-btn" onclick="tasksManager.saveTaskChanges()">Save Changes</button>
                        <button class="cancel-btn" onclick="tasksManager.hideTaskManagementPopup()">Close</button>
                    </div>
                </div>
            </div>
        `;
}

function renderManagementTask(task, category, isDraggable) {
  const color = this.getCategoryColor(category);
  const draggableAttr = isDraggable ? 'draggable="true"' : "";
  const safeId = String(task.id).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  // Get list of users assigned to this task
  // Only show for room pool tasks
  let assignedUsers = [];
  const isRoomPoolTask = ["art", "coding", "music", "other"].includes(category);
  if (isRoomPoolTask) {
    assignedUsers = this.getUsersAssignedToTask(task.id);
  }

  return `
            <div class="management-task-item ${isDraggable ? "draggable-task" : "pool-task"} ${task.completed ? "completed" : ""}" 
                 ${draggableAttr}
                 data-task-id="${safeId}"
                 data-task-category="${category}"
                 data-task='${JSON.stringify(task).replace(/'/g, "&apos;")}'
                 ondragstart="tasksManager.handleDragStart(event)"
                 ondragend="tasksManager.handleDragEnd(event)"
                 onclick="tasksManager.toggleTaskInManagement(this.dataset.taskId, '${category}')">
                <div class="task-color-indicator" style="background: ${color}"></div>
                <span class="task-emoji">${task.emoji}</span>
                <span class="task-title ${task.completed ? "completed" : ""}">${task.title}</span>
                ${task.completed ? '<span class="task-complete-check">✓</span>' : ""}
                ${
                  assignedUsers.length > 0
                    ? `
                    <div class="task-assigned-users">
                        ${assignedUsers
                          .slice(0, 3)
                          .map(
                            (user) => `
                            <span class="user-indicator" title="${user.name}">
                                ${user.name.charAt(0).toUpperCase()}
                            </span>
                        `,
                          )
                          .join("")}
                        ${assignedUsers.length > 3 ? `<span class="user-indicator more">+${assignedUsers.length - 3}</span>` : ""}
                    </div>
                `
                    : ""
                }
                <button class="delete-room-task-btn" onclick="event.stopPropagation(); tasksManager.deleteRoomTask(event, this.closest('[data-task-id]').dataset.taskId)" title="Delete task">×</button>
            </div>
        `;
}

function renderProgressStats(studentTasks) {
  const assignedTotal = studentTasks.assigned.length;
  const assignedCompleted = studentTasks.assigned.filter(
    (t) => t.completed,
  ).length;
  const improvementTotal = studentTasks.improvement.length;
  const improvementCompleted = studentTasks.improvement.filter(
    (t) => t.completed,
  ).length;
  // Only count Today's Goals for the progress bar
  const percentage =
    assignedTotal > 0
      ? Math.round((assignedCompleted / assignedTotal) * 100)
      : 0;

  return `
            <div class="management-section progress-stats">
                <div class="section-title">
                    <h3>📊 Progress Overview</h3>
                </div>
                <div class="stats-content">
                    <div class="stat-item">
                        <span class="stat-label">📅 Today's Goals</span>
                        <span class="stat-value">${assignedCompleted}/${assignedTotal}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">📌 Tomorrow's Tasks</span>
                        <span class="stat-value">${improvementCompleted}/${improvementTotal}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <div class="progress-percentage">${percentage}% Complete</div>
                </div>
            </div>
        `;
}
