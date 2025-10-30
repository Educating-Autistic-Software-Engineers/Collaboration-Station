window.tasksManager;

class TasksManager {
    constructor() {
        this.roomTasks = [
            { id: 1, title: "Drag a block into the editor", category: "basics", emoji: "🖱️", completed: false },
            { id: 2, title: "Connect blocks together", category: "basics", emoji: "🔗", completed: false },
            { id: 3, title: "Run your first program", category: "basics", emoji: "▶️", completed: false },
            { id: 4, title: "Add a new sprite", category: "sprites", emoji: "🐱", completed: false },
            { id: 5, title: "Make a sprite move", category: "sprites", emoji: "🏃", completed: false },
            { id: 6, title: "Change sprite costumes", category: "sprites", emoji: "👗", completed: false },
            { id: 7, title: "Add sounds to your project", category: "multimedia", emoji: "🎵", completed: false },
            { id: 8, title: "Use keyboard events", category: "multimedia", emoji: "⌨️", completed: false }
        ];

        // Store tasks per student using their email as the key
        this.studentTasks = {};

        // Template for new student tasks
        this.defaultTasks = {
            assigned: [
                { id: 101, title: "Add a new backdrop to the stage", emoji: "🏞️", completed: false },
                { id: 102, title: "Add a cat sprite to the stage", emoji: "🐈", completed: false },
                { id: 103, title: "Draw a sprite costume for the cat", emoji: "🎨", completed: false },
                { id: 104, title: "Make the cat move left and right with arrow keys", emoji: "⬅️➡️", completed: false },
            ],
            improvement: [
                { id: 205, title: "Add sound effects for jumps and collisions", emoji: "🔊", completed: false },
                { id: 206, title: "Add a simple win/lose condition", emoji: "🎯", completed: false },
                { id: 207, title: "Help a classmate debug their Scratch project", emoji: "🤝", completed: false }
            ]
        };

        this.activeView = 'user'; 
        this.selectedTask = null;
        this.taskInHelpChat = null;
        this.chatMessages = [];
        this.isTeachingAssistant = true;
        this.managementSelectedStudent = null;
        this.showingAddTaskForm = false;
        this.addTaskCategory = null;
        this.init();
    }

    init() {
        // wait
        window.messagingReady.then(() => {
            setTimeout(() => {
                this.render();
            }, 1000);
        });
    }

    getCategoryColor(category) {
        const colors = {
            basics: '#4CAF50',
            sprites: '#2196F3',
            multimedia: '#FF9800',
            assigned: '#9C27B0',
            improvement: '#00BCD4'
        };
        return colors[category] || '#666';
    }

