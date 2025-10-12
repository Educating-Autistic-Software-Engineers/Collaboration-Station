class ChatInterface {
    constructor(containerId) {
        console.log('Initializing ChatInterface with containerId:', containerId);
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container element not found:', containerId);
            return;
        }
        console.log('Container found:', this.container);
        this.messages = this.loadMessages();
        this.init();
    }

    init() {
        console.log('Initializing chat UI');
        this.createChatUI();
        this.addEventListeners();
        
        // Add initial project description if no messages exist
        if (this.messages.length === 0) {
            const projectDescription = {
                role: 'system',
                content: `Project Description:
Your group will build a simple Obstacle Dodger game using block-based coding. The player controls a character that moves left and right to avoid falling obstacles. The goal is to survive as long as possible while the game gets faster or harder over time.

The game must include:
- A player character controlled by left/right arrow keys
- Falling obstacles that reset when they reach the bottom
- A score that increases over time or when the player avoids obstacles
- A game over screen when the player touches an obstacle
- Sound effects or simple animations for feedback

You will:
- Build the game logic using block coding
- Design the sprites and background
- Test the game and fix any bugs
- Present the game and explain what each member contributed

Work as a team. All code and design must be your own. Submit and present the game through the Collaboration Station.`
            };
            this.messages.push(projectDescription);
            this.saveMessages();
        }
        
        // Only display non-system messages
        this.displayStoredMessages();
    }

    loadMessages() {
        const storedMessages = localStorage.getItem('aiChatMessages');
        return storedMessages ? JSON.parse(storedMessages) : [];
    }

    saveMessages() {
        localStorage.setItem('aiChatMessages', JSON.stringify(this.messages));
    }

    displayStoredMessages() {
        const messagesContainer = this.container.querySelector('#chat-messages');
        messagesContainer.innerHTML = ''; // Clear existing messages
        this.messages.forEach(msg => {
            // Only display user and assistant messages, not system messages
            if (msg.role !== 'system') {
                this.addMessageToUI(msg.role, msg.content);
            }
        });
    }

    createChatUI() {
        this.container.innerHTML = `
            <div class="chat-container">
                <div class="chat-header">
                    <span>AI Assistant</span>
                    <button id="clear-chat" class="clear-chat-btn">Clear Chat</button>
                </div>
                <div class="ai-chat-messages" id="chat-messages"></div>
                <div class="chat-actions">
                    <button class="action-btn" title="Save Chat">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="action-btn" title="Share Chat">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="action-btn" title="Export Chat">
                        <i class="fas fa-file-export"></i>
                    </button>
                </div>
                <div class="chat-input-container">
                    <textarea id="chat-input" placeholder="Type your message..."></textarea>
                    <button id="send-button">Send</button>
                </div>
            </div>
        `;
        console.log('Chat UI created');
    }

    addEventListeners() {
        const sendButton = this.container.querySelector('#send-button');
        const chatInput = this.container.querySelector('#chat-input');
        const clearButton = this.container.querySelector('#clear-chat');

        sendButton.addEventListener('click', () => this.handleSendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        clearButton.addEventListener('click', () => {
            this.messages = [];
            this.saveMessages();
            this.displayStoredMessages();
        });
        
        console.log('Event listeners added');
    }

    addMessageToUI(role, content, buttons = []) {
        const messagesContainer = this.container.querySelector('#chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Parse markdown content
        const formattedContent = marked.parse(content);
        messageDiv.innerHTML = formattedContent;
        
        // Add specific styling for markdown elements
        messageDiv.querySelectorAll('code').forEach(code => {
            code.className = 'inline-code';
        });
        
        messageDiv.querySelectorAll('pre').forEach(pre => {
            pre.className = 'code-block';
            const code = pre.querySelector('code');
            if (code) {
                code.className = 'block-code';
            }
        });

        // Add buttons if they exist
        if (buttons && buttons.length > 0) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'message-buttons';
            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'message-button';
                btn.textContent = button.name;
                btn.title = button.description;
                btn.onclick = () => this.handleButtonClick(button);
                buttonContainer.appendChild(btn);
            });
            messageDiv.appendChild(buttonContainer);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    handleButtonClick(button) {
        this.handleSendMessage(button.name);
    }

    async handleSendMessage(message = null) {
        const chatInput = this.container.querySelector('#chat-input');
        const messageText = message || chatInput.value.trim();
        
        if (!messageText) return;

        this.addMessageToUI('user', messageText);
        if (!message) chatInput.value = '';

        this.showTypingIndicator();

        try {
            this.messages.push({ role: 'user', content: messageText });
            this.saveMessages();

            const response = await window.aiService.chatCompletion(this.messages);

            this.hideTypingIndicator();

            this.messages.push(response);
            this.saveMessages();

            this.addMessageToUI('ai', response.content, response.buttons);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.hideTypingIndicator();
            this.addMessageToUI('ai', 'Sorry, there was an error processing your request.');
        }
    }

    showTypingIndicator() {
        const messagesContainer = this.container.querySelector('#chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = this.container.querySelector('#typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Make it available globally
window.ChatInterface = ChatInterface; 