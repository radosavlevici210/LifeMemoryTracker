
/*!
 * AI Life Coach - Production Frontend
 * Copyright (c) 2025 Ervin Remus Radosavlevici
 * Licensed under the MIT License
 */

class LifeCoachApp {
    constructor() {
        this.currentMode = 'life'; // 'life' or 'career'
        this.init();
    }

    init() {
        console.log('AI Life Coach initialized');
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Chat functionality
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        
        if (chatInput && sendButton) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        // Mode toggle
        const modeToggle = document.getElementById('modeToggle');
        if (modeToggle) {
            modeToggle.addEventListener('change', (e) => {
                this.currentMode = e.target.checked ? 'career' : 'life';
                this.updateModeDisplay();
            });
        }

        // Goal form
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => this.handleGoalSubmit(e));
        }

        // Quick actions
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Analytics refresh
        const refreshAnalytics = document.getElementById('refreshAnalytics');
        if (refreshAnalytics) {
            refreshAnalytics.addEventListener('click', () => this.loadAnalytics());
        }

        // Export and clear
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearData());
        }
    }

    async sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        this.addMessage('user', message);
        chatInput.value = '';
        this.showTyping(true);

        try {
            const endpoint = this.currentMode === 'career' ? '/career' : '/chat';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessage('ai', data.response);
            } else {
                this.addMessage('ai', data.error || 'Sorry, something went wrong.');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('ai', 'Connection error. Please try again.');
        } finally {
            this.showTyping(false);
        }
    }

    addMessage(sender, content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = sender === 'user' ? '👤' : (this.currentMode === 'career' ? '💼' : '🧠');
        const senderName = sender === 'user' ? 'You' : (this.currentMode === 'career' ? 'Career Coach' : 'Life Coach');

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-avatar">${avatar}</span>
                <span class="message-sender">${senderName}</span>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatMessage(text) {
        return text.replace(/\n/g, '<br>');
    }

    showTyping(show) {
        // Add typing indicator if needed
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const existingTyping = chatMessages.querySelector('.typing-indicator');
        if (existingTyping) {
            existingTyping.remove();
        }

        if (show) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message ai-message typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-avatar">${this.currentMode === 'career' ? '💼' : '🧠'}</span>
                    <span class="message-sender">${this.currentMode === 'career' ? 'Career Coach' : 'Life Coach'}</span>
                </div>
                <div class="message-content">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    updateModeDisplay() {
        const modeLabel = document.getElementById('modeLabel');
        if (modeLabel) {
            modeLabel.textContent = this.currentMode === 'career' ? 'Career Coach' : 'Life Coach';
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.placeholder = this.currentMode === 'career' 
                ? 'Ask about career development, skills, job search...'
                : 'Share what\'s on your mind, your goals, or ask for life advice...';
        }
    }

    async handleGoalSubmit(e) {
        e.preventDefault();

        const goalInput = document.getElementById('goalInput');
        const targetDate = document.getElementById('targetDate');
        
        const goal = goalInput.value.trim();
        if (!goal) return;

        try {
            const response = await fetch('/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    goal, 
                    target_date: targetDate ? targetDate.value : null 
                })
            });

            const data = await response.json();

            if (data.success) {
                goalInput.value = '';
                if (targetDate) targetDate.value = '';
                this.showNotification('Goal added successfully!', 'success');
                this.loadMemoryOverview();
            } else {
                this.showNotification(data.error || 'Failed to add goal', 'error');
            }
        } catch (error) {
            console.error('Goal error:', error);
            this.showNotification('Connection error. Please try again.', 'error');
        }
    }

    handleQuickAction(action) {
        const prompts = {
            'daily-reflection': 'Help me reflect on my day. What went well and what could I improve?',
            'goal-check': 'Let\'s check on my current goals. How am I progressing?',
            'mood-check': 'I\'d like to share how I\'m feeling today and get some guidance.',
            'challenge': 'I\'m facing a challenge and could use some advice and perspective.',
            'achievement': 'I\'ve accomplished something and want to share this success.',
            'career-plan': 'Help me create a career development plan for the next few months.'
        };

        const prompt = prompts[action];
        if (prompt) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = prompt;
                chatInput.focus();
            }
        }
    }

    async loadInitialData() {
        this.loadMemoryOverview();
        this.loadAnalytics();
    }

    async loadMemoryOverview() {
        const memoryOverview = document.getElementById('memoryOverview');
        if (!memoryOverview) return;

        try {
            const response = await fetch('/memory');
            const data = await response.json();

            memoryOverview.innerHTML = `
                <div class="memory-stats">
                    <div class="stat-item">
                        <strong>${data.goals?.length || 0}</strong>
                        <small>Goals</small>
                    </div>
                    <div class="stat-item">
                        <strong>${data.life_events?.length || 0}</strong>
                        <small>Life Events</small>
                    </div>
                    <div class="stat-item">
                        <strong>${data.conversation_count || 0}</strong>
                        <small>Conversations</small>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Memory loading error:', error);
            memoryOverview.innerHTML = '<div class="text-muted">Unable to load memory data</div>';
        }
    }

    async loadAnalytics() {
        const analyticsContainer = document.getElementById('analyticsContainer');
        if (!analyticsContainer) return;

        try {
            const response = await fetch('/analytics');
            const data = await response.json();

            if (data.success && data.report) {
                analyticsContainer.innerHTML = `
                    <div class="analytics-summary">
                        <h6>Recent Activity</h6>
                        <p class="text-muted">${data.report.summary || 'No recent activity'}</p>
                    </div>
                `;
            } else {
                analyticsContainer.innerHTML = '<div class="text-muted">No analytics available</div>';
            }
        } catch (error) {
            console.error('Analytics loading error:', error);
            analyticsContainer.innerHTML = '<div class="text-muted">Unable to load analytics</div>';
        }
    }

    async exportData() {
        try {
            const response = await fetch('/export');
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `ai_life_coach_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }

    clearData() {
        if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
            localStorage.clear();
            sessionStorage.clear();
            this.showNotification('Local data cleared!', 'info');
            setTimeout(() => location.reload(), 1000);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    window.lifeCoachApp = new LifeCoachApp();
});

// Global functions for compatibility
function loadMemoryOverview() {
    if (window.lifeCoachApp) {
        window.lifeCoachApp.loadMemoryOverview();
    }
}

function exportUserData() {
    if (window.lifeCoachApp) {
        window.lifeCoachApp.exportData();
    }
}

function createCareerPlan() {
    if (window.lifeCoachApp) {
        window.lifeCoachApp.handleQuickAction('career-plan');
    }
}