    render() {
        const container = document.getElementById('tasks__container');
        if (!container) return;

        container.innerHTML = `
            <div class="main-task-area">
                <div class="tasks-view-toggle">
                    <div class="toggle-btn-container">
                        <button class="toggle-btn ${this.activeView === 'user' ? 'active' : ''}" 
                                onclick="tasksManager.setActiveView('user')"
                                style="width: 100%; margin-bottom: 0.5rem;">
                            👤 My Tasks
                        </button>
                        <button class="toggle-btn ${this.activeView === 'room' ? 'active' : ''}" 
                                onclick="tasksManager.setActiveView('room')"
                                style="width: 100%; margin-bottom: 0.5rem;">
                            🎓 Room Tasks
                        </button>
                        ${this.isTeachingAssistant ? `
                            <button class="toggle-btn manage-btn" 
                                    onclick="tasksManager.showTaskManagementPopup()"
                                    style="width: 100%;">
                                ⚙️ Manage
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div class="tasks-content">
                    ${this.activeView === 'user' ? this.renderUserTasks() : this.renderRoomTasks()}
                </div>
            </div>
            
            ${this.renderHelpChat()} 
            ${this.selectedTask ? this.renderTaskDetail() : ''}
            ${this.isTeachingAssistant ? this.renderManagementPopup() : ''}
        `;

        if (this.taskInHelpChat) {
            setTimeout(() => {
                const inputEl = document.querySelector('.help-chat-input');
                if (inputEl) {
                    inputEl.onkeypress = (e) => this.handleChatInput(e, this.taskInHelpChat); 
                }
                const messagesEl = document.querySelector('.help-chat-messages');
                if (messagesEl) {
                    messagesEl.scrollTop = messagesEl.scrollHeight;
                }
            }, 0);
        }
    }

    renderUserTasks() {
        const currentUserEmail = sessionStorage.getItem('email');
        const userTasks = this.getStudentTasks(currentUserEmail);
        const assignedCount = userTasks.assigned.filter(t => t.completed).length;
        const improvementCount = userTasks.improvement.filter(t => t.completed).length;
        
        return `
            <div class="tasks-section active">
                <div class="section-header">
                    <h3>Assigned Tasks</h3>
                    <span class="task-count">${assignedCount}/${userTasks.assigned.length}</span>
                </div>
                <div class="task-list-compact">
                    ${userTasks.assigned.map(task => this.renderCompactTask(task, 'assigned')).join('')}
                </div>
                
                <div class="section-header">
                    <h3>Improvement Goals</h3>
                    <span class="task-count">${improvementCount}/${userTasks.improvement.length}</span>
                </div>
                <div class="task-list-compact">
                    ${userTasks.improvement.map(task => this.renderCompactTask(task, 'improvement')).join('')}
                </div>
            </div>
        `;
    }

    renderRoomTasks() {
        const completedCount = this.roomTasks.filter(t => t.completed).length;
        
        return `
            <div class="tasks-section active">
                <div class="section-header">
                    <h3>Learning Objectives</h3>
                    <span class="task-count">${completedCount}/${this.roomTasks.length}</span>
                </div>
                <div class="task-list-compact">
                    ${this.roomTasks.map(task => this.renderCompactTask(task, task.category)).join('')}
                </div>
            </div>
        `;
    }

    renderCompactTask(task, category) {
        const color = this.getCategoryColor(category);
        const isSelected = this.selectedTask && this.selectedTask.id === task.id;
        const isChatActive = this.taskInHelpChat && this.taskInHelpChat.id === task.id;
        
        return `
            <div class="compact-task ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''}" 
                 data-task-id="${task.id}"
                 data-category="${category}">
                <div class="task-color-bar" style="background: ${color}"></div>
                ${task.completed ? '<div class="task-complete-gradient"></div>' : ''}
                <div class="task-content" onclick="tasksManager.toggleTaskCompletion(${task.id}, '${category}', '${this.activeView}')">
                    <span class="task-emoji">${task.emoji}</span>
                    <span class="task-label">${task.title}</span>
                </div>
                <div class="task-help-gradient ${isChatActive ? 'chat-active' : ''}" 
                     onclick="tasksManager.requestHelpForTask(${task.id}, '${category}', '${this.activeView}')">
                    <span class="help-icon">${isChatActive ? '💬' : '?'}</span>
                </div>
            </div>
        `;
    }

    renderTaskDetail() {
        if (!this.selectedTask) return '';
        
        const color = this.getCategoryColor(this.selectedTask.category);
        const categoryNames = {
            basics: 'Scratch Basics',
            sprites: 'Sprites & Movement',
            multimedia: 'Sounds & Events',
            assigned: 'Assigned Task',
            improvement: 'Improvement Goal'
        };
        
        return `
            <div class="task-detail-panel">
                <div class="detail-header">
                    <div class="detail-category" style="color: ${color}">
                        ${categoryNames[this.selectedTask.category] || 'Task'}
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
                        Click the **?** next to any task to open a help chat!
                    </div>
                </div>
            `;
        }

        const task = this.taskInHelpChat;
        const messagesHtml = this.chatMessages.map(msg => this.renderChatMessage(msg)).join('');

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

    renderChatMessage(message) {
        const time = message.time || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="help-message ${message.sender}">
                <div class="message-avatar">${message.sender === 'teacher' ? '👩‍🏫' : '🧑'}</div>
                <div class="message-bubble">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    }

    renderManagementPopup() {

        // Get connected users from the room
        const studentsList = Object.values(connectedUsers).map(user => ({
            email: user.email,
            name: user.name
        }));
        const selectedStudent = this.managementSelectedStudent || (studentsList.length > 0 ? studentsList[0].email : null);
        
        const studentTasks = this.getStudentTasks(selectedStudent);
        
        return `
            <div id="task-management-popup" class="task-popup hidden">
                <div class="popup-overlay" onclick="tasksManager.hideTaskManagementPopup()"></div>
                <div class="management-popup-content">
                    <h2>📋 Task Management</h2>
                    
                    <div class="management-main-layout">
                        <!-- Left side: Room tasks pool -->
                        <div class="room-tasks-pool">
                            <div class="pool-header">
                                <h3>🎓 Room Tasks</h3>
                                <p class="pool-subtitle">Drag tasks to assign to student</p>
                            </div>
                            <div class="pool-tasks-list">
                                ${this.roomTasks.map(task => this.renderManagementTask(task, task.category, true)).join('')}
                            </div>
                        </div>

                        <!-- Right side: Student tasks -->
                        <div class="student-tasks-section">
                            <div class="management-section">
                                <label class="management-label">Select Student</label>
                                <select class="student-select" onchange="tasksManager.selectStudent(this.value)">
                                    ${Object.values(connectedUsers).map(user => `
                                        <option value="${user.email}" ${user.email === selectedStudent ? 'selected' : ''}>
                                            ${user.name} (${user.email})
                                        </option>
                                    `).join('')}
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
                                    ${studentTasks.assigned.map(task => this.renderManagementTask(task, 'assigned', false)).join('')}
                                    ${studentTasks.assigned.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
                                </div>
                            </div>

                            <div class="management-section">
                                <div class="section-title">
                                    <h3>🎯 Stretch Goals</h3>
                                </div>
                                <div class="task-management-list dropzone" data-category="improvement"
                                     ondrop="tasksManager.handleDrop(event, 'improvement')" 
                                     ondragover="tasksManager.handleDragOver(event)"
                                     ondragleave="tasksManager.handleDragLeave(event)">
                                    ${studentTasks.improvement.map(task => this.renderManagementTask(task, 'improvement', false)).join('')}
                                    ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="management-actions">
                        <button class="save-btn" onclick="tasksManager.saveTaskChanges()">Save Changes</button>
                        <button class="cancel-btn" onclick="tasksManager.hideTaskManagementPopup()">Close</button>
                    </div>
                </div>
            </div>

            ${this.showingAddTaskForm ? this.renderAddTaskForm() : ''}
        `;
    }

    renderManagementTask(task, category, isDraggable) {
        const color = this.getCategoryColor(category);
        const draggableAttr = isDraggable ? 'draggable="true"' : '';
        
        return `
            <div class="management-task-item ${isDraggable ? 'draggable-task' : 'pool-task'}" 
                 ${draggableAttr}
                 data-task-id="${task.id}"
                 data-task-category="${category}"
                 data-task='${JSON.stringify(task).replace(/'/g, '&apos;')}'
                 ondragstart="tasksManager.handleDragStart(event)"
                 ondragend="tasksManager.handleDragEnd(event)">
                <div class="task-color-indicator" style="background: ${color}"></div>
                <span class="task-emoji">${task.emoji}</span>
                <span class="task-title">${task.title}</span>
                ${isDraggable ? '<button class="remove-task-btn" onclick="tasksManager.removeTaskFromStudent(event, ' + task.id + ')">×</button>' : ''}
            </div>
        `;
    }

    renderAddTaskForm() {
        return `
            <div class="add-task-overlay" onclick="tasksManager.hideAddTaskForm()">
                <div class="add-task-form" onclick="event.stopPropagation()">
                    <h3>Add New Task</h3>
                    <input type="text" id="new-task-title" class="task-input" placeholder="Task title" />
                    <input type="text" id="new-task-emoji" class="task-input" placeholder="Emoji (e.g., 🎯)" maxlength="2" />
                    <div class="form-actions">
                        <button class="save-btn" onclick="tasksManager.addNewTask()">Add Task</button>
                        <button class="cancel-btn" onclick="tasksManager.hideAddTaskForm()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Drag and Drop handlers
    handleDragStart(e) {
        const taskData = e.target.dataset.task;
        e.dataTransfer.setData('text/plain', taskData);
        e.dataTransfer.effectAllowed = 'copy';
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.dropzone').forEach(zone => {
            zone.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const dropzone = e.currentTarget;
        if (!dropzone.classList.contains('drag-over')) {
            dropzone.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const dropzone = e.currentTarget;
        if (!dropzone.contains(e.relatedTarget)) {
            dropzone.classList.remove('drag-over');
        }
    }

    handleDrop(e, targetCategory) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropzone = e.currentTarget;
        dropzone.classList.remove('drag-over');
        
        const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const studentTasks = this.getStudentTasks(this.managementSelectedStudent);
        
        const existsInCategory = targetCategory === 'assigned' 
            ? studentTasks.assigned.some(t => t.id === taskData.id)
            : studentTasks.improvement.some(t => t.id === taskData.id);
        
        if (existsInCategory) {
            this.showNotification('⚠️ Task already assigned to this category');
            return;
        }
        
        const newTask = { ...taskData, completed: false };
        
        if (targetCategory === 'assigned') {
            studentTasks.assigned.push(newTask);
        } else {
            studentTasks.improvement.push(newTask);
        }        this.selectStudent(this.managementSelectedStudent);
    }

