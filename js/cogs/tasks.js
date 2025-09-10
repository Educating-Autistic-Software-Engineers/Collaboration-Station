class TasksManager {
    constructor() {
        this.tasks = [
            {
                id: 1,
                title: "Meeting Setup & Preparation",
                icon: "🎯",
                category: "preparation",
                subtasks: [
                    { id: 101, text: "Test audio and video equipment", completed: false },
                    { id: 104, text: "Set up recording if needed", completed: false },
                    { id: 105, text: "Configure breakout rooms layout", completed: false }
                ]
            },
            {
                id: 2,
                title: "Collaborative Coding",
                icon: "✏️",
                category: "collaboration",
                subtasks: [
                    { id: 111, text: "Drag a block into the editor", completed: false },
                    { id: 112, text: "Modify a text box", completed: false },
                    { id: 113, text: "Run the code", completed: false },
                    { id: 114, text: "Debug an error", completed: false },
                ]
            },
            {
                id: 3,
                title: "Multiple Sprites",
                icon: "🐈",
                category: "collaboration",
                subtasks: [
                    { id: 201, text: "Add a new sprite", completed: false },
                    { id: 202, text: "Switch between sprites", completed: false },
                    { id: 203, text: "Edit sprite costumes", completed: false },
                    { id: 204, text: "Make other sprite talk", completed: false },
                    { id: 205, text: "Delete a sprite", completed: false },
                ]
            },
            {
                id: 4,
                title: "TA Wrap-Up",
                icon: "📝",
                category: "wrap-up",
                subtasks: [
                    { id: 301, text: "Share meeting notes and action items", completed: false },
                    { id: 302, text: "Distribute recording link", completed: false },
                    { id: 303, text: "Gather feedback from participants", completed: false },
                    { id: 304, text: "Make sure to end meeting", completed: false }
                ]
            }
        ];

        this.expandedTasks = new Set();
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const container = document.getElementById('tasks__container');
        if (!container) return;

        container.innerHTML = `
            <div class="tasks-header">
                <h3>📋 Task Management</h3>
                <div class="tasks-stats">
                    <span class="tasks-count">${this.getTotalTasks()} Tasks</span>
                    <span class="completed-count">${this.getCompletedTasks()} Completed</span>
                </div>
            </div>
            <div class="tasks-list">
                ${this.tasks.map(task => this.renderTask(task)).join('')}
            </div>
            <div class="tasks-actions">
                <button class="mark-all-complete-btn" onclick="tasksManager.markAllComplete()">
                    ✅ Mark All Complete
                </button>
                <button class="reset-tasks-btn" onclick="tasksManager.resetAllTasks()">
                    🔄 Reset Tasks
                </button>
            </div>
        `;
    }

    renderTask(task) {
        const isExpanded = this.expandedTasks.has(task.id);
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        const totalSubtasks = task.subtasks.length;
        const progressPercent = Math.round((completedSubtasks / totalSubtasks) * 100);

        return `
            <div class="task-card ${isExpanded ? 'expanded' : ''}" data-task-id="${task.id}">
                <div class="task-header" onclick="tasksManager.toggleTask(${task.id})">
                    <div class="task-info">
                        <div class="task-icon">${task.icon}</div>
                        <div class="task-details">
                            <h4 class="task-title">${task.title}</h4>
                            <div class="task-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <span class="progress-text">${completedSubtasks}/${totalSubtasks}</span>
                            </div>
                        </div>
                    </div>
                    <div class="expand-arrow ${isExpanded ? 'rotated' : ''}">▼</div>
                </div>
                <div class="task-subtasks ${isExpanded ? 'expanded' : ''}">
                    ${task.subtasks.map(subtask => this.renderSubtask(subtask, task.id)).join('')}
                </div>
            </div>
        `;
    }

    renderSubtask(subtask, taskId) {
        return `
            <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}">
                <label class="subtask-checkbox">
                    <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                           onchange="tasksManager.toggleSubtask(${taskId}, ${subtask.id})">
                    <span class="checkmark"></span>
                </label>
                <span class="subtask-text">${subtask.text}</span>
            </div>
        `;
    }

    toggleTask(taskId) {
        if (this.expandedTasks.has(taskId)) {
            this.expandedTasks.delete(taskId);
        } else {
            this.expandedTasks.add(taskId);
        }
        this.render();
    }

    toggleSubtask(taskId, subtaskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                subtask.completed = !subtask.completed;
                this.render();
                this.showNotification(subtask.completed ? 'Task completed! 🎉' : 'Task unchecked');
            }
        }
    }

    markAllComplete() {
        this.tasks.forEach(task => {
            task.subtasks.forEach(subtask => {
                subtask.completed = true;
            });
        });
        this.render();
        this.showNotification('All tasks completed! Excellent work! 🎊');
    }

    resetAllTasks() {
        this.tasks.forEach(task => {
            task.subtasks.forEach(subtask => {
                subtask.completed = false;
            });
        });
        this.expandedTasks.clear();
        this.render();
        this.showNotification('All tasks reset 🔄');
    }

    getTotalTasks() {
        return this.tasks.reduce((total, task) => total + task.subtasks.length, 0);
    }

    getCompletedTasks() {
        return this.tasks.reduce((total, task) => 
            total + task.subtasks.filter(st => st.completed).length, 0);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'task-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    bindEvents() {
        // console.log('Tasks Manager initialized with', this.tasks.length, 'task categories');
    }

    addCustomTask(title, icon, subtasks) {
        const newTask = {
            id: Date.now(),
            title,
            icon,
            category: 'custom',
            subtasks: subtasks.map((text, index) => ({
                id: Date.now() + index,
                text,
                completed: false
            }))
        };
        this.tasks.push(newTask);
        this.render();
    }
}

let tasksManager;
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        tasksManager = new TasksManager();
    }, 500);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!tasksManager) {
                tasksManager = new TasksManager();
            }
        }, 500);
    });
} else {
    setTimeout(() => {
        if (!tasksManager) {
            tasksManager = new TasksManager();
        }
    }, 500);
}