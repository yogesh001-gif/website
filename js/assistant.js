class MedicalAssistant {
    constructor() {
        this.messageHistory = [];
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        // Create assistant UI
        const assistantHTML = `
            <div id="medical-assistant" class="medical-assistant">
                <div class="assistant-header">
                    <img src="images/yogii-logo.svg" alt="Yogii AI" class="assistant-icon">
                    <h3>Yogii</h3>
                    <button class="minimize-btn" id="minimize-assistant">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                <div class="chat-container">
                    <div id="chat-messages" class="chat-messages">
                        <div class="assistant-message">
                            Hello! I'm Yogii, your medical assistant. I can help you with:
                            <ul>
                                <li>Finding appropriate medicines</li>
                                <li>Understanding treatment options</li>
                                <li>Identifying common symptoms</li>
                                <li>General health queries</li>
                            </ul>
                            How can I assist you today?
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="user-input" placeholder="Type your health query here...">
                        <button id="send-message">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
            <button id="toggle-assistant" class="toggle-assistant">
                <i class="fas fa-comment-medical"></i>
            </button>
        `;
        document.body.insertAdjacentHTML('beforeend', assistantHTML);
    }

    attachEventListeners() {
        const toggleBtn = document.getElementById('toggle-assistant');
        const minimizeBtn = document.getElementById('minimize-assistant');
        const assistant = document.getElementById('medical-assistant');
        const sendBtn = document.getElementById('send-message');
        const userInput = document.getElementById('user-input');

        toggleBtn.addEventListener('click', () => {
            assistant.classList.toggle('show');
            toggleBtn.classList.toggle('hidden');
        });

        minimizeBtn.addEventListener('click', () => {
            assistant.classList.remove('show');
            toggleBtn.classList.remove('hidden');
        });

        sendBtn.addEventListener('click', () => this.handleUserMessage());
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });
    }

    async handleUserMessage() {
        const userInput = document.getElementById('user-input');
        const message = userInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        userInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get assistant response
            const response = await this.getAssistantResponse(message);
            
            // Remove typing indicator and add assistant response
            this.removeTypingIndicator();
            this.addMessageToChat('assistant', response);
            
            // Scroll to bottom
            this.scrollToBottom();

        } catch (error) {
            console.error('Error getting assistant response:', error);
            this.removeTypingIndicator();
            this.addMessageToChat('assistant', 'I apologize, but I encountered an error. Please try again.');
        }
    }

    async getAssistantResponse(message) {
        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            return data.response;

        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    addMessageToChat(type, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        // Format message if it's from assistant and contains a list
        if (type === 'assistant' && message.includes('\n')) {
            message = message.split('\n').map(line => {
                if (line.trim().startsWith('-')) {
                    return `<li>${line.trim().substring(1)}</li>`;
                }
                return line;
            }).join('');
            if (message.includes('<li>')) {
                message = `<ul>${message}</ul>`;
            }
        }
        
        messageDiv.innerHTML = message;
        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Initialize the assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.medicalAssistant = new MedicalAssistant();
});
