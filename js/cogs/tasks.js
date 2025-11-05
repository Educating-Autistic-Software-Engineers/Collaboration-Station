window.tasksManager;

class TasksManager {
    constructor() {
        this.roomTasks = [
            { id: 1, title: "Drag a block into the editor", category: "coding", emoji: "🖱️", completed: false },
            { id: 2, title: "Connect blocks together", category: "coding", emoji: "🔗", completed: false },
            { id: 3, title: "Run your first program", category: "coding", emoji: "▶️", completed: false },
            { id: 4, title: "Add a new sprite", category: "art", emoji: "🐱", completed: false },
            { id: 5, title: "Make a sprite move", category: "coding", emoji: "🏃", completed: false },
            { id: 6, title: "Change sprite costumes", category: "art", emoji: "�", completed: false },
            { id: 7, title: "Add sounds to your project", category: "music", emoji: "🎵", completed: false },
            { id: 8, title: "Use keyboard events", category: "coding", emoji: "⌨️", completed: false }
        ];

        // Store tasks per student using their email as the key
        this.studentTasks = {};

        // Template for new student tasks (empty by default)
        this.defaultTasks = {
            assigned: [],
            improvement: []
        };

        this.activeView = 'user'; 
        this.selectedTask = null;
        this.taskInHelpChat = null;
        this.chatMessages = [];
        this.isTeachingAssistant = true;
        this.managementSelectedStudent = null;
        this.init();
    }

    init() {
        // wait for users to populate from ably :0
        window.messagingReady.then(() => {
            setTimeout(() => {
                // Initialize the selected student as soon as users are available
                if (!this.managementSelectedStudent && Object.keys(connectedUsers).length > 0) {
                    this.managementSelectedStudent = Object.keys(connectedUsers)[0];
                }
                this.render();
            }, 100);
        });
    }

    getCategoryColor(category) {
        const colors = {
            art: '#FF69B4',
            coding: '#4CAF50',
            music: '#9C27B0',
            other: '#FF9800',
            assigned: '#2196F3',
            improvement: '#00BCD4'
        };
        return colors[category] || '#666';
    }

