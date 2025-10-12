document.addEventListener('DOMContentLoaded', () => {
    const navButtons = {
        communication: document.getElementById('communication__button'),
        members: document.getElementById('members__button'),
        videos: document.getElementById('videos__button'),
        aiChat: document.getElementById('ai-chat__button'),
        taskManagement: document.getElementById('task-management__button')
    };

    const containers = {
        communication: document.getElementById('communication__container'),
        members: document.getElementById('members__container'),
        videos: document.getElementById('tutorials__container'),
        aiChat: document.getElementById('ai-chat-container'),
        taskManagement: document.getElementById('task-management__container')
    };

    // Task Management Tab Switching
    const taskTabs = document.querySelectorAll('.task-tab');
    const taskPanels = document.querySelectorAll('.task-panel');

    taskTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and panels
            taskTabs.forEach(t => t.classList.remove('active'));
            taskPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab and corresponding panel
            tab.classList.add('active');
            const panelId = tab.getAttribute('data-tab');
            document.getElementById(panelId).classList.add('active');
        });
    });

    // Function to hide all containers
    function hideAllContainers() {
        Object.values(containers).forEach(container => {
            if (container) {
                container.classList.remove('active');
                container.style.display = 'none';
            }
        });
    }

    // Function to deactivate all buttons
    function deactivateAllButtons() {
        Object.values(navButtons).forEach(button => {
            if (button) {
                button.classList.remove('active');
            }
        });
    }

    // Initialize - ensure no buttons or containers are active
    hideAllContainers();
    deactivateAllButtons();

    // Function to handle button click
    function handleButtonClick(buttonId) {
        const button = navButtons[buttonId];
        const container = containers[buttonId];

        if (!button || !container) return;

        // If the clicked button is already active, deactivate it and hide its container
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            container.classList.remove('active');
            container.style.display = 'none';
            
            // Reset main stream container
            const mainStreamContainer = document.getElementById('main-stream-container');
            if (mainStreamContainer) {
                mainStreamContainer.style.width = 'calc(100% - 72px)';
                mainStreamContainer.style.marginRight = '72px';
            }
            return;
        }

        // Deactivate all buttons and hide all containers
        deactivateAllButtons();
        hideAllContainers();

        // Activate the clicked button and show its container
        button.classList.add('active');
        container.classList.add('active');
        container.style.display = 'block';

        // Adjust main stream container
        const mainStreamContainer = document.getElementById('main-stream-container');
        if (mainStreamContainer) {
            mainStreamContainer.style.width = 'calc(100% - 372px)';
            mainStreamContainer.style.marginRight = '372px';
        }
    }

    // Add click event listeners to all buttons
    Object.keys(navButtons).forEach(buttonId => {
        const button = navButtons[buttonId];
        if (button) {
            button.addEventListener('click', () => handleButtonClick(buttonId));
        }
    });

    // Initialize the main stream container
    const mainStreamContainer = document.getElementById('main-stream-container');
    if (mainStreamContainer) {
        mainStreamContainer.style.width = 'calc(100% - 72px)';
        mainStreamContainer.style.marginRight = '72px';
    }
}); 