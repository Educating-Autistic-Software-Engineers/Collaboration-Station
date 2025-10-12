class TaskManager {
    constructor() {
        this.currentUser = 'Sajad';
        this.initializeTaskPanels();
    }

    initializeTaskPanels() {
        this.renderMyTasks();
        this.renderAllTasks();
    }

    renderMyTasks() {
        const myTasksPanel = document.querySelector('#my-tasks .task-list');
        const myTasks = projectData.tasks.filter(task => task.assignedTo === this.currentUser);
        
        if (myTasks.length === 0) {
            myTasksPanel.innerHTML = `
                <div class="no-tasks-message">
                    <p>You don't have any assigned tasks yet.</p>
                    <p>Check the "All Tasks" tab to find tasks you can take on!</p>
                </div>
            `;
        } else {
            const inProgressTasks = myTasks.filter(task => task.status === 'in_progress');
            const completedTasks = myTasks.filter(task => task.status === 'completed');
            const todoTasks = myTasks.filter(task => task.status === 'not_started');

            myTasksPanel.innerHTML = `
                ${this.createStatusSection('In Progress', inProgressTasks, true)}
                ${this.createStatusSection('To Do', todoTasks, true)}
                ${this.createStatusSection('Completed', completedTasks, true)}
            `;

            // Add event listeners for status change buttons
            myTasksPanel.querySelectorAll('.status-change-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                    const newStatus = e.target.dataset.status;
                    this.changeTaskStatus(taskId, newStatus);
                });
            });

            // Add event listeners to more buttons in My Tasks
            myTasksPanel.querySelectorAll('.more-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const taskItem = e.target.closest('.task-item');
                    const detailsContent = taskItem.querySelector('.task-details');
                    const isExpanded = detailsContent.style.display === 'block';
                    
                    detailsContent.style.display = isExpanded ? 'none' : 'block';
                    e.target.textContent = isExpanded ? 'More' : 'Less';
                    e.target.classList.toggle('expanded');
                });
            });
        }
    }

    renderAllTasks() {
        const allTasksPanel = document.querySelector('#all-tasks .task-list');
        const allTasks = projectData.tasks;
        
        const inProgressTasks = allTasks.filter(task => task.status === 'in_progress');
        const completedTasks = allTasks.filter(task => task.status === 'completed');
        const todoTasks = allTasks.filter(task => task.status === 'not_started');

        // Sort To Do tasks: unassigned first, then assigned
        const sortedTodoTasks = todoTasks.sort((a, b) => {
            if (!a.assignedTo && b.assignedTo) return -1;
            if (a.assignedTo && !b.assignedTo) return 1;
            return 0;
        });

        allTasksPanel.innerHTML = `
            ${this.createStatusSection('In Progress', inProgressTasks, false)}
            ${this.createStatusSection('To Do', sortedTodoTasks, false)}
            ${this.createStatusSection('Completed', completedTasks, true)}
        `;

        // Add event listeners to take task buttons
        allTasksPanel.querySelectorAll('.take-task-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.closest('.task-item').dataset.taskId);
                this.takeTask(taskId);
            });
        });

        // Add event listeners to more buttons
        allTasksPanel.querySelectorAll('.more-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                const detailsContent = taskItem.querySelector('.task-details');
                const isExpanded = detailsContent.style.display === 'block';
                
                detailsContent.style.display = isExpanded ? 'none' : 'block';
                e.target.textContent = isExpanded ? 'More' : 'Less';
                e.target.classList.toggle('expanded');
            });
        });
    }

    createStatusSection(title, tasks, isMyTasks = false) {
        if (tasks.length === 0) return '';
        
        const statusClass = title.toLowerCase().replace(' ', '-');
        return `
            <div class="status-section ${statusClass}-section">
                <h4>${title} (${tasks.length})</h4>
                <div class="status-tasks">
                    ${tasks.map(task => this.createTaskElement(task, isMyTasks)).join('')}
                </div>
            </div>
        `;
    }

    createTaskElement(task, isMyTasks = false) {
        // Show status change buttons only in My Tasks for user's own tasks
        const statusButtons = isMyTasks && task.assignedTo === this.currentUser ? this.getStatusChangeButtons(task) : '';
        
        // Show take task button only in All Tasks for unassigned tasks
        const takeTaskButton = !isMyTasks && !task.assignedTo ? `
            <button class="take-task-btn" data-task-id="${task.id}">
                Take Task
            </button>
        ` : '';

        // For My Tasks tab, always show details without More button
        if (isMyTasks) {
            return `
                <div class="task-item" data-task-id="${task.id}">
                    <div class="task-header">
                        <span class="task-title">${task.title}</span>
                    </div>
                    <div class="task-details">
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <div class="task-assignee">
                                ${task.assignedTo ? `
                                    <img src="images/icons/person.png" alt="${task.assignedTo}">
                                    <span>${task.assignedTo}</span>
                                ` : '<span>Unassigned</span>'}
                            </div>
                            <div class="task-required-interest">
                                <span>${task.requiredInterest}</span>
                            </div>
                        </div>
                        ${statusButtons}
                    </div>
                </div>
            `;
        }
        
        // For All Tasks tab, show More button and collapsible details
        return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-header">
                    <span class="task-title">${task.title}</span>
                    <button class="more-btn">More</button>
                </div>
                <div class="task-details" style="display: none;">
                    <div class="task-description">${task.description}</div>
                    <div class="task-meta">
                        <div class="task-assignee">
                            ${task.assignedTo ? `
                                <img src="images/icons/person.png" alt="${task.assignedTo}">
                                <span>${task.assignedTo}</span>
                            ` : '<span>Unassigned</span>'}
                        </div>
                        <div class="task-required-interest">
                            <span>${task.requiredInterest}</span>
                        </div>
                    </div>
                </div>
                ${takeTaskButton}
            </div>
        `;
    }

    getStatusChangeButtons(task) {
        if (task.status === 'not_started') {
            return `
                <button class="status-change-btn" data-status="in_progress">
                    Start Task
                </button>
            `;
        } else if (task.status === 'in_progress') {
            return `
                <button class="status-change-btn" data-status="completed">
                    Mark as Completed
                </button>
            `;
        }
        return '';
    }

    takeTask(taskId) {
        const task = projectData.tasks.find(t => t.id === taskId);
        if (task && !task.assignedTo) {
            task.assignedTo = this.currentUser;
            // Keep status as 'not_started' when taking a task
            this.initializeTaskPanels(); // Refresh both panels
        }
    }

    changeTaskStatus(taskId, newStatus) {
        const task = projectData.tasks.find(t => t.id === taskId);
        if (task && task.assignedTo === this.currentUser) {
            task.status = newStatus;
            this.initializeTaskPanels(); // Refresh both panels
        }
    }
}

// Initialize task manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
}); 