// AI Life Coach Frontend Application

class LifeCoachApp {
    constructor() {
        this.chatForm = document.getElementById('chat-form');
        this.messageInput = document.getElementById('message-input');
        this.chatMessages = document.getElementById('chat-messages');
        this.sendBtn = document.getElementById('send-btn');
        this.loading = document.getElementById('loading');
        
        this.initializeEventListeners();
        this.loadMemoryOverview();
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', this.autoResize.bind(this));
    }
    
    initializeEventListeners() {
        // Chat form submission
        this.chatForm.addEventListener('submit', this.handleChatSubmit.bind(this));
        
        // Enter key to send (Shift+Enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleChatSubmit(e);
            }
        });
        
        // Goal form submission
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGoal();
            });
        }
    }
    
    async handleChatSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input and disable form
        this.messageInput.value = '';
        this.setLoading(true);
        
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage(data.response, 'assistant');
                
                // Update memory overview if context changed
                if (data.context_events) {
                    setTimeout(() => this.loadMemoryOverview(), 1000);
                }
            } else {
                this.addMessage(
                    `Error: ${data.error || 'Failed to get response'}`, 
                    'assistant', 
                    'error'
                );
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage(
                'I\'m having trouble connecting right now. Please check your internet connection and try again.', 
                'assistant', 
                'error'
            );
        } finally {
            this.setLoading(false);
            this.messageInput.focus();
        }
    }
    
    addMessage(content, sender, type = 'normal') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        if (type === 'error') {
            messageDiv.classList.add('error-message');
        } else if (type === 'success') {
            messageDiv.classList.add('success-message');
        }
        
        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const icon = sender === 'user' ? 
            '<i class="fas fa-user me-2"></i>' : 
            '<i class="fas fa-brain me-2"></i>';
        
        const senderLabel = sender === 'user' ? 'You' : 'AI Coach';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${icon}<strong>${senderLabel}:</strong> ${this.formatMessage(content)}
            </div>
            <div class="message-time">${timestamp}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(content) {
        // Basic formatting for AI responses
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
    
    setLoading(isLoading) {
        if (isLoading) {
            this.loading.style.display = 'block';
            this.sendBtn.disabled = true;
            this.messageInput.disabled = true;
        } else {
            this.loading.style.display = 'none';
            this.sendBtn.disabled = false;
            this.messageInput.disabled = false;
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
    }
    
    async loadMemoryOverview() {
        try {
            const response = await fetch('/memory');
            const data = await response.json();
            
            if (data.error) {
                document.getElementById('memory-overview').innerHTML = `
                    <div class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Error loading progress
                    </div>
                `;
                return;
            }
            
            this.renderMemoryOverview(data);
            
        } catch (error) {
            console.error('Memory loading error:', error);
            document.getElementById('memory-overview').innerHTML = `
                <div class="text-muted">
                    <i class="fas fa-wifi me-2"></i>
                    Unable to load progress
                </div>
            `;
        }
    }
    
    renderMemoryOverview(data) {
        const overview = document.getElementById('memory-overview');
        
        let html = `
            <div class="row text-center mb-3">
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-number">${data.total_events || 0}</div>
                        <div class="stat-label">Life Events</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="stat-card">
                        <div class="stat-number">${data.total_goals || 0}</div>
                        <div class="stat-label">Goals Set</div>
                    </div>
                </div>
            </div>
        `;
        
        if (data.active_goals && data.active_goals.length > 0) {
            html += `
                <h6 class="mb-2">
                    <i class="fas fa-target me-2"></i>
                    Active Goals
                </h6>
            `;
            data.active_goals.slice(0, 3).forEach(goal => {
                html += `
                    <div class="memory-item goal-item">
                        <small>${goal.goal}</small>
                    </div>
                `;
            });
        }
        
        if (data.recent_events && data.recent_events.length > 0) {
            html += `
                <h6 class="mb-2 mt-3">
                    <i class="fas fa-clock me-2"></i>
                    Recent Activity
                </h6>
            `;
            data.recent_events.slice(-2).forEach(event => {
                html += `
                    <div class="memory-item">
                        <small><strong>${event.date}:</strong> ${event.entry.substring(0, 50)}${event.entry.length > 50 ? '...' : ''}</small>
                    </div>
                `;
            });
        }
        
        if (data.warnings && data.warnings.length > 0) {
            html += `
                <h6 class="mb-2 mt-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Insights
                </h6>
            `;
            data.warnings.slice(-1).forEach(warning => {
                html += `
                    <div class="memory-item warning-item">
                        <small>${warning}</small>
                    </div>
                `;
            });
        }
        
        if (data.total_events === 0) {
            html = `
                <div class="text-center text-muted">
                    <i class="fas fa-seedling fa-2x mb-2"></i>
                    <p>Your journey starts here!</p>
                    <small>Share your thoughts to begin building your coaching history.</small>
                </div>
            `;
        }
        
        overview.innerHTML = html;
    }
    
    async saveGoal() {
        const goalText = document.getElementById('goal-text').value.trim();
        const targetDate = document.getElementById('target-date').value;
        
        if (!goalText) {
            alert('Please enter a goal description.');
            return;
        }
        
        try {
            const response = await fetch('/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goal: goalText,
                    target_date: targetDate || null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
                modal.hide();
                
                // Clear form
                document.getElementById('goal-form').reset();
                
                // Show success message
                this.addMessage(
                    `Great! I've added your goal: "${goalText}". Let's work together to achieve it!`, 
                    'assistant', 
                    'success'
                );
                
                // Refresh memory overview
                this.loadMemoryOverview();
                
            } else {
                alert(`Error: ${data.error}`);
            }
            
        } catch (error) {
            console.error('Goal saving error:', error);
            alert('Failed to save goal. Please try again.');
        }
    }
    
    async showMemoryDetails() {
        const modal = new bootstrap.Modal(document.getElementById('memoryModal'));
        modal.show();
        
        try {
            const response = await fetch('/memory');
            const data = await response.json();
            
            let html = '';
            
            if (data.error) {
                html = `<div class="alert alert-danger">Error loading details: ${data.error}</div>`;
            } else {
                // Goals section
                if (data.active_goals && data.active_goals.length > 0) {
                    html += `
                        <h6><i class="fas fa-target me-2"></i>Active Goals</h6>
                        <div class="mb-4">
                    `;
                    data.active_goals.forEach(goal => {
                        html += `
                            <div class="card mb-2">
                                <div class="card-body py-2">
                                    <div class="d-flex justify-content-between">
                                        <span>${goal.goal}</span>
                                        <small class="text-muted">Created: ${goal.created_date}</small>
                                    </div>
                                    ${goal.target_date ? `<small class="text-info">Target: ${goal.target_date}</small>` : ''}
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // Recent events
                if (data.recent_events && data.recent_events.length > 0) {
                    html += `
                        <h6><i class="fas fa-clock me-2"></i>Recent Life Events</h6>
                        <div class="mb-4">
                    `;
                    data.recent_events.forEach(event => {
                        html += `
                            <div class="card mb-2">
                                <div class="card-body py-2">
                                    <div class="d-flex justify-content-between">
                                        <small class="text-muted">${event.date}</small>
                                        <small class="text-muted">${event.type || 'general'}</small>
                                    </div>
                                    <div class="mt-1">${event.entry}</div>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                }
                
                // Patterns and insights
                if (data.patterns && Object.keys(data.patterns).length > 0) {
                    html += `
                        <h6><i class="fas fa-chart-line me-2"></i>Patterns & Insights</h6>
                        <div class="mb-4">
                    `;
                    Object.entries(data.patterns).forEach(([key, pattern]) => {
                        html += `
                            <div class="card mb-2">
                                <div class="card-body py-2">
                                    <strong>${key.replace('_', ' ')}:</strong>
                                    <pre class="mb-0 mt-1">${JSON.stringify(pattern.data, null, 2)}</pre>
                                    <small class="text-muted">Last updated: ${new Date(pattern.last_updated).toLocaleString()}</small>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                }
            }
            
            document.getElementById('memory-details').innerHTML = html || '<p class="text-muted">No detailed information available yet.</p>';
            
        } catch (error) {
            console.error('Memory details error:', error);
            document.getElementById('memory-details').innerHTML = `
                <div class="alert alert-danger">Failed to load details. Please try again.</div>
            `;
        }
    }
}

// Global functions for easy access
function sendQuickMessage(message) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = message;
    messageInput.focus();
    
    // Auto-submit the message
    document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

function clearChat() {
    if (confirm('Are you sure you want to clear the chat? This won\'t delete your stored memories.')) {
        document.getElementById('chat-messages').innerHTML = `
            <div class="message assistant-message">
                <div class="message-content">
                    <i class="fas fa-brain me-2"></i>
                    <strong>AI Coach:</strong> Chat cleared. How can I help you today?
                </div>
            </div>
        `;
    }
}

function addGoal() {
    const modal = new bootstrap.Modal(document.getElementById('goalModal'));
    modal.show();
}

function showMemory() {
    if (window.lifeCoachApp) {
        window.lifeCoachApp.showMemoryDetails();
    }
}

function saveGoal() {
    if (window.lifeCoachApp) {
        window.lifeCoachApp.saveGoal();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.lifeCoachApp = new LifeCoachApp();
});
