window.tasksManager;

class TasksManager {
  constructor() {
    this.roomTasks = [];

    // Store tasks per student using their email as the key
    this.studentTasks = {};

    // Template for new student tasks (empty by default)
    this.defaultTasks = {
      assigned: [],
      improvement: [],
    };

    this.activeView = "user";
    this.selectedTask = null;
    this.taskInHelpChat = null;
    this.chatMessages = [];
    this.isTeachingAssistant = sessionStorage.role;
    this.managementSelectedStudent = null;
    this.init();
  }

  logTaskEvent(type, data = {}) {
    if (typeof window.logWorkspaceEvent !== "function") return;
    window.logWorkspaceEvent(type, {
      source: "tasksManager",
      ...data,
    });
  }

  async init() {
    await window.messagingReady;
    await window.tasksLoaded;

    await this.loadInitialRoomTasks();
    //Changes to connected users has broken this section
    //
    //console.log("Connected Users :: " + connectedUsers);
    //console.log(this.managementSelectedStudent);
    //These if statements are not occuring.
    console.log(connectedUsers);
    if (
      !this.managementSelectedStudent &&
      Object.keys(connectedUsers).length == 1
    ) {
      this.managementSelectedStudent = Object.keys(connectedUsers)[0];
      console.log(this.managementSelectedStudent);
    } else if (
      !this.managementSelectedStudent &&
      Object.keys(connectedUsers).length > 1
    ) {
      this.managementSelectedStudent = Object.keys(connectedUsers)[0];
    }
    console.warn(this.managementSelectedStudent);
    this.render();
  }

  async loadInitialRoomTasks() {
    // Fetch batch tasks by id list
    const response = await fetch(
      "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/tasks?batchRequest=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: tasks.join(",") }),
      },
    );

    const data = await response.json();

    // Normalize incoming task shape to our internal model
    const rawTasks = data.tasks || (data.request && data.request.tasks) || [];
    const activeTasks = rawTasks.filter((task) => task?.archived !== true);

    const normalized = (activeTasks || []).map((t) => {
      const usersAssigned = (t.users_assigned || t.usersAssigned || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const id =
        t.task_id ||
        t.id ||
        `${t.room_assigned || "room"}-${t.task_content || "task"}-${t.time_created || Date.now()}`;
      const createdAt = (() => {
        const raw = t.time_created || t.createdAt || Date.now();
        return typeof raw === "number" && raw < 1e12 ? raw * 1000 : raw;
      })();

      return {
        id,
        title: t.task_content || t.title || "Untitled task",
        emoji: t.emoji || "🟣",
        category: t.category || "assigned",
        completed: Boolean(t.completed),
        usersAssigned,
        roomAssigned: t.room_assigned || t.roomAssigned || null,
        createdAt,
      };
    });

    this.roomTasks = normalized;

    normalized.forEach((task) => {
      if (!task.usersAssigned || task.usersAssigned.length === 0) return;
      task.usersAssigned.forEach((email) => {
        const studentTasks = this.getStudentTasks(email);
        if (!studentTasks.assigned.find((t) => t.id === task.id)) {
          studentTasks.assigned.push(task);
        }
      });
    });
  }

  getCategoryColor(category) {
    const colors = {
      art: "#FF69B4",
      coding: "#4CAF50",
      music: "#9C27B0",
      other: "#FF9800",
      assigned: "#2196F3",
      improvement: "#00BCD4",
    };
    return colors[category] || "#666";
  }