    render() {
        const container = document.getElementById('tasks__container');
        if (!container) return;

        container.innerHTML = `
            <div class="main-task-area">
                ${this.isTeachingAssistant ? `
                    <div class="tasks-view-toggle">
                        <div class="toggle-btn-container">
                            <button class="toggle-btn manage-btn" 
                                    onclick="tasksManager.showTaskManagementPopup()"
                                    style="width: 100%;">
                                ⚙️ Manage Tasks
                            </button>
                        </div>
                    </div>
                ` : ''}

                <div class="tasks-content">
                    ${this.renderUserTasks()}
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
                        Click the "?" next to any task to open a help chat!
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
                ${message.sender === 'teacher' ? '<div class="message-avatar">👩‍🏫</div>' : ''}
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
                                ${this.roomTasks.map(task => this.renderManagementTask(task, task.category, true)).join('')}
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
                                    <option value="art">🎨 Art</option>
                                    <option value="coding">� Coding</option>
                                    <option value="music">🎵 Music</option>
                                    <option value="other">� Other</option>
                                </select>
                                <button class="add-task-submit-btn" onclick="tasksManager.addNewRoomTask()">Add Task</button>
                            </div>
                        </div>

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
                                    ${studentTasks.assigned.map(task => this.renderManagementTask(task, 'assigned', true)).join('')}
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
                                    ${studentTasks.improvement.map(task => this.renderManagementTask(task, 'improvement', true)).join('')}
                                    ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
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

    renderProgressStats(studentTasks) {
        const assignedTotal = studentTasks.assigned.length;
        const assignedCompleted = studentTasks.assigned.filter(t => t.completed).length;
        const improvementTotal = studentTasks.improvement.length;
        const improvementCompleted = studentTasks.improvement.filter(t => t.completed).length;
        // Only count Today's Goals for the progress bar
        const percentage = assignedTotal > 0 ? Math.round((assignedCompleted / assignedTotal) * 100) : 0;
        
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
                        <span class="stat-label">🎯 Stretch Goals</span>
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
        const draggableAttr = isDraggable ? 'draggable="true"' : '';
        
        // Get list of users assigned to this task
        // Only show for room pool tasks
        let assignedUsers = [];
        const isRoomPoolTask = ['art', 'coding', 'music', 'other'].includes(category);
        if (isRoomPoolTask) {
            assignedUsers = this.getUsersAssignedToTask(task.id);
        }
        
        return `
            <div class="management-task-item ${isDraggable ? 'draggable-task' : 'pool-task'} ${task.completed ? 'completed' : ''}" 
                 ${draggableAttr}
                 data-task-id="${task.id}"
                 data-task-category="${category}"
                 data-task='${JSON.stringify(task).replace(/'/g, '&apos;')}'
                 ondragstart="tasksManager.handleDragStart(event)"
                 ondragend="tasksManager.handleDragEnd(event)"
                 onclick="tasksManager.toggleTaskInManagement(${task.id}, '${category}')">
                <div class="task-color-indicator" style="background: ${color}"></div>
                <span class="task-emoji">${task.emoji}</span>
                <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
                ${task.completed ? '<span class="task-complete-check">✓</span>' : ''}
                ${assignedUsers.length > 0 ? `
                    <div class="task-assigned-users">
                        ${assignedUsers.slice(0, 3).map(user => `
                            <span class="user-indicator" title="${user.name}">
                                ${user.name.charAt(0).toUpperCase()}
                            </span>
                        `).join('')}
                        ${assignedUsers.length > 3 ? `<span class="user-indicator more">+${assignedUsers.length - 3}</span>` : ''}
                    </div>
                ` : ''}
                ${isRoomPoolTask && task.category === 'other' ? `
                    <button class="delete-room-task-btn" onclick="event.stopPropagation(); tasksManager.deleteRoomTask(event, ${task.id})" title="Delete from room">🗑️</button>
                ` : ''}
            </div>
        `;
    }

    // Drag and Drop handlers
    handleDragStart(e) {
        const taskData = e.target.dataset.task;
        const taskCategory = e.target.dataset.taskCategory;
        e.dataTransfer.setData('text/plain', taskData);
        e.dataTransfer.setData('source-category', taskCategory);
        e.dataTransfer.effectAllowed = 'copyMove';
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
        const dropzone = e.currentTarget;
        const targetCategory = dropzone.dataset.category;
        
        // Determine drop effect based on target
        if (targetCategory === 'room') {
            e.dataTransfer.dropEffect = 'move';
        } else {
            e.dataTransfer.dropEffect = 'copy';
        }
        
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

    handleDropToRoom(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropzone = e.currentTarget;
        dropzone.classList.remove('drag-over');
        
        const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
        const sourceCategory = e.dataTransfer.getData('source-category');
        const studentEmail = this.managementSelectedStudent;
        
        console.log('Dropping back to room:', taskData.title, 'from:', sourceCategory, 'for student:', studentEmail);
        
        // Only allow dropping back if it came from a student's tasks
        if (sourceCategory === 'assigned' || sourceCategory === 'improvement') {
            const studentTasks = this.getStudentTasks(studentEmail);
            studentTasks.assigned = studentTasks.assigned.filter(t => t.id !== taskData.id);
            studentTasks.improvement = studentTasks.improvement.filter(t => t.id !== taskData.id);
            
            // Save the updated tasks back to the main store
            this.studentTasks[studentEmail] = studentTasks;
            
            this.selectStudent(studentEmail);
            
            // Only refresh main view if popup is closed
            if (this.activeView === 'user' && sessionStorage.getItem('email') === studentEmail) {
                const popup = document.getElementById('task-management-popup');
                if (!popup || popup.classList.contains('hidden')) {
                    setTimeout(() => this.render(), 100);
                }
            }
        }
    }

    handleDrop(e, targetCategory) {

        e.preventDefault();
        e.stopPropagation();
        
        const dropzone = e.currentTarget;
        dropzone.classList.remove('drag-over');
        
        const taskData = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        const studentEmail = this.managementSelectedStudent;
        const studentTasks = this.getStudentTasks(studentEmail);
        
        const existsInCategory = targetCategory === 'assigned' 
            ? studentTasks.assigned.some(t => t.id === taskData.id)
            : studentTasks.improvement.some(t => t.id === taskData.id);
        
        if (existsInCategory) {
            return;
        }
        
        const newTask = { ...taskData, completed: false };
        
        if (targetCategory === 'assigned') {
            studentTasks.assigned.push(newTask);
        } else {
            studentTasks.improvement.push(newTask);
        }

        this.studentTasks[studentEmail] = studentTasks;
        
        this.selectStudent(this.managementSelectedStudent);
        
        // Only render if the user view is active and it's the current user's tasks
        // Don't render during drag operations in the management popup
        if (this.activeView === 'user' && sessionStorage.getItem('email') === this.managementSelectedStudent) {
            const popup = document.getElementById('task-management-popup');
            if (!popup || popup.classList.contains('hidden')) {
                setTimeout(() => this.render(), 100);
            }
        }
    }

    removeTaskFromStudent(e, taskId) {
        e.stopPropagation();
        
        const studentTasks = this.getStudentTasks(this.managementSelectedStudent);
        const removedTask = [...studentTasks.assigned, ...studentTasks.improvement].find(t => t.id === taskId);
        
        studentTasks.assigned = studentTasks.assigned.filter(t => t.id !== taskId);
        studentTasks.improvement = studentTasks.improvement.filter(t => t.id !== taskId);
        
        // Refresh the student section only
        this.selectStudent(this.managementSelectedStudent);
        
        // Also refresh the main view if it's showing user tasks
        if (this.activeView === 'user' && sessionStorage.getItem('email') === this.managementSelectedStudent) {
            setTimeout(() => this.render(), 100);
        }
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
        
        // Auto-scroll to bottom after rendering
        setTimeout(() => {
            const messagesContainer = document.querySelector('.help-chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 50);

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
            
            // Auto-scroll to bottom after teacher response
            setTimeout(() => {
                const messagesContainer = document.querySelector('.help-chat-messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 50);
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
            
            // Also sync with room task if it exists
            if (task) {
                const roomTask = this.roomTasks.find(t => t.id === taskId);
                if (roomTask) {
                    roomTask.completed = !task.completed;
                }
            }
        }
        
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.animateTaskCompletion(taskId);
            }
            this.render();
            
            // Refresh the management popup if it's open
            const popup = document.getElementById('task-management-popup');
            if (popup && !popup.classList.contains('hidden')) {
                this.selectStudent(this.managementSelectedStudent);
            }
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

    toggleTaskInManagement(taskId, category) {
        // Don't toggle if currently dragging
        if (event && event.target.closest('.dragging')) {
            return;
        }
        
        // Find the task in the student's tasks
        const studentEmail = this.managementSelectedStudent;
        const studentTasks = this.getStudentTasks(studentEmail);
        
        let task = null;
        if (category === 'assigned') {
            task = studentTasks.assigned.find(t => t.id === taskId);
        } else if (category === 'improvement') {
            task = studentTasks.improvement.find(t => t.id === taskId);
        } else {
            // It's a room task
            task = this.roomTasks.find(t => t.id === taskId);
        }
        
        if (task) {
            task.completed = !task.completed;
            
            // Refresh the popup to show updated state
            this.selectStudent(studentEmail);
            
            // Also refresh main view if it's the current user
            if (this.activeView === 'user' && sessionStorage.getItem('email') === studentEmail) {
                const popup = document.getElementById('task-management-popup');
                if (!popup || popup.classList.contains('hidden')) {
                    this.render();
                }
            }
        }
    }

    getStudentTasks(studentEmail) {
        if (!studentEmail) {
            // Return a copy of default tasks if no email, but don't store it
            return {
                assigned: JSON.parse(JSON.stringify(this.defaultTasks.assigned)),
                improvement: JSON.parse(JSON.stringify(this.defaultTasks.improvement))
            };
        }

        if (!this.studentTasks[studentEmail]) {
            // Initialize new student with default tasks and SAVE IT
            this.studentTasks[studentEmail] = {
                assigned: JSON.parse(JSON.stringify(this.defaultTasks.assigned)),
                improvement: JSON.parse(JSON.stringify(this.defaultTasks.improvement))
            };
        }
        
        // Return the reference to the stored object so modifications persist
        return this.studentTasks[studentEmail];
    }

    selectStudent(student) {
        this.managementSelectedStudent = student;
        // Find the task-management-popup and its content to refresh just this part
        const popup = document.getElementById('task-management-popup');
        if (popup && !popup.classList.contains('hidden')) {
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
                                ${studentTasks.assigned.map(task => this.renderManagementTask(task, 'assigned', true)).join('')}
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
                                ${studentTasks.improvement.map(task => this.renderManagementTask(task, 'improvement', true)).join('')}
                                ${studentTasks.improvement.length === 0 ? '<div class="empty-state">Drag tasks here</div>' : ''}
                            </div>
                        </div>
                        
                        ${this.renderProgressStats(studentTasks)}
                    `;
                    
                }
                
                // Refresh the room tasks pool to update user indicators
                const poolList = content.querySelector('.pool-tasks-list');
                if (poolList) {
                    poolList.innerHTML = this.roomTasks.map(task => this.renderManagementTask(task, task.category, true)).join('');
                }
            }
        }
    }

    selectEmoji(emoji) {
        document.getElementById('new-room-task-emoji').value = emoji;
        
        // Update active state on buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }

    addNewRoomTask() {
        const title = document.getElementById('new-room-task-title').value.trim();
        const emoji = document.getElementById('new-room-task-emoji').value || '📝';
        const category = document.getElementById('new-room-task-category').value;
        
        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            emoji: emoji,
            category: category,
            completed: false
        };

        this.roomTasks.push(newTask);
        
        // Clear the form
        document.getElementById('new-room-task-title').value = '';
        document.getElementById('new-room-task-emoji').value = '📝';
        document.getElementById('new-room-task-category').value = 'art';
        document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('active'));
        
        // Refresh the popup to show the new task
        this.selectStudent(this.managementSelectedStudent);
    }

    deleteRoomTask(e, taskId) {
        e.stopPropagation();
        
        if (!confirm('Delete this task from the room? It will be removed from all students.')) {
            return;
        }

        // Remove from room tasks
        this.roomTasks = this.roomTasks.filter(t => t.id !== taskId);
        
        // Remove from all students
        Object.keys(this.studentTasks).forEach(email => {
            const studentTasks = this.studentTasks[email];
            studentTasks.assigned = studentTasks.assigned.filter(t => t.id !== taskId);
            studentTasks.improvement = studentTasks.improvement.filter(t => t.id !== taskId);
        });

        this.selectStudent(this.managementSelectedStudent);
    }

    getUsersAssignedToTask(taskId) {
        const users = [];
        const connectedUsersArray = Object.values(connectedUsers);
        
        console.log('Getting users for task', taskId, 'from connected users:', connectedUsersArray.length);
        
        connectedUsersArray.forEach(user => {
            const studentTasks = this.getStudentTasks(user.email);
            const hasTask = [...studentTasks.assigned, ...studentTasks.improvement]
                .some(t => t.id === taskId);
            
            if (hasTask) {
                console.log('User', user.name, 'has task', taskId);
                users.push(user);
            }
        });
        
        console.log('Total users with task', taskId, ':', users.length);
        return users;
    }

    saveTaskChanges() {
        this.hideTaskManagementPopup();
        // Refresh the main task view to show updated tasks for current user
        if (this.activeView === 'user') {
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
        // Ensure we have a selected student before showing the popup
        if (!this.managementSelectedStudent && Object.keys(connectedUsers).length > 0) {
            this.managementSelectedStudent = Object.keys(connectedUsers)[0];
        }
        document.getElementById('task-management-popup')?.classList.remove('hidden');
    }

    hideTaskManagementPopup() {
        document.getElementById('task-management-popup')?.classList.add('hidden');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tasksManager = new TasksManager();
    });
} else {
    window.tasksManager = new TasksManager();
}