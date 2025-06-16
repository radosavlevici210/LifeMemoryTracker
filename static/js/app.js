// AI Life Coach - Simplified Frontend
// Copyright (c) 2025 Ervin Remus Radosavlevici

class LifeCoachApp {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        console.log('AI Life Coach application initialized successfully');
        console.log('Page load time:', Date.now() + 'ms');

        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadMemory();
    }

    setupEventListeners() {
        // Chat form
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
        }

        // Send button
        const sendBtn = document.getElementById('sendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key in message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Goal form
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }

        // Simple buttons
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
        }
    }

    checkAuthStatus() {
        fetch('/health')
            .then(response => response.json())
            .then(data => {
                console.log('System status:', data.status);
                this.isLoggedIn = true;
            })
            .catch(error => {
                console.log('System check failed:', error);
            });
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        this.addMessageToChat('user', message);
        messageInput.value = '';

        this.showTyping(true);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessageToChat('assistant', data.response);
            } else {
                this.addMessageToChat('assistant', data.error || 'Sorry, something went wrong.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToChat('assistant', 'Connection error. Please try again.');
        } finally {
            this.showTyping(false);
        }
    }

    handleChatSubmit(e) {
        e.preventDefault();
        this.sendMessage();
    }

    addMessageToChat(role, content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message mb-3`;

        const avatar = role === 'user' ? '👤' : '🤖';
        const roleText = role === 'user' ? 'You' : 'AI Coach';

        messageDiv.innerHTML = `
            <div class="d-flex ${role === 'user' ? 'justify-content-end' : ''}">
                <div class="message-content ${role === 'user' ? 'bg-primary text-white' : 'bg-secondary'} p-3 rounded-3" style="max-width: 80%;">
                    <div class="message-header mb-2">
                        <small class="text-muted">${avatar} ${roleText}</small>
                    </div>
                    <div class="message-text">${this.formatMessage(content)}</div>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(text) {
        return text.replace(/\n/g, '<br>');
    }

    showTyping(show) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = show ? 'block' : 'none';
        }
    }

    async handleGoalSubmit(e) {
        e.preventDefault();

        const goalInput = document.getElementById('goalInput');
        const goal = goalInput.value.trim();

        if (!goal) return;

        try {
            const response = await fetch('/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ goal })
            });

            const data = await response.json();

            if (data.success) {
                goalInput.value = '';
                this.showAlert('Goal added successfully!', 'success');
                this.loadMemory();
            } else {
                this.showAlert(data.error || 'Failed to add goal', 'danger');
            }
        } catch (error) {
            console.error('Goal error:', error);
            this.showAlert('Connection error. Please try again.', 'danger');
        }
    }

    async loadMemory() {
        try {
            const response = await fetch('/memory');
            const data = await response.json();

            this.updateGoalsList(data.goals || []);
            this.updateStats(data);
        } catch (error) {
            console.error('Memory load error:', error);
        }
    }

    updateGoalsList(goals) {
        const goalsList = document.getElementById('goalsList');
        if (!goalsList) return;

        if (goals.length === 0) {
            goalsList.innerHTML = '<p class="text-muted">No goals yet. Add your first goal above!</p>';
            return;
        }

        goalsList.innerHTML = goals.map(goal => `
            <div class="goal-item p-3 mb-2 bg-secondary rounded">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${goal.goal}</h6>
                        <small class="text-muted">Created: ${goal.created_date}</small>
                    </div>
                    <span class="badge bg-primary">${goal.status}</span>
                </div>
            </div>
        `).join('');
    }

    updateStats(data) {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const stats = {
            'Total Goals': data.goals?.length || 0,
            'Active Goals': data.goals?.filter(g => g.status === 'active').length || 0,
            'Life Events': data.life_events?.length || 0,
            'Conversations': data.conversation_count || 0
        };

        statsContainer.innerHTML = Object.entries(stats).map(([key, value]) => `
            <div class="col-md-3">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <h3 class="card-title">${value}</h3>
                        <p class="card-text">${key}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async exportData() {
        try {
            const response = await fetch('/export');
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `life_coach_data_${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showAlert('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showAlert('Export failed. Please try again.', 'danger');
        }
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.clear();
            this.showAlert('Local data cleared!', 'info');
            location.reload();
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer') || document.body;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.appendChild(alert);

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.lifeCoachApp = new LifeCoachApp();
});