  render() {
    const container = document.getElementById("tasks__container");
    if (!container) return;

    container.innerHTML = `
            <div class="main-task-area">
                ${
                  this.isTeachingAssistant == "TA"
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
  }

  renderUserTasks() {
    const currentUserEmail =
      sessionStorage.getItem("email") || this.managementSelectedStudent;
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

  renderRoomTasks() {
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

  renderCompactTask(task, category) {
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

  renderHelpChat() {
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

  // Convert **bold** markdown to <strong> HTML and \n to <br>
  formatMessageText(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  // Scroll both the outer tasks panel and the inner messages list to the bottom
  scrollChatToBottom() {
    requestAnimationFrame(() => {
      const outer = document.getElementById("tasks__container");
      if (outer) outer.scrollTop = outer.scrollHeight;
      const inner = document.querySelector(".help-chat-messages");
      if (inner) inner.scrollTop = inner.scrollHeight;
    });
  }

  renderChatMessage(message) {
    const time =
      message.time ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return `
            <div class="help-message ${message.sender}" data-task-id="${message.taskId || this.taskInHelpChat?.id || ""}">
                ${message.sender === "teacher" ? "<button type=\"button\" class=\"message-avatar message-avatar-button\" onclick=\"window.sendTeacherMessage(this.closest('.help-message').querySelector('.message-text').innerText, this.closest('.help-message').dataset.taskId)\">👩\u200d🏫</button>" : ""}
                <div class="message-bubble">
                    <div class="message-text">${this.formatMessageText(message.text)}</div>
                    <div class="message-time">${time}</div>

                </div>
            </div>
        `;
  }

  renderManagementPopup() {
    // Get connected users from the room
    const studentsList = Object.values(roomMembersData.registered).map(
      (user) => ({
        email: user,
        name: user,
      }),
    );
    const selectedStudent =
      this.managementSelectedStudent ||
      (studentsList.length > 0 ? studentsList[0].email : null);
    tasksManager.selectStudent(selectedStudent);
    /**
     * TODO TA and student accounts are again are not accessible in a breakout room
     */
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
                                <option value="coding">Coding</option>    
                                <option value="art">Art</option>
                                    
                                    <option value="music">Music</option>
                                    <option value="other">Other</option>
                                </select>
                                <button class="add-task-submit-btn" onclick="tasksManager.addNewRoomTask()">Add Task</button>
                            </div>
                        </div>

                        <div class="student-tasks-section">
                        ${this.getInnerHTML(studentTasks, selectedStudent)}
                       
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

  renderProgressStats(studentTasks) {
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

  renderManagementTask(task, category, isDraggable) {
    const color = this.getCategoryColor(category);
    const draggableAttr = isDraggable ? 'draggable="true"' : "";
    const safeId = String(task.id)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;");

    // Get list of users assigned to this task
    // Only show for room pool tasks
    let assignedUsers = [];
    const isRoomPoolTask = ["art", "coding", "music", "other"].includes(
      category,
    );
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
                <button class="delete-room-task-btn" onclick="event.stopPropagation(); tasksManager.deleteRoomTask(event, this.closest('[data-task-id]').dataset.taskId)" title="Archive task">×</button>
            </div>
        `;
  }

  onRoomMembersUpdated(members) {
    // update internal state or re-render
    this.roomMembers = members;
    //No longer needed as task stay assigned.
    // this.render();
  }

  // Drag and Drop handlers
  handleDragStart(e) {
    const taskData = e.target.dataset.task;
    const taskCategory = e.target.dataset.taskCategory;
    e.dataTransfer.setData("text/plain", taskData);
    e.dataTransfer.setData("source-category", taskCategory);
    e.dataTransfer.effectAllowed = "copyMove";
    e.target.classList.add("dragging");
  }

  handleDragEnd(e) {
    e.target.classList.remove("dragging");
    document.querySelectorAll(".dropzone").forEach((zone) => {
      zone.classList.remove("drag-over");
    });
  }

  handleDragOver(e) {
    e.preventDefault();
    const dropzone = e.currentTarget;
    const targetCategory = dropzone.dataset.category;

    // Determine drop effect based on target
    if (targetCategory === "room") {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "copy";
    }

    if (!dropzone.classList.contains("drag-over")) {
      dropzone.classList.add("drag-over");
    }
  }

  handleDragLeave(e) {
    const dropzone = e.currentTarget;
    if (!dropzone.contains(e.relatedTarget)) {
      dropzone.classList.remove("drag-over");
    }
  }

  handleDropToRoom(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropzone = e.currentTarget;
    dropzone.classList.remove("drag-over");

    const taskData = JSON.parse(e.dataTransfer.getData("text/plain"));
    const sourceCategory = e.dataTransfer.getData("source-category");
    const studentEmail = this.managementSelectedStudent;

    // Only allow dropping back if it came from a student's tasks
    if (sourceCategory === "assigned" || sourceCategory === "improvement") {
      const studentTasks = this.getStudentTasks(studentEmail);
      studentTasks.assigned = studentTasks.assigned.filter(
        (t) => t.id !== taskData.id,
      );
      studentTasks.improvement = studentTasks.improvement.filter(
        (t) => t.id !== taskData.id,
      );

      this.logTaskEvent("custom:taskUnassigned", {
        taskId: taskData.id,
        taskTitle: taskData.title,
        assignee: studentEmail,
        fromCategory: sourceCategory,
      });

      // Save the updated tasks back to the main store
      this.studentTasks[studentEmail] = studentTasks;

      this.selectStudent(studentEmail);

      // Only refresh main view if popup is closed
      if (
        this.activeView === "user" &&
        sessionStorage.getItem("email") === studentEmail
      ) {
        const popup = document.getElementById("task-management-popup");
        if (!popup || popup.classList.contains("hidden")) {
          setTimeout(() => this.render(), 100);
        }
      }
    }
  }

