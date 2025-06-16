/*!
 * AI Life Coach - Frontend Application
 * Copyright (c) 2025 Ervin Remu Radosavlevici
 * Licensed under the MIT License
 */

// Global state management
let isAuthenticated = false;
let currentUser = null;
let chatHistory = [];
let currentMode = 'life'; // 'life' or 'career'

// DOM Elements
let chatMessages, chatInput, sendButton, modeToggle, goalForm, memoryOverview;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Cache DOM elements
    chatMessages = document.getElementById('chat-messages');
    chatInput = document.getElementById('message-input');
    sendButton = document.getElementById('send-btn');
    modeToggle = document.getElementById('modeToggle');
    goalForm = document.getElementById('goal-form');
    memoryOverview = document.getElementById('memory-overview');

    // Initialize event listeners
    initializeEventListeners();

    // Load initial data
    loadMemoryOverview();
    loadAnalyticsDashboard();

    // Set initial focus
    if (chatInput) {
        chatInput.focus();
    }

    // Check authentication status
    checkAuthStatus();

    console.log('AI Life Coach application initialized successfully');

    // Auto-resize textarea
    chatInput.addEventListener('input', autoResize.bind(this));
}

function initializeEventListeners() {
    // Chat functionality
    if (sendButton) {
        sendButton.addEventListener('click', handleChatSubmit);
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });
    }

    // Mode toggle
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
      modeToggle.addEventListener('change', function() {
          switchToLifeMode();
          updateTabUI();
      });
    }

    // Goal form
    if (goalForm) {
        goalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGoal();
        });
    }

    // Quick action buttons
    const quickButtons = document.querySelectorAll('.quick-actions .d-grid button');
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            const message = this.dataset.message;
            sendQuickMessage(message);
        });
    });

    // Analytics refresh button
    const refreshAnalytics = document.getElementById('refreshAnalytics');
    if (refreshAnalytics) {
        refreshAnalytics.addEventListener('click', refreshAnalyticsDashboard);
    }

    // Export data button
    const exportData = document.getElementById('exportData');
    if (exportData) {
        exportData.addEventListener('click', exportUserData);
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function checkAuthStatus() {
    // Check if we're on the login page
    if (window.location.pathname === '/login') {
        return;
    }

    // For authenticated pages, assume user is logged in
    isAuthenticated = true;
    currentUser = { username: 'User' }; // This would come from server in real app
}

async function handleChatSubmit(e) {
    if(e){
      e.preventDefault();
    }


    const message = chatInput.value.trim();
    if (!message) return;

    // Disable input while processing
    setInputState(false);

    // Add user message to chat
    addMessageToChat(message, 'user');

    // Clear input
    chatInput.value = '';

    try {
        const endpoint = currentMode === 'career' ? '/career' : '/chat';
        let response = null;

        if (currentMode === 'career') {
           response = await fetch('/career', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
        } else {
            response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
            addMessageToChat(data.response, 'ai');

            // Show additional career insights if available
            if (currentMode === 'career' && data.career_insights) {
                addCareerInsights(data.career_insights, data.skill_recommendations, data.next_steps);
            }

            // Update memory overview after successful chat
             if (data.context_events) {
                setTimeout(loadMemoryOverview, 1000);
            }
        } else {
            addMessageToChat(data.error || 'Sorry, I encountered an error. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('Connection error. Please check your internet connection and try again.', 'error');
    } finally {
        setInputState(true);
    }
}

function addMessageToChat(message, type) {
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const timestamp = new Date().toLocaleTimeString();

    let avatar, label;
    switch(type) {
        case 'user':
            avatar = '👤';
            label = 'You';
            break;
        case 'ai':
            avatar = currentMode === 'career' ? '💼' : '🧠';
            label = currentMode === 'career' ? 'Career Coach' : 'Life Coach';
            break;
        case 'error':
            avatar = '⚠️';
            label = 'System';
            messageDiv.className += ' error-message';
            break;
    }

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-avatar">${avatar}</span>
            <span class="message-sender">${label}</span>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${formatMessage(message)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Store in chat history
    chatHistory.push({ message, type, timestamp });
}

function addCareerInsights(insights, skills, nextSteps) {
    if (!chatMessages) return;

    const insightsDiv = document.createElement('div');
    insightsDiv.className = 'career-insights';

    let insightsHTML = '<div class="insights-container">';

    if (insights && insights.length > 0) {
        insightsHTML += '<div class="insight-section"><h6>📊 Career Insights</h6><ul>';
        insights.forEach(insight => {
            insightsHTML += `<li>${insight}</li>`;
        });
        insightsHTML += '</ul></div>';
    }

    if (skills && skills.length > 0) {
        insightsHTML += '<div class="insight-section"><h6>🎯 Skill Recommendations</h6><ul>';
        skills.forEach(skill => {
            insightsHTML += `<li>${skill}</li>`;
        });
        insightsHTML += '</ul></div>';
    }

    if (nextSteps && nextSteps.length > 0) {
        insightsHTML += '<div class="insight-section"><h6>🚀 Next Steps</h6><ul>';
        nextSteps.forEach(step => {
            insightsHTML += `<li>${step}</li>`;
        });
        insightsHTML += '</ul></div>';
    }

    insightsHTML += '</div>';
    insightsDiv.innerHTML = insightsHTML;

    chatMessages.appendChild(insightsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatMessage(message) {
    // Convert markdown-like formatting to HTML
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function setInputState(enabled) {
    if (chatInput) chatInput.disabled = !enabled;
    if (sendButton) {
        sendButton.disabled = !enabled;
        sendButton.innerHTML = enabled ? '<i class="fas fa-paper-plane"></i>' : '<i class="fas fa-spinner fa-spin"></i>';
    }
}

function updateModeDisplay() {
    const modeLabel = document.getElementById('modeLabel');
    const chatContainer = document.querySelector('.chat-container');

    if (modeLabel) {
        modeLabel.textContent = currentMode === 'career' ? 'Career Coach' : 'Life Coach';
    }

    if (chatContainer) {
        chatContainer.className = `chat-container ${currentMode}-mode`;
    }

    // Update placeholder text
    if (chatInput) {
        chatInput.placeholder = currentMode === 'career'
            ? 'Share your career goals, challenges, or ask for professional advice...'
            : 'Share what\'s on your mind, your goals, or ask for life advice...';
    }
}

async function saveGoal() {
    const goalText = document.getElementById('goal-text').value.trim();
    const targetDate = document.getElementById('target-date').value;

    if (!goalText) {
        showNotification('Please enter a goal description.', 'error');
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
            showNotification(
                `Great! I've added your goal: "${goalText}". Let's work together to achieve it!`,
                'success'
            );

            // Refresh memory overview
            loadMemoryOverview();

        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }

    } catch (error) {
        console.error('Goal saving error:', error);
        showNotification('Failed to save goal. Please try again.', 'error');
    }
}

async function loadMemoryOverview() {
    if (!memoryOverview) return;

    try {
        const response = await fetch('/memory');
        const data = await response.json();

        updateMemoryDisplay(data);
    } catch (error) {
        console.error('Error loading memory:', error);
        if (memoryOverview) {
            memoryOverview.innerHTML = '<div class="error">Error loading memory data</div>';
        }
    }
}

function updateMemoryDisplay(data) {
    if (!memoryOverview) return;

    const activeGoals = data.active_goals || [];
    const recentEvents = data.recent_events || [];
    const totalEvents = data.total_events || 0;

    memoryOverview.innerHTML = `
        <div class="memory-stats">
            <div class="stat-item">
                <div class="stat-number">${totalEvents}</div>
                <div class="stat-label">Total Entries</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${activeGoals.length}</div>
                <div class="stat-label">Active Goals</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${recentEvents.length}</div>
                <div class="stat-label">Recent Events</div>
            </div>
        </div>

        ${activeGoals.length > 0 ? `
            <div class="goals-section">
                <h6>🎯 Active Goals</h6>
                <ul class="goals-list">
                    ${activeGoals.map(goal => `
                        <li class="goal-item">
                            <span class="goal-text">${goal.goal}</span>
                            ${goal.target_date ? `<span class="goal-date">${new Date(goal.target_date).toLocaleDateString()}</span>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        ${recentEvents.length > 0 ? `
            <div class="events-section">
                <h6>📝 Recent Activity</h6>
                <ul class="events-list">
                    ${recentEvents.slice(-5).map(event => `
                        <li class="event-item">
                            <span class="event-date">${new Date(event.date).toLocaleDateString()}</span>
                            <span class="event-text">${event.entry.substring(0, 100)}${event.entry.length > 100 ? '...' : ''}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

async function loadAnalyticsDashboard() {
    const analyticsContainer = document.getElementById('analyticsInterface');
    if (!analyticsContainer) return;

    analyticsContainer.innerHTML = '<div class="loading">Loading analytics...</div>';

    try {
        const response = await fetch('/analytics?type=comprehensive');
        const data = await response.json();

        if (data.success) {
            displayAnalytics(data.report);
        } else {
            analyticsContainer.innerHTML = '<div class="error">Error loading analytics</div>';
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        analyticsContainer.innerHTML = '<div class="error">Error loading analytics</div>';
    }
}

function displayAnalytics(report) {
    const analyticsContainer = document.getElementById('analyticsContent');
    if (!analyticsContainer) return;

    const summary = report.summary || {};
    const moodAnalysis = report.mood_analysis || {};
    const goalProgress = report.goal_progress || {};

    analyticsContainer.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h6>📊 Summary Statistics</h6>
                <div class="analytics-content">
                    <p><strong>Total Entries:</strong> ${summary.total_entries || 0}</p>
                    <p><strong>Active Goals:</strong> ${summary.active_goals || 0}</p>
                    <p><strong>Days Tracked:</strong> ${summary.days_tracked || 0}</p>
                    <p><strong>Consistency Score:</strong> ${Math.round(summary.consistency_score || 0)}%</p>
                </div>
            </div>

            <div class="analytics-card">
                <h6>😊 Mood Analysis</h6>
                <div class="analytics-content">
                    <p><strong>Overall Trend:</strong> ${moodAnalysis.overall_trend || 'No data'}</p>
                    <p><strong>Mood Volatility:</strong> ${Math.round(moodAnalysis.mood_volatility || 0)}</p>
                </div>
            </div>

            <div class="analytics-card">
                <h6>🎯 Goal Progress</h6>
                <div class="analytics-content">
                    <p><strong>Completion Rate:</strong> ${Math.round(goalProgress.completion_rate || 0)}%</p>
                    <p><strong>Completed Goals:</strong> ${goalProgress.completed_goals || 0}</p>
                </div>
            </div>
        </div>
    `;
}

function sendQuickMessage(message) {
  document.getElementById('message-input').value = message;
  document.getElementById('chat-form').dispatchEvent(new Event('submit'));
}

function addGoal() {
    const modal = new bootstrap.Modal(document.getElementById('goalModal'));
    modal.show();
}

function refreshAnalyticsDashboard() {
    loadAnalyticsDashboard();
}

async function exportUserData() {
    try {
        const response = await fetch('/export');
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `life-coach-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isDark = !document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function autoResize() {
    let chatInput = document.getElementById('message-input');
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
}

// Career Coaching Functions
function switchToCareerMode() {
    currentMode = 'career';
    updateTabUI();
    document.getElementById('chatTitle').textContent = 'Career Coaching Session';
    addSystemMessage('Switched to Career Coaching mode. I\'m here to help with your professional development, career planning, and workplace challenges.');
}

function switchToLifeMode() {
    currentMode = 'life';
    updateTabUI();
    document.getElementById('chatTitle').textContent = 'Life Coaching Session';
    addSystemMessage('Switched to Life Coaching mode. Let\'s focus on your overall wellbeing and life goals.');
}

function switchToAnalytics() {
    activeTab = 'analytics';
    updateTabUI();
    loadAnalyticsDashboard();
}

function updateTabUI() {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTo${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}${activeTab === 'life' ? 'Mode' : activeTab === 'career' ? 'Mode' : ''}()"]`)?.classList.add('active');

    // Update chat interface visibility
    const chatInterface = document.getElementById('chatInterface');
    const analyticsInterface = document.getElementById('analyticsInterface');

    if (activeTab === 'analytics') {
        chatInterface.style.display = 'none';
        analyticsInterface.style.display = 'block';
    } else {
        chatInterface.style.display = 'block';
        analyticsInterface.style.display = 'none';
    }

    // Update quick actions based on mode
    updateQuickActions();
}

function updateQuickActions() {
    const quickActionsContainer = document.querySelector('.quick-actions .d-grid');

    if (activeTab === 'career') {
        quickActionsContainer.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" data-message="Help me plan my career progression for the next 2 years" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-chart-line me-1"></i>
                Career Planning
            </button>
            <button class="btn btn-outline-success btn-sm" data-message="What skills should I develop to advance in my field?" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-graduation-cap me-1"></i>
                Skill Development
            </button>
            <button class="btn btn-outline-info btn-sm" data-message="Help me prepare for my upcoming performance review" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-clipboard-check me-1"></i>
                Performance Review
            </button>
            <button class="btn btn-outline-warning btn-sm" data-message="I need advice on work-life balance" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-balance-scale me-1"></i>
                Work-Life Balance
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="createCareerPlan()">
                <i class="fas fa-road me-1"></i>
                Create Career Plan
            </button>
        `;
    } else {
        quickActionsContainer.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" data-message="How can I be more productive today?" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-rocket me-1"></i>
                Productivity Tips
            </button>
            <button class="btn btn-outline-success btn-sm" data-message="Help me review my goals and progress" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-target me-1"></i>
                Review Goals
            </button>
            <button class="btn btn-outline-info btn-sm" data-message="I want to reflect on my recent experiences" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-mirror me-1"></i>
                Life Reflection
            </button>
            <button class="btn btn-outline-warning btn-sm" data-message="I need motivation and encouragement" onclick="sendQuickMessage(this.dataset.message)">
                <i class="fas fa-heart me-1"></i>
                Motivation Boost
            </button>
        `;
    }
}

function addSystemMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.innerHTML = `<i class="fas fa-info-circle me-2"></i>${message}`;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
});

// Global functions for quick access
window.sendMessage = handleChatSubmit;
window.addGoal = addGoal;
window.addQuickEntry = sendQuickMessage;
window.createCareerPlan = createCareerPlan;
window.loadAnalytics = loadAnalyticsDashboard;
window.exportUserData = exportUserData;