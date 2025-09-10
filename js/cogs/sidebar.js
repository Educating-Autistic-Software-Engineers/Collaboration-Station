class CollapsibleRightBar {
    constructor() {
        this.rightBar = document.getElementById('right_bar');
        this.mainStream = document.getElementById('main-stream');
        this.collapseToggle = this.rightBar.querySelector('.collapse-toggle');
        this.slider = document.getElementById('slider');
        this.resizeHandle = document.getElementById('resize-handle');
        this.streamContainer = document.getElementById('stream__container');
        this.messagesContainer = document.getElementById('messages__container');
        
        this.isCollapsed = false;
        this.isDragging = false;
        this.isResizing = false;
        this.initialWidth = 303;
        this.currentWidth = this.initialWidth;
        
        this.activeContainer = null;
        this.containerRect = null;
        
        this.init();
    }
    
    init() {
        // Remove initializing class after a brief delay
        setTimeout(() => {
            this.rightBar.classList.remove('initializing');
        }, 100);
        
        this.setupEventListeners();
        this.updateContainerRect();
        this.setupNavigation();
        this.setupSlider();
        this.setupResize();
        
        // Set initial state
        this.showContainer('stream');
    }
    
    setupEventListeners() {
        this.collapseToggle.addEventListener('click', () => this.toggleCollapse());
        
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.adjustLayout();
        });
        
        // Prevent transitions during window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            this.rightBar.classList.add('initializing');
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.rightBar.classList.remove('initializing');
            }, 100);
        });
    }
    
    setupNavigation() {
        const navButtons = this.rightBar.querySelectorAll('.nav-button');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                if (this.isCollapsed) {
                    this.toggleCollapse();
                }
                
                const buttonId = button.id;
                let containerType = '';
                
                if (buttonId === 'chat__button') {
                    containerType = 'chat';
                } else if (buttonId === 'members__button') {
                    containerType = 'members';
                } else if (buttonId === 'tasks__button') {
                    containerType = 'tasks';
                }
                
                this.showContainer(containerType);
                
                // Update active state
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    
    setupSlider() {
        this.slider.addEventListener('mousedown', (e) => {
            if (this.isCollapsed) return;
            this.isDragging = true;
            this.slider.classList.add('dragging');
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging || this.isCollapsed) return;
            this.moveSlider(e);
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.slider.classList.remove('dragging');
            }
        });
    }
    
    setupResize() {
        this.resizeHandle.addEventListener('mousedown', (e) => {
            if (this.isCollapsed) return;

            this.isResizing = true;
            this.resizeHandle.classList.add('active');
            this.initialX = e.clientX;
            this.initialWidth = this.currentWidth;
            e.preventDefault();

            this.addShield(); // <--- activate shield
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing || this.isCollapsed) return;
            this.performResize(e);
        });

        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.resizeHandle.classList.remove('active');
                this.removeShield(); // <--- remove shield
            }
        });

        // Double-click to reset width
        this.resizeHandle.addEventListener('dblclick', () => {
            this.resetWidth();
        });
    }

    addShield() {
        if (this.shield) return;
        this.shield = document.createElement('div');
        Object.assign(this.shield.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '999999',
            cursor: 'col-resize',
            background: 'transparent'
        });
        document.body.appendChild(this.shield);
    }

    removeShield() {
        if (this.shield) {
            this.shield.remove();
            this.shield = null;
        }
    }
    
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        this.rightBar.classList.toggle('collapsed', this.isCollapsed);
        this.adjustLayout();
        
        if (this.isCollapsed) {
            this.hideAllContainers();
        } else {
            // Show the stream container by default when expanding
            this.showContainer('stream');
        }
    }
    
    showContainer(type) {
        if (this.isCollapsed) return;
    
        this.hideAllContainers();
        this.activeContainer = type;
    
        const streamContainer = document.getElementById('stream__container');
        
        switch(type) {
            case 'chat':
                this.messagesContainer.classList.add('active');
                if (streamContainer) {
                    streamContainer.style.display = '';
                }
                break;
            case 'members':
                document.getElementById('members__container').classList.add('active');
                if (streamContainer) {
                    streamContainer.style.display = 'none';
                }
                break;
            case 'tasks':
                document.getElementById('tasks__container').classList.add('active');
                if (streamContainer) {
                    streamContainer.style.display = 'none';
                }
                break;
            case 'stream':
            default:
                if (streamContainer) {
                    streamContainer.style.display = '';
                }
                break;
        }
    
        this.adjustSliderVisibility();
    }
    
    hideAllContainers() {
        this.messagesContainer.classList.remove('active');
        document.getElementById('members__container').classList.remove('active');
        document.getElementById('tasks__container').classList.remove('active');
    }
    
    adjustSliderVisibility() {
        if (this.activeContainer === 'chat' && !this.isCollapsed) {
            this.slider.classList.add('visible');
            this.setupChatLayout();
        } else {
            this.slider.classList.remove('visible');
        }
    }
    
    setupChatLayout() {
        // Set initial positions for chat layout
        setTimeout(() => {
            if (this.activeContainer === 'chat' && !this.isCollapsed) {
                const navHeight = this.rightBar.querySelector('#nav__links').offsetHeight;
                const availableHeight = this.containerRect.height - navHeight;
                const midPoint = navHeight + (availableHeight * 0.5);
                this.setSliderPosition(midPoint);
            }
        }, 100);
    }
    
    moveSlider(event) {
        if (this.isCollapsed || this.activeContainer !== 'chat') return;
        
        this.updateContainerRect();
        const navHeight = this.rightBar.querySelector('#nav__links').offsetHeight;
        let offsetY = event.clientY - this.containerRect.top;
        
        // Constrain slider position relative to nav height
        const minOffset = navHeight + 50; // Minimum space below nav
        const maxOffset = this.containerRect.height - 100; // Leave space for message form
        
        offsetY = Math.max(minOffset, Math.min(maxOffset, offsetY));
        this.setSliderPosition(offsetY);
    }
    
    setSliderPosition(offsetY) {
        if (this.activeContainer !== 'chat') return;
        
        const navHeight = this.rightBar.querySelector('#nav__links').offsetHeight;
        const streamHeight = offsetY - navHeight;
        const messageHeight = this.containerRect.height - offsetY - 70; // Account for form height
        
        this.streamContainer.style.height = streamHeight + 'px';
        this.messagesContainer.style.height = messageHeight + 'px';
        
        // Position slider relative to its container
        this.slider.style.position = 'relative';
        this.slider.style.top = '0px';
        this.slider.style.margin = '0';
    }
    
    performResize(event) {
        const deltaX = this.initialX - event.clientX;
        const newWidth = Math.max(60, Math.min(600, this.initialWidth + deltaX));
        
        this.setWidth(newWidth);
    }
    
    setWidth(width) {
        this.currentWidth = width;
        this.rightBar.style.width = width + 'px';
        this.mainStream.style.width = `calc(100% - ${width}px)`;
        this.updateContainerRect();
    }
    
    resetWidth() {
        this.setWidth(this.initialWidth);
    }
    
    updateContainerRect() {
        this.containerRect = this.rightBar.getBoundingClientRect();
    }
    
    adjustLayout() {
        if (this.isCollapsed) {
            this.mainStream.style.width = 'calc(100% - 60px)';
        } else {
            this.mainStream.style.width = `calc(100% - ${this.currentWidth}px)`;
        }
        this.updateContainerRect();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CollapsibleRightBar();
});



document.getElementById('message__form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="message"]');
    if (input.value.trim()) {
        // Add message to chat (you would implement actual messaging here)
        console.log('Message sent:', input.value);
        input.value = '';
    }
});