  handleDrop(e, targetCategory) {
    e.preventDefault();
    e.stopPropagation();

    const dropzone = e.currentTarget;
    dropzone.classList.remove("drag-over");

    const taskData = JSON.parse(e.dataTransfer.getData("text/plain"));

    const studentEmail = this.managementSelectedStudent;
    const studentTasks = this.getStudentTasks(studentEmail);

    const existsInCategory =
      targetCategory === "assigned"
        ? studentTasks.assigned.some((t) => t.id === taskData.id)
        : studentTasks.improvement.some((t) => t.id === taskData.id);

    if (existsInCategory) {
      return;
    }

    const newTask = { ...taskData, completed: false };

    if (targetCategory === "assigned") {
      studentTasks.assigned.push(newTask);
    } else {
      studentTasks.improvement.push(newTask);
    }

    this.logTaskEvent("custom:taskAssigned", {
      taskId: newTask.id,
      taskTitle: newTask.title,
      assignee: studentEmail,
      targetCategory,
      sourceCategory: e.dataTransfer.getData("source-category") || null,
    });

    this.studentTasks[studentEmail] = studentTasks;

    this.selectStudent(this.managementSelectedStudent);

    // Only render if the user view is active and it's the current user's tasks
    // Don't render during drag operations in the management popup
    if (
      this.activeView === "user" &&
      sessionStorage.getItem("email") === this.managementSelectedStudent
    ) {
      const popup = document.getElementById("task-management-popup");
      if (!popup || popup.classList.contains("hidden")) {
        setTimeout(() => this.render(), 100);
      }
    }
  }

  removeTaskFromStudent(e, taskId) {
    e.stopPropagation();

    const studentTasks = this.getStudentTasks(this.managementSelectedStudent);
    const removedTask = [
      ...studentTasks.assigned,
      ...studentTasks.improvement,
    ].find((t) => t.id === taskId);

    studentTasks.assigned = studentTasks.assigned.filter(
      (t) => t.id !== taskId,
    );
    studentTasks.improvement = studentTasks.improvement.filter(
      (t) => t.id !== taskId,
    );

    // Refresh the student section only
    this.selectStudent(this.managementSelectedStudent);

    // Also refresh the main view if it's showing user tasks
    if (
      this.activeView === "user" &&
      sessionStorage.getItem("email") === this.managementSelectedStudent
    ) {
      setTimeout(() => this.render(), 100);
    }
  }

  async selectTaskForHelp(task) {
    /**
     * TODO Clean up initial AI intro
     */
    this.taskInHelpChat = task;
    this.selectedTask = null;

    console.log(this.taskInHelpChat);
    /**TODO block analyzer */
    // Show a helpful analyzing placeholder while we query the analyzer
    this.chatMessages = [
      {
        sender: "teacher",
        text: `Hi! I'm going to analyze your current workspace and suggest concrete next steps for: **${task.title}**. One moment...`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];

    this.render();
    this.scrollChatToBottom();

    //** TODO
    // Clean up Task Center */
    // Try to collect code chunks from the embedded VM and call the same task-chat analyzer
    try {
      const frame = document.getElementById("main-stream");
      const frameWindow =
        frame && frame.contentWindow ? frame.contentWindow : null;

      let chunks = [];
      if (
        window.scratchParser &&
        typeof window.scratchParser.requestCodeChunks === "function" &&
        frameWindow
      ) {
        try {
          chunks = await window.scratchParser.requestCodeChunks(frameWindow);
        } catch (e) {
          console.warn("Failed to collect code chunks from VM", e);
          chunks = [];
        }
      }

      // Prepare analyzer prompt
      const taskDescription = this.getTaskDescription(task);
      let codeSummary = "";
      if (Array.isArray(chunks) && chunks.length > 0) {
        // Join a few chunks (up to 6) into a compact summary for the model
        const joined = chunks
          .slice(0, 6)
          .map(
            (c, i) =>
              `Chunk ${i + 1}: ${String(c.chunkText || c.text || "").trim()}`,
          )
          .join("\n---\n");
        codeSummary = `Current workspace code chunks:\n${joined}`;
        const body =
          `You are helping a student with Scratch code.\n` +
          `Task title: ${task.title}\n` +
          `Task description: ${taskDescription}\n` +
          (codeSummary ? `${codeSummary}\n` : "") +
          `Please analyze the student's current blocks and provide 3 concrete, step-by-step suggestions the student can try next. Keep the response concise: use brief bullet points or at most 3 short sentences per suggestion. Do NOT produce long paragraphs.\n` +
          `Do NOT label code sections as \"Chunk 4\". If you must reference a specific code region, describe it without numeric chunk labels (for example: \"the first block sequence that checks for input\"). If the response nonetheless includes an explicit \"Chunk N\" reference, the client will automatically pin a short note to that chunk in the workspace.`;
      } else {
        const body =
          `You are helping a student with Scratch project.\n` +
          `Task title: ${task.title}\n` +
          `Task description: ${taskDescription}\n` +
          `please provide assistance and starting steps to handle this task.`;
      }

      const payload = {
        messageVersion: "1.0",
        agent: {
          name: "",
          id: "",
          alias: "",
          version: "DRAFT",
        },
        httpMethod: "POST",
        inputText: body,
        dbcontext: {
          roomAssigned: this.selectTask.roomAssigned,
          taskID: this.selectTask.id,
          username: sessionStorage.getItem("email"),
        },
        sessionAttributes: {},
        promptSessionAttributes: {},
      };
      const resp = await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/task-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const answer = data.response || data.message || JSON.stringify(data);

      // Replace placeholder with the real analyzer output
      this.chatMessages = [
        {
          sender: "teacher",
          text: answer,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];

      // Post-process analyzer output: attach short notes to any chunk that the analyzer
      // appears to reference. We match explicit "Chunk N" labels, substrings of chunk
      // text appearing verbatim in the answer, or shared keywords. Also handle code
      // fences/backticks by attaching a generic note to the most likely chunk.
      try {
        const canAttach =
          frameWindow &&
          window.scratchParser &&
          typeof window.scratchParser.attachNoteToChunk === "function";
        if (
          typeof answer === "string" &&
          Array.isArray(chunks) &&
          chunks.length > 0 &&
          canAttach
        ) {
          const answerLower = answer.toLowerCase();

          // 1) explicit "Chunk N" references
          const refs = Array.from(answer.matchAll(/Chunk\s*(\d+)/gi))
            .map((m) => parseInt(m[1], 10))
            .filter((n) => !Number.isNaN(n));
          const uniqueRefs = [...new Set(refs)];
          uniqueRefs.forEach((num) => {
            const idx = num - 1;
            if (idx >= 0 && idx < chunks.length) {
              const regex = new RegExp(
                `Chunk\\s*${num}[:\\s-]*(.*?)((\\.|\\n)|$)`,
                "i",
              );
              const m = answer.match(regex);
              let note =
                m && m[1]
                  ? m[1].trim()
                  : `Referenced in help: see suggested guidance.`;
              if (note.length > 140) note = note.slice(0, 137) + "...";
              try {
                window.scratchParser.attachNoteToChunk(
                  frameWindow,
                  chunks[idx],
                  note,
                );
              } catch (e) {
                console.warn("Failed to attach note to chunk", e);
              }
            }
          });

          // 2) match chunk snippets or keywords appearing in the answer
          const matchedIndices = new Set(uniqueRefs.map((n) => n - 1));
          for (let i = 0; i < chunks.length; i++) {
            if (matchedIndices.has(i)) continue; // already handled
            const ct = String(
              chunks[i].chunkText || chunks[i].text || "",
            ).trim();
            if (!ct) continue;
            const sample = ct.slice(0, 60).toLowerCase();
            let matched = false;

            // direct substring match
            if (sample && answerLower.includes(sample)) matched = true;

            // keyword match: look for any 5+ letter token from chunk in answer
            if (!matched) {
              const tokens = ct
                .split(/[^a-zA-Z0-9_]+/)
                .filter((t) => t.length >= 5)
                .slice(0, 10);
              for (const tok of tokens) {
                if (answerLower.includes(tok.toLowerCase())) {
                  matched = true;
                  break;
                }
              }
            }

            if (matched) {
              // extract a short surrounding snippet from answer mentioning the token/sample
              let note = "";
              const idx = answerLower.indexOf(sample);
              if (idx >= 0) {
                const start = Math.max(0, idx - 40);
                note = answer
                  .slice(start, Math.min(answer.length, idx + 100))
                  .trim();
              } else {
                // find first token occurrence
                let foundIdx = -1;
                for (const tok of ct
                  .split(/[^a-zA-Z0-9_]+/)
                  .filter((t) => t.length >= 5)) {
                  const pos = answerLower.indexOf(tok.toLowerCase());
                  if (pos >= 0) {
                    foundIdx = pos;
                    break;
                  }
                }
                if (foundIdx >= 0) {
                  const start = Math.max(0, foundIdx - 40);
                  note = answer
                    .slice(start, Math.min(answer.length, foundIdx + 100))
                    .trim();
                }
              }
              if (!note) note = "Referenced in help: see suggested guidance.";
              if (note.length > 140) note = note.slice(0, 137) + "...";
              try {
                window.scratchParser.attachNoteToChunk(
                  frameWindow,
                  chunks[i],
                  note,
                );
              } catch (e) {
                console.warn("Failed to attach note to chunk", e);
              }
              matchedIndices.add(i);
            }
          }

          // 3) if answer contains code fences/backticks and no chunk matched yet, pin a generic note to the first chunk
          if (
            matchedIndices.size === 0 &&
            (/```|`/.test(answer) ||
              /\b(block|script|when|if|repeat|forever|move|turn)\b/i.test(
                answer,
              ))
          ) {
            const note =
              "Analyzer referenced code in the response. See suggested guidance in chat.";
            try {
              window.scratchParser.attachNoteToChunk(
                frameWindow,
                chunks[0],
                note,
              );
            } catch (e) {
              console.warn("Failed to attach fallback note", e);
            }
          }
        }
      } catch (e) {
        console.warn("Post-processing analyzer output failed", e);
      }
    } catch (err) {
      // Fallback to original generic guidance when analyzer fails
      const initialMessage = this.getTaskDescription(task);
      this.chatMessages = [
        {
          sender: "teacher",
          text: `Hi! I'm here to help you with the task: **${task.title}**. This is what you need to do: ${initialMessage}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ];
      console.error("Task analyzer failed", err);
    } finally {
      this.render();
      this.scrollChatToBottom();
    }
  }

  requestHelpForTask(taskId, category, view) {
    let task;
    if (view === "room") {
      task = this.roomTasks.find((t) => t.id === taskId);
    } else {
      const userTasks = this.getStudentTasks(sessionStorage.getItem("email"));
      const allUserTasks = [...userTasks.assigned, ...userTasks.improvement];
      task = allUserTasks.find((t) => t.id === taskId);
    }

    if (task) {
      const taskWithCategory = { ...task, category };
      this.selectTaskForHelp(taskWithCategory);
    }
  }

  closeHelpChat() {
    this.taskInHelpChat = null;
    this.chatMessages = [];
    this.render();
  }

  async sendChatMessage(userMessage) {
    //**
    // TODO Clean up PromptContext to go to the
    // lambda : task-chatgpt
    // User chat also needs to be added to
    // */
    userMessage = userMessage.trim();
    if (userMessage === "" || !this.taskInHelpChat) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.chatMessages.push({ sender: "student", text: userMessage, time });
    document.querySelector(".help-chat-input").value = "";
    this.render();
    this.scrollChatToBottom();

    // Disable input while waiting for response
    const inputEl = document.querySelector(".help-chat-input");
    const sendBtn = document.querySelector(".send-btn");
    if (inputEl) inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Build context from the current task
    const task = this.taskInHelpChat;
    console.log(task);
    const taskId = task.id;
    const roomAssigned = task.roomAssigned;
    const taskDescription = this.getTaskDescription(task);
    console.log(taskId + " " + roomAssigned);
    const body =
      `The student is working on a task titled "${task.title}" ` +
      `in the "${task.category}" category. ` +
      `The student asks: ${userMessage}`;

    const agentConfig = {
      name: "",
      id: "",
      alias: "",
      version: "DRAFT",
    };
    const dbContext = {
      roomAssigned: roomAssigned || "unknown_room_chat",
      taskID: taskId || "unknown_task_chat",
      username: sessionStorage.getItem("email"),
    };
    const payload = {
      messageVersion: "1.0",
      agent: agentConfig,
      httpMethod: "POST",
      inputText: body,
      dbcontext: dbContext,
      sessionAttributes: {},
      promptSessionAttributes: {},
    };

    try {
      const response = await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/task-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const answer = data.response || JSON.stringify(data);

      this.chatMessages.push({
        sender: "teacher",
        text: answer,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      this.chatMessages.push({
        sender: "teacher",
        text: `Sorry, I couldn't reach the AI helper right now. (${err.message})`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } finally {
      this.render();
      this.scrollChatToBottom();
      requestAnimationFrame(() => {
        const el = document.querySelector(".help-chat-input");
        if (el) {
          el.disabled = false;
          el.focus();
        }
        const btn = document.querySelector(".send-btn");
        if (btn) btn.disabled = false;
      });
    }
  }

  handleChatInput(e, task) {
    if (e.key === "Enter") {
      const inputEl = e.target;
      this.sendChatMessage(inputEl.value);
      e.preventDefault();
    }
  }

  // ── Delegation helpers: read task data from the parent element's data-* attrs ──
  toggleTaskById(el) {
    const taskId = el.dataset.taskId;
    const category = el.dataset.category;
    const view = el.dataset.view;
    this.toggleTaskCompletion(taskId, category, view);
  }

  requestHelpById(el) {
    const taskId = el.dataset.taskId;
    const category = el.dataset.category;
    const view = el.dataset.view;
    this.requestHelpForTask(taskId, category, view);
  }

  async toggleTaskCompletion(taskId, category, view) {
    // Find the task – since room & student tasks share the same object reference,
    // we only need to toggle once. Search roomTasks first, fall back to student.
    let task = this.roomTasks.find((t) => String(t.id) == String(taskId));
    if (!task) {
      const userTasks = this.getStudentTasks(sessionStorage.getItem("email"));
      const allUserTasks = [...userTasks.assigned, ...userTasks.improvement];
      task = allUserTasks.find((t) => String(t.id) == String(taskId));
    }

    if (task) {
      task.completed = !task.completed;
      this.logTaskEvent("custom:taskCompletionToggled", {
        taskId: task.id,
        taskTitle: task.title,
        completed: task.completed,
        category,
        view,
      });
      if (task.completed) {
        this.animateTaskCompletion(taskId);
      }
      this.render();

      // Refresh the management popup if it's open
      const popup = document.getElementById("task-management-popup");
      if (popup && !popup.classList.contains("hidden")) {
        this.selectStudent(this.managementSelectedStudent);
      }

      // Persist completion status to API
      this.sendTaskCompletionToApi(task);
    }
  }

  animateTaskCompletion(taskId) {
    setTimeout(() => {
      const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskEl) {
        taskEl.classList.add("completing");
        setTimeout(() => {
          taskEl.classList.remove("completing");
        }, 600);
      }
    }, 0);
  }

  toggleTaskInManagement(taskId, category) {
    // Don't toggle if currently dragging
    if (event && event.target.closest(".dragging")) {
      return;
    }

    // Find the task in the student's tasks
    const studentEmail = this.managementSelectedStudent;
    console.log(studentEmail);
    const studentTasks = this.getStudentTasks(studentEmail);

    let task = null;
    if (category === "assigned") {
      task = studentTasks.assigned.find((t) => String(t.id) == String(taskId));
    } else if (category === "improvement") {
      task = studentTasks.improvement.find(
        (t) => String(t.id) == String(taskId),
      );
    }
    // Also check roomTasks (they share references, but just in case)
    if (!task) {
      task = this.roomTasks.find((t) => String(t.id) == String(taskId));
    }

    if (task) {
      task.completed = !task.completed;
      this.logTaskEvent("custom:taskCompletionToggled", {
        taskId: task.id,
        taskTitle: task.title,
        completed: task.completed,
        category,
        view: "management",
      });

      // Refresh the popup to show updated state
      this.selectStudent(studentEmail);

      // Also refresh main view if it's the current user
      if (
        this.activeView === "user" &&
        sessionStorage.getItem("email") === studentEmail
      ) {
        const popup = document.getElementById("task-management-popup");
        if (!popup || popup.classList.contains("hidden")) {
          this.render();
        }
      }

      // Persist completion status to API
      this.sendTaskCompletionToApi(task);
    }
  }

  async sendTaskArchivedToApi(task) {
    const taskId = task.id || task.task_id || task;
    console.log("Woot : " + taskId);
    if (!taskId) return;
    try {
      await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/tasks",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: taskId,
            archived: true,
          }),
        },
      );
    } catch (err) {
      console.error("Failed to send task archived status", err);
    } finally {
      console.log("Archive success");
    }
  }

  async sendTaskCompletionToApi(task) {
    const taskId = task.id || task.task_id;
    if (!taskId) return;
    try {
      await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/tasks",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: taskId,
            completed: task.completed,
          }),
        },
      );
    } catch (err) {
      console.error("Failed to send task completion status", err);
    }
  }

  getStudentTasks(studentEmail) {
    if (!studentEmail) {
      console.warn("no Active student email");
      // Return a copy of default tasks if no email, but don't store it
      return {
        assigned: JSON.parse(JSON.stringify(this.defaultTasks.assigned)),
        improvement: JSON.parse(JSON.stringify(this.defaultTasks.improvement)),
      };
    }

    if (!this.studentTasks[studentEmail]) {
      // Initialize new student with default tasks and SAVE IT
      this.studentTasks[studentEmail] = {
        assigned: JSON.parse(JSON.stringify(this.defaultTasks.assigned)),
        improvement: JSON.parse(JSON.stringify(this.defaultTasks.improvement)),
      };
    }
    console.log(
      "Outputting student Tasks :" +
        studentEmail +
        " from getStudent Tasks" +
        this.studentTasks[studentEmail],
    );

    // Return the reference to the stored object so modifications persist
    return this.studentTasks[studentEmail];
  }

  selectStudent(student) {
    if (student === null) {
      console.warn("SelectedStudent is Null");
      throw console.error("Erk");
    }

    this.managementSelectedStudent = student;
    // Find the task-management-popup and its content to refresh just this part
    const popup = document.getElementById("task-management-popup");
    if (popup && !popup.classList.contains("hidden")) {
      const content = popup.querySelector(".management-main-layout");
      if (content) {
        const studentTasks = this.getStudentTasks(student);
        // Update the student tasks section without rerendering the whole popup
        const studentSection = content.querySelector(".student-tasks-section");
        if (studentSection) {
          studentSection.innerHTML = this.getInnerHTML(studentTasks, student);
        }

        // Refresh the room tasks pool to update user indicators
        const poolList = content.querySelector(".pool-tasks-list");

        if (poolList) {
          poolList.innerHTML = this.roomTasks
            .map((task) => this.renderManagementTask(task, task.category, true))
            .join("");
        }
      }
    }
  }
  getInnerHTML(studentTasks, selectedStudent) {
    console.log(roomMembersData);
    const studentsList = Object.values(roomMembersData.registered).map(
      (user) => ({
        email: user,
        name: user,
      }),
    );

    const usersArray =
      studentsList && typeof studentsList === "object"
        ? Object.values(studentsList).filter((user) => user && user.email)
        : [];

    const studentOptions =
      usersArray.length > 0
        ? usersArray
            .map(
              (user) => `
              <option value="${user.email}" ${
                user.email === selectedStudent ? "selected" : ""
              }>
                ${user.name || user.email} (${user.email})
              </option>
            `,
            )
            .join("")
        : `<option disabled>No students available</option>`;

    return `
    <div class="management-section">
      <label class="management-label">Select Student</label>
      <select class="student-select" onchange="tasksManager.selectStudent(this.value)">
        ${studentOptions}
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
        ${studentTasks.assigned
          .map((task) => this.renderManagementTask(task, "assigned", true))
          .join("")}
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
        ${studentTasks.improvement
          .map((task) => this.renderManagementTask(task, "improvement", true))
          .join("")}
        ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ""}
      </div>
    </div>

    ${this.renderProgressStats(studentTasks)}
  `;
  }

  selectEmoji(emoji) {
    document.getElementById("new-room-task-emoji").value = emoji;

    // Update active state on buttons
    document
      .querySelectorAll(".emoji-btn")
      .forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");
  }

  async addNewRoomTask() {
    const title = document.getElementById("new-room-task-title").value.trim();
    const emoji = document.getElementById("new-room-task-emoji").value || "📝";
    const category = document.getElementById("new-room-task-category").value;

    if (!title) {
      alert("Please enter a task title");
      return;
    }

    const newTask = {
      id: Date.now(),
      title: title,
      emoji: emoji,
      category: category,
      completed: false,
      usersAssigned: [],
      roomAssigned: typeof roomId !== "undefined" ? roomId : null,
      createdAt: Date.now(),
    };

    this.roomTasks.push(newTask);

    this.logTaskEvent("custom:taskCreated", {
      taskId: newTask.id,
      taskTitle: newTask.title,
      category: newTask.category,
    });

    await this.uploadNewTaskToApi(newTask);

    document.getElementById("new-room-task-title").value = "";
    document.getElementById("new-room-task-emoji").value = "📝";
    document.getElementById("new-room-task-category").value = "art";
    document
      .querySelectorAll(".emoji-btn")
      .forEach((btn) => btn.classList.remove("active"));

    // Refresh the popup to show the new task
    this.selectStudent(this.managementSelectedStudent);
  }

  async uploadNewTaskToApi(task) {
    const baseRoomId = roomId.split(":")[0];
    const payload = {
      task_content: task.title,
      room_assigned:
        typeof roomId !== "undefined" ? baseRoomId : task.roomAssigned || null,
      users_assigned: Array.isArray(task.usersAssigned)
        ? task.usersAssigned.join(",")
        : "",
      emoji: task.emoji || "📝",
    };

    try {
      await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
    } catch (err) {
      console.error("Failed to upload new task", err);
    } finally {
      console.log("Task Updated Successfully");
    }
  }

  deleteRoomTask(e, taskId) {
    e.stopPropagation();

    if (
      !confirm(
        "Archive this task from the room? It will be removed from all students.",
      )
    ) {
      return;
    }

    const taskToDelete = this.roomTasks.find(
      (t) => String(t.id) === String(taskId),
    );

    // Remove from room tasks
    this.roomTasks = this.roomTasks.filter((t) => t.id !== taskId);

    this.logTaskEvent("custom:taskDeleted", {
      taskId,
      taskTitle: taskToDelete ? taskToDelete.title : null,
    });

    //**
    // TODO Add a PATCH  */

    this.sendTaskArchivedToApi(taskId);

    // Remove from all students
    Object.keys(this.studentTasks).forEach((email) => {
      const studentTasks = this.studentTasks[email];
      studentTasks.assigned = studentTasks.assigned.filter(
        (t) => t.id !== taskId,
      );
      studentTasks.improvement = studentTasks.improvement.filter(
        (t) => t.id !== taskId,
      );
    });

    this.selectStudent(this.managementSelectedStudent);
  }

  getUsersAssignedToTask(taskId) {
    const users = [];
    const connectedUsersArray = Object.values(connectedUsers);

    connectedUsersArray.forEach((user) => {
      const studentTasks = this.getStudentTasks(user.email);
      const hasTask = [
        ...studentTasks.assigned,
        ...studentTasks.improvement,
      ].some((t) => t.id === taskId);

      if (hasTask) {
        console.log("User", user.name, "has task", taskId);
        users.push(user);
      }
    });

    return users;
  }

  async saveTaskChanges() {
    this.hideTaskManagementPopup();

    // Build a map of task_id -> list of user emails
    const taskAssignments = {};

    for (const [studentEmail, tasks] of Object.entries(this.studentTasks)) {
      if (studentEmail && tasks) {
        // Process assigned tasks
        if (tasks.assigned) {
          tasks.assigned.forEach((task) => {
            const taskId = task.id || task.task_id;
            if (!taskAssignments[taskId]) {
              taskAssignments[taskId] = [];
            }
            if (!taskAssignments[taskId].includes(studentEmail)) {
              taskAssignments[taskId].push(studentEmail);
            }
          });
        }

        // Process improvement tasks
        if (tasks.improvement) {
          tasks.improvement.forEach((task) => {
            const taskId = task.id || task.task_id;
            if (!taskAssignments[taskId]) {
              taskAssignments[taskId] = [];
            }
            if (!taskAssignments[taskId].includes(studentEmail)) {
              taskAssignments[taskId].push(studentEmail);
            }
          });
        }
      }
    }

    // Send PATCH request for each task with its assigned users
    for (const [taskId, usersAssigned] of Object.entries(taskAssignments)) {
      try {
        const response = await fetch(
          "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/tasks",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              task_id: taskId,
              users_assigned: usersAssigned,
            }),
          },
        );
        if (response.status === 404) {
          alert(`Task ${taskId} was not saved to the Backend. Please reassign`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        console.log(
          `Task ${taskId} updated with users: ${usersAssigned.join(", ")}`,
        );
      } catch (error) {
        console.error(`Error saving task ${taskId}:`, error);
      }
    }

    this.logTaskEvent("custom:taskAssignmentsSaved", {
      updatedTaskCount: Object.keys(taskAssignments).length,
    });

    // Refresh the main task view to show updated tasks for current user
    if (this.activeView === "user") {
      this.render();
    }
  }

  getTaskDescription(task) {
    const descriptions = {
      1: "Drag blocks from the block palette (left side) into the coding area (middle).",
      2: "Make sure the notch of one block fits perfectly into the bump of the next to form a stack.",
      3: "Click the green flag button above the stage to execute your script.",
      4: "In the bottom-right of the screen, click the 'Choose a Sprite' icon (cat face) and pick one.",
      5: "Use the 'move steps' block under the Motion category to make your sprite walk.",
      6: "Go to the 'Costumes' tab and switch between them using the 'next costume' block to create a walk cycle.",
      7: "Go to the 'Sounds' tab, import a sound, and use the 'start sound' block.",
      8: "Use the 'when space key pressed' block (Events category) and change 'space' to the key you want.",
      101: "Find and select a backdrop from the library to set the scene for your game.",
      102: "Ensure the default Cat sprite is on your stage, or add a new one from the library.",
      103: "Click the 'Costumes' tab for the cat sprite and use the paint tools to draw a fun new outfit.",
      104: "Use two separate 'when key pressed' blocks (left arrow and right arrow) and 'change x by' blocks to control horizontal movement.",
      205: "Add a 'start sound' block inside your jump and collision scripts.",
      206: "Use 'if...then' blocks to check for a winning condition (like reaching a goal) or a losing condition (like touching an obstacle).",
      207: "Look at your classmate's code, identify errors, and suggest a solution. Peer review is crucial!",
    };
    return (
      descriptions[task.id] ||
      "Complete this task to progress in your learning journey. Check the resources!"
    );
  }

  getTaskResources(task) {
    return `
            <div class="task-resources">
                <h4>📚 Resources</h4>
                <ul>
                    <li><a href="#">Scratch Documentation</a></li>
                    <li><a href="#">Video Tutorial</a></li>
                    <li><a href="#">Example Project</a></li>
                </ul>
            </div>
        `;
  }

  selectTask(taskId, category, view) {
    let task;
    if (view === "room") {
      task = this.roomTasks.find((t) => t.id === taskId);
    } else {
      const userTasks = this.getStudentTasks(sessionStorage.getItem("email"));
      task = [...userTasks.assigned, ...userTasks.improvement].find(
        (t) => t.id === taskId,
      );
    }

    if (task) {
      this.selectedTask = { ...task, category };
      this.render();
    }
  }

  closeDetail() {
    this.selectedTask = null;
    this.render();
  }

  setActiveView(view) {
    if (["user", "room"].includes(view) && this.activeView !== view) {
      this.activeView = view;
      this.selectedTask = null;
      this.render();
    }
  }

  getScratchIframeWindow() {
    const frame = document.getElementById("main-stream");
    if (!frame) return null;
    return frame.contentWindow || null;
  }

  async highlightAnyScratchBlock() {
    const frameWindow = this.getScratchIframeWindow();
    if (!frameWindow) {
      alert("Scratch VM frame is not available yet.");
      return;
    }

    const noteText =
      this.selectedTask && this.selectedTask.title
        ? `Task Hint: ${this.selectedTask.title}`
        : this.taskInHelpChat && this.taskInHelpChat.title
          ? `Help Focus: ${this.taskInHelpChat.title}`
          : "Try editing this block first.";

    const payload = {
      durationMs: 1500,
      noteText,
    };

    try {
      frameWindow.postMessage(
        {
          type: "highlightAnyBlock",
          ...payload,
        },
        "*",
      );
      console.log("Requested highlightAnyBlock in iframe:", payload);
    } catch (error) {
      console.error("Failed to highlight Scratch block:", error);
      alert("Failed to call iframe highlight function.");
    }
  }

  showNotification(message) {
    return;
    const notif = document.createElement("div");
    notif.className = "task-notification show";
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.remove("show");
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  showTaskManagementPopup() {
    // Ensure we have a selected student before showing the popup
    if (
      !this.managementSelectedStudent &&
      Object.keys(connectedUsers).length > 0
    ) {
      this.managementSelectedStudent = Object.keys(connectedUsers)[0];
    }
    document
      .getElementById("task-management-popup")
      ?.classList.remove("hidden");
  }

  hideTaskManagementPopup() {
    document.getElementById("task-management-popup")?.classList.add("hidden");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.tasksManager = new TasksManager();
  });
} else {
  window.tasksManager = new TasksManager();
}

const membersData = window.getRoomMembersData();
if (!membersData) {
  console.warn("No roomMembersData found on window");
}

window.addEventListener("roomMembersUpdated", (event) => {
  const data = event.detail;

  if (
    window.tasksManager &&
    typeof window.tasksManager.onRoomMembersUpdated === "function"
  ) {
    window.tasksManager.onRoomMembersUpdated(data);
  }
});
