const getMainContainerTemplate = {
    render() {
    const container = document.getElementById("tasks__container");
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
    }
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


function renderUserTasksView() {
  const userTasks = this.getStudentTasks(sessionStorage.getItem("email"));
  return `
    <div class="tasks-section active">
      <div class="section-header">
        <h3>Today's Goals</h3>
        <span class="task-count">${assignedCount}/${userTasks.assigned.length}</span>
      </div>
      [task maps for assigned and improvement]
    </div>
  `;
}


function renderCompactTask(task, category) {
  const color = this.getCategoryColor(category);
    const isSelected = this.selectedTask && this.selectedTask.id === task.id;
    const isChatActive =
      this.taskInHelpChat && this.taskInHelpChat.id === task.id;
    // Determine if this task is from room or user tasks based on category
    const view = ["assigned", "improvement"].includes(category)
      ? "user"
      : "room";
    // Escape task.id for safe embedding in HTML attributes
    const safeId = String(task.id)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");

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



 renderTaskDetail() {
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
        <div class="message-time">${time}</div>
      </div>
    </div>
  `;
}



function renderManagementPopup() {
  return `
    <div id="task-management-popup" class="task-popup hidden" onclick="...">
      <div class="management-popup-content" onclick="event.stopPropagation()">
        <h2>📋 Task Management</h2>
        
        <div class="management-main-layout">
          <div class="room-tasks-pool">
            [POOL HEADER]
            [ROOM TASKS LIST]
            [ADD TASK SECTION with emoji picker]
              - Task title input
              - Emoji picker buttons (13 emojis)
              - Category dropdown
              - Add button
          </div>

          <div class="student-tasks-section">
            [STUDENT SELECTOR]
            [TODAY'S GOALS section with drag-drop]
            [TOMORROW'S TASKS section with drag-drop]
            [PROGRESS STATS]
          </div>
        </div>

        <div class="management-actions">
          [SAVE & CANCEL BUTTONS]
        </div>
      </div>
    </div>
  `;
}



function renderManagementTask(task, category, isDraggable) {
  return `
    <div class="management-task-item ${isDraggable ? "draggable-task" : "pool-task"} ${task.completed ? "completed" : ""}"...>
      <div class="task-color-indicator" style="background: ${color}"></div>
      <span class="task-emoji">${task.emoji}</span>
      <span class="task-title ${task.completed ? "completed" : ""}">${task.title}</span>
      ${task.completed ? '<span class="task-complete-check">✓</span>' : ""}
      ${assignedUsers.length > 0 ? `
        <div class="task-assigned-users">
          ${assignedUsers.slice(0, 3).map(user => `<span class="user-indicator">...</span>`).join("")}
          ${assignedUsers.length > 3 ? `<span class="user-indicator more">+${...}</span>` : ""}
        </div>
        ` : ""}
      <button class="delete-room-task-btn" onclick="event.stopPropagation(); ...">×</button>
    </div>
  `;
}



function renderProgressStats(studentTasks) {
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



studentSection.innerHTML = `
  <div class="management-section">
    <label class="management-label">Select Student</label>
    <select class="student-select" onchange="...">
      ${Object.values(connectedUsers).map(...).join("")}
    </select>
  </div>
  [TODAY'S GOALS]
  [TOMORROW'S TASKS]
  ${this.renderProgressStats(...)}
`;