    removeTaskFromStudent(e, taskId) {
        e.stopPropagation();
        
        if (!confirm('Remove this task from the student?')) {
            return;
        }

        const studentTasks = this.getStudentTasks(this.managementSelectedStudent);
        studentTasks.assigned = studentTasks.assigned.filter(t => t.id !== taskId);
        studentTasks.improvement = studentTasks.improvement.filter(t => t.id !== taskId);

        this.showNotification('🗑️ Task removed from student');
        this.render();
    }

    selectTaskForHelp(task) {
        this.taskInHelpChat = task;
        this.selectedTask = null;
        
        const initialMessage = this.getTaskDescription(task);
        this.chatMessages = [{
            sender: 'teacher',
            text: `Hi! I'm here to help you with the task: **${task.title}**. This is what you need to do: ${initialMessage}`,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }];

        this.render();
    }

    requestHelpForTask(taskId, category, view) {
        let task;
        if (view === 'room') {
            task = this.roomTasks.find(t => t.id === taskId);
        } else {
            const userTasks = this.getStudentTasks(sessionStorage.getItem('email'));
            const allUserTasks = [...userTasks.assigned, ...userTasks.improvement];
            task = allUserTasks.find(t => t.id === taskId);
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

    sendChatMessage(userMessage) {
        userMessage = userMessage.trim();
        if (userMessage === '' || !this.taskInHelpChat) return;

        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        this.chatMessages.push({ sender: 'student', text: userMessage, time });
        document.querySelector('.help-chat-input').value = '';
        this.render();

        setTimeout(() => {
            let response;
            const taskTitle = this.taskInHelpChat.title;
            if (userMessage.toLowerCase().includes('help')) {
                response = `I can provide a step-by-step guide for **${taskTitle}**. Which step are you on?`;
            } else if (userMessage.toLowerCase().includes('code')) {
                response = `To get started with **${taskTitle}**, you usually need to find the blocks in the ${this.taskInHelpChat.category} palette.`;
            } else {
                response = `I see you're working on: "${taskTitle}". Can you tell me exactly what you tried?`;
            }

            this.chatMessages.push({
                sender: 'teacher',
                text: response,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
            this.render();
        }, 1000);
    }

    handleChatInput(e, task) {
        if (e.key === 'Enter') {
            const inputEl = e.target;
            this.sendChatMessage(inputEl.value);
            e.preventDefault();
        }
    }

    toggleTaskCompletion(taskId, category, view) {
        let task;
        if (view === 'room') {
            task = this.roomTasks.find(t => t.id === taskId);
        } else {
            const userTasks = this.getStudentTasks(sessionStorage.getItem('email'));
            const allUserTasks = [...userTasks.assigned, ...userTasks.improvement];
            task = allUserTasks.find(t => t.id === taskId);
        }
        
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.showNotification(`🪙 50 Coins earned!`);
                this.animateTaskCompletion(taskId);
            }
            this.render();
        }
    }

    animateTaskCompletion(taskId) {
        setTimeout(() => {
            const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskEl) {
                taskEl.classList.add('completing');
                setTimeout(() => {
                    taskEl.classList.remove('completing');
                }, 600);
            }
        }, 0);
    }

    getStudentTasks(studentEmail) {
        if (!studentEmail) return this.defaultTasks; // Return default tasks if no email

        if (!this.studentTasks[studentEmail]) {
            // Initialize new student with default tasks
            this.studentTasks[studentEmail] = {
                assigned: JSON.parse(JSON.stringify(this.defaultTasks.assigned)),
                improvement: JSON.parse(JSON.stringify(this.defaultTasks.improvement))
            };
        }
        return this.studentTasks[studentEmail];
    }

    selectStudent(student) {
        this.managementSelectedStudent = student;
        // Find the task-management-popup and its content to refresh just this part
        const popup = document.getElementById('task-management-popup');
        if (popup) {
            const content = popup.querySelector('.management-main-layout');
            if (content) {
                const studentTasks = this.getStudentTasks(student);
                // Update the student tasks section without rerendering the whole popup
                const studentSection = content.querySelector('.student-tasks-section');
                if (studentSection) {
                    studentSection.innerHTML = `
                        <div class="management-section">
                            <label class="management-label">Select Student</label>
                            <select class="student-select" onchange="tasksManager.selectStudent(this.value)">
                                ${Object.values(connectedUsers).map(user => `
                                    <option value="${user.email}" ${user.email === student ? 'selected' : ''}>
                                        ${user.name} (${user.email})
                                    </option>
                                `).join('')}
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
                                ${studentTasks.assigned.map(task => this.renderManagementTask(task, 'assigned', false)).join('')}
                                ${studentTasks.assigned.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
                            </div>
                        </div>

                        <div class="management-section">
                            <div class="section-title">
                                <h3>🎯 Stretch Goals</h3>
                            </div>
                            <div class="task-management-list dropzone" data-category="improvement"
                                 ondrop="tasksManager.handleDrop(event, 'improvement')" 
                                 ondragover="tasksManager.handleDragOver(event)"
                                 ondragleave="tasksManager.handleDragLeave(event)">
                                ${studentTasks.improvement.map(task => this.renderManagementTask(task, 'improvement', false)).join('')}
                                ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
                            </div>
                        </div>
                    `;
                }
            }
        }
    }

    showAddTaskForm(category) {
        this.showingAddTaskForm = true;
        this.addTaskCategory = category;
        this.render();
    }

    hideAddTaskForm() {
        this.showingAddTaskForm = false;
        this.render();
    }

    addNewTask() {
        const title = document.getElementById('new-task-title').value.trim();
        const emoji = document.getElementById('new-task-emoji').value.trim() || '📝';
        
        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            emoji: emoji,
            completed: false
        };

        const studentTasks = this.getStudentTasks(this.managementSelectedStudent);
        if (this.addTaskCategory === 'assigned') {
            studentTasks.assigned.push(newTask);
        } else {
            studentTasks.improvement.push(newTask);
        }

        this.showNotification('✅ Task added successfully!');
        this.hideAddTaskForm();
    }

    saveTaskChanges() {
        this.showNotification('💾 Changes saved successfully!');
        this.hideTaskManagementPopup();
        // Refresh the main task view to show updated tasks
        this.render();
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
        return descriptions[task.id] || "Complete this task to progress in your learning journey. Check the resources!";
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
        if (view === 'room') {
            task = this.roomTasks.find(t => t.id === taskId);
        } else {
            const userTasks = this.getStudentTasks(sessionStorage.getItem('email'));
            task = [...userTasks.assigned, ...userTasks.improvement].find(t => t.id === taskId);
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
        if (['user', 'room'].includes(view) && this.activeView !== view) {
            this.activeView = view;
            this.selectedTask = null;
            this.render();
        }
    }

    showNotification(message) {
        return
        const notif = document.createElement('div');
        notif.className = 'task-notification show';
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    showTaskManagementPopup() {
        document.getElementById('task-management-popup')?.classList.remove('hidden');
    }

    hideTaskManagementPopup() {
        document.getElementById('task-management-popup')?.classList.add('hidden');
    }
}

// Initialize the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tasksManager = new TasksManager();
    });
} else {
    window.tasksManager = new TasksManager();
}