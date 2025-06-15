/*
AI Life Coach - Main JavaScript Application

Copyright (c) 2025 Ervin Remu Radosavlevici
Licensed under the MIT License
*/

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

// Global variables
let currentUser = null;
let isLoading = false;
let activeTab = 'life'; // life, career, analytics
let analyticsCache = null;

// Global functions for easy access
function sendQuickMessage(message) {
    document.getElementById('message-input').value = message;
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

// Career Coaching Functions
function switchToCareerMode() {
    activeTab = 'career';
    updateTabUI();
    document.getElementById('chatTitle').textContent = 'Career Coaching Session';
    addSystemMessage('Switched to Career Coaching mode. I\'m here to help with your professional development, career planning, and workplace challenges.');
}

function switchToLifeMode() {
    activeTab = 'life';
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
            <button class="btn btn-outline-primary btn-sm" onclick="sendQuickMessage('Help me plan my career progression for the next 2 years')">
                <i class="fas fa-chart-line me-1"></i>
                Career Planning
            </button>
            <button class="btn btn-outline-success btn-sm" onclick="sendQuickMessage('What skills should I develop to advance in my field?')">
                <i class="fas fa-graduation-cap me-1"></i>
                Skill Development
            </button>
            <button class="btn btn-outline-info btn-sm" onclick="sendQuickMessage('Help me prepare for my upcoming performance review')">
                <i class="fas fa-clipboard-check me-1"></i>
                Performance Review
            </button>
            <button class="btn btn-outline-warning btn-sm" onclick="sendQuickMessage('I need advice on work-life balance')">
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
            <button class="btn btn-outline-primary btn-sm" onclick="sendQuickMessage('How can I be more productive today?')">
                <i class="fas fa-rocket me-1"></i>
                Productivity Tips
            </button>
            <button class="btn btn-outline-success btn-sm" onclick="sendQuickMessage('Help me review my goals and progress')">
                <i class="fas fa-target me-1"></i>
                Review Goals
            </button>
            <button class="btn btn-outline-info btn-sm" onclick="sendQuickMessage('I want to reflect on my recent experiences')">
                <i class="fas fa-mirror me-1"></i>
                Life Reflection
            </button>
            <button class="btn btn-outline-warning btn-sm" onclick="sendQuickMessage('I need motivation and encouragement')">
                <i class="fas fa-heart me-1"></i>
                Motivation Boost
            </button>
        `;
    }
}

async function sendCareerMessage(message) {
    if (isLoading || !message.trim()) return;

    isLoading = true;
    updateSendButton(true);

    // Add user message
    addMessage(message, 'user');

    try {
        const response = await fetch('/career', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        if (data.success) {
            addMessage(data.response, 'ai');

            // Display additional career insights if available
            if (data.career_insights && data.career_insights.length > 0) {
                addCareerInsights(data.career_insights);
            }

            if (data.skill_recommendations && data.skill_recommendations.length > 0) {
                addSkillRecommendations(data.skill_recommendations);
            }

            if (data.next_steps && data.next_steps.length > 0) {
                addNextSteps(data.next_steps);
            }
        } else {
            addMessage(data.response || 'Sorry, I encountered an error while processing your career question.', 'ai');
        }
    } catch (error) {
        console.error('Career coaching error:', error);
        addMessage('I\'m having trouble connecting right now. Please try again in a moment.', 'ai');
    } finally {
        isLoading = false;
        updateSendButton(false);
    }
}

function addCareerInsights(insights) {
    const insightsHtml = `
        <div class="career-insights mt-3 p-3 bg-light rounded">
            <h6><i class="fas fa-lightbulb text-warning me-2"></i>Career Insights</h6>
            <ul class="mb-0">
                ${insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
        </div>
    `;

    const lastMessage = document.querySelector('.message:last-child .message-content');
    lastMessage.insertAdjacentHTML('beforeend', insightsHtml);
}

function addSkillRecommendations(recommendations) {
    const skillsHtml = `
        <div class="skill-recommendations mt-3 p-3 bg-primary bg-opacity-10 rounded">
            <h6><i class="fas fa-tools text-primary me-2"></i>Skill Recommendations</h6>
            <ul class="mb-0">
                ${recommendations.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
        </div>
    `;

    const lastMessage = document.querySelector('.message:last-child .message-content');
    lastMessage.insertAdjacentHTML('beforeend', skillsHtml);
}

function addNextSteps(steps) {
    const stepsHtml = `
        <div class="next-steps mt-3 p-3 bg-success bg-opacity-10 rounded">
            <h6><i class="fas fa-step-forward text-success me-2"></i>Recommended Next Steps</h6>
            <ol class="mb-0">
                ${steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
    `;

    const lastMessage = document.querySelector('.message:last-child .message-content');
    lastMessage.insertAdjacentHTML('beforeend', stepsHtml);
}

async function createCareerPlan() {
    const timeframe = prompt('Enter timeframe for your career plan (e.g., "6months", "1year", "2years"):') || '6months';

    if (isLoading) return;

    isLoading = true;
    updateSendButton(true);

    addSystemMessage(`Creating a ${timeframe} career development plan...`);

    try {
        const response = await fetch('/career/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timeframe: timeframe })
        });

        const data = await response.json();

        if (data.success) {
            addMessage(data.plan, 'ai');
            addSystemMessage('Your career plan has been created and saved!');
        } else {
            addMessage('Sorry, I couldn\'t create your career plan right now. Please try again later.', 'ai');
        }
    } catch (error) {
        console.error('Career plan error:', error);
        addMessage('I\'m having trouble creating your career plan. Please try again in a moment.', 'ai');
    } finally {
        isLoading = false;
        updateSendButton(false);
    }
}

// Analytics Functions
async function loadAnalyticsDashboard() {
    if (analyticsCache && (Date.now() - analyticsCache.timestamp) < 300000) { // 5 minute cache
        displayAnalytics(analyticsCache.data);
        return;
    }

    try {
        showAnalyticsLoading();

        const response = await fetch('/analytics?type=comprehensive');
        const data = await response.json();

        if (data.success) {
            analyticsCache = {
                data: data.report,
                timestamp: Date.now()
            };
            displayAnalytics(data.report);
        } else {
            showAnalyticsError('Failed to load analytics data');
        }
    } catch (error) {
        console.error('Analytics error:', error);
        showAnalyticsError('Error loading analytics data');
    }
}

function displayAnalytics(report) {
    const analyticsContainer = document.getElementById('analyticsContent');

    analyticsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Summary Statistics</h6>
                    </div>
                    <div class="card-body">
                        ${generateSummaryStatsHTML(report.summary)}
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-heart me-2"></i>Mood Analysis</h6>
                    </div>
                    <div class="card-body">
                        ${generateMoodAnalysisHTML(report.mood_analysis)}
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-target me-2"></i>Goal Progress</h6>
                    </div>
                    <div class="card-body">
                        ${generateGoalProgressHTML(report.goal_progress)}
                    </div>
                </div>
            </div>

            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-chart-line me-2"></i>Growth Metrics</h6>
                    </div>
                    <div class="card-body">
                        ${generateGrowthMetricsHTML(report.growth_metrics)}
                    </div>
                </div>
            </div>

            <div class="col-12 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="fas fa-lightbulb me-2"></i>Recommendations</h6>
                    </div>
                    <div class="card-body">
                        ${generateRecommendationsHTML(report.recommendations)}
                    </div>
                </div>
            </div>
        </div>

        <div class="text-center mt-4">
            <button class="btn btn-primary me-2" onclick="loadWeeklyReport()">
                <i class="fas fa-calendar-week me-1"></i>Weekly Report
            </button>
            <button class="btn btn-secondary" onclick="refreshAnalytics()">
                <i class="fas fa-sync me-1"></i>Refresh Data
            </button>
        </div>
    `;
}

function generateSummaryStatsHTML(summary) {
    return `
        <div class="row text-center">
            <div class="col-6 mb-3">
                <h4 class="text-primary">${summary.total_entries || 0}</h4>
                <small class="text-muted">Total Entries</small>
            </div>
            <div class="col-6 mb-3">
                <h4 class="text-success">${summary.active_goals || 0}</h4>
                <small class="text-muted">Active Goals</small>
            </div>
            <div class="col-6 mb-3">
                <h4 class="text-info">${summary.days_tracked || 0}</h4>
                <small class="text-muted">Days Tracked</small>
            </div>
            <div class="col-6 mb-3">
                <h4 class="text-warning">${Math.round(summary.consistency_score || 0)}%</h4>
                <small class="text-muted">Consistency</small>
            </div>
        </div>
    `;
}

function generateMoodAnalysisHTML(mood) {
    const trend = mood.overall_trend || 'stable';
    const trendIcon = trend === 'improving' ? 'fa-arrow-up text-success' : 
                     trend === 'declining' ? 'fa-arrow-down text-danger' : 
                     'fa-minus text-warning';

    return `
        <div class="text-center mb-3">
            <h5><i class="fas ${trendIcon} me-2"></i>${trend.charAt(0).toUpperCase() + trend.slice(1)}</h5>
            <p class="text-muted">Overall mood trend</p>
        </div>
        <div class="row">
            <div class="col-6">
                <strong>Volatility:</strong>
            </div>
            <div class="col-6">
                ${Math.round((mood.mood_volatility || 0) * 100) / 100}
            </div>
        </div>
    `;
}

function generateGoalProgressHTML(goals) {
    if (goals.message) {
        return `<p class="text-muted">${goals.message}</p>`;
    }

    return `
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Completion Rate</span>
                <span>${Math.round(goals.completion_rate || 0)}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar" style="width: ${goals.completion_rate || 0}%"></div>
            </div>
        </div>
        <div class="row text-center">
            <div class="col-4">
                <strong>${goals.total_goals || 0}</strong><br>
                <small>Total</small>
            </div>
            <div class="col-4">
                <strong>${goals.completed_goals || 0}</strong><br>
                <small>Completed</small>
            </div>
            <div class="col-4">
                <strong>${goals.active_goals || 0}</strong><br>
                <small>Active</small>
            </div>
        </div>
    `;
}

function generateGrowthMetricsHTML(growth) {
    return `
        <div class="row">
            <div class="col-6 mb-2">
                <strong>Growth Indicators:</strong>
            </div>
            <div class="col-6 mb-2">
                ${growth.growth_indicators || 0}
            </div>
            <div class="col-6 mb-2">
                <strong>Resilience Score:</strong>
            </div>
            <div class="col-6 mb-2">
                ${Math.round(growth.resilience_score || 0)}%
            </div>
            <div class="col-6 mb-2">
                <strong>Learning Frequency:</strong>
            </div>
            <div class="col-6 mb-2">
                ${Math.round(growth.learning_frequency || 0)}%
            </div>
        </div>
    `;
}

function generateRecommendationsHTML(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return '<p class="text-muted">No specific recommendations at this time. Keep up the great work!</p>';
    }

    return recommendations.map(rec => `
        <div class="alert alert-${rec.priority === 'high' ? 'warning' : rec.priority === 'medium' ? 'info' : 'light'} mb-2">
            <strong>${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}:</strong>
            ${rec.recommendation}
        </div>
    `).join('');
}

async function loadWeeklyReport() {
    try {
        showAnalyticsLoading();

        const response = await fetch('/analytics?type=weekly');
        const data = await response.json();

        if (data.success) {
            displayWeeklyReport(data.report);
        } else {
            showAnalyticsError('Failed to load weekly report');
        }
    } catch (error) {
        console.error('Weekly report error:', error);
        showAnalyticsError('Error loading weekly report');
    }
}

function displayWeeklyReport(report) {
    const analyticsContainer = document.getElementById('analyticsContent');

    analyticsContainer.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-calendar-week me-2"></i>${report.period}</h5>
                <small class="text-muted">${report.date_range}</small>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h6>Weekly Summary</h6>
                        <p><strong>Entries this week:</strong> ${report.entries_this_week}</p>
                        <p><strong>Mood summary:</strong> ${report.mood_summary}</p>
                    </div>
                    <div class="col-md-6">
                        <h6>Goals Worked On</h6>
                        ${report.goals_worked_on.length > 0 ? 
                            '<ul>' + report.goals_worked_on.map(goal => `<li>${goal}</li>`).join('') + '</ul>' :
                            '<p class="text-muted">No specific goals mentioned this week</p>'
                        }
                    </div>
                </div>

                ${report.achievements.length > 0 ? `
                <div class="mb-4">
                    <h6><i class="fas fa-trophy text-warning me-2"></i>Achievements</h6>
                    <ul>
                        ${report.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                ${report.challenges.length > 0 ? `
                <div class="mb-4">
                    <h6><i class="fas fa-exclamation-triangle text-warning me-2"></i>Challenges</h6>
                    <ul>
                        ${report.challenges.map(challenge => `<li>${challenge}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <div class="mb-4">
                    <h6><i class="fas fa-arrow-right text-primary me-2"></i>Focus for Next Week</h6>
                    <ul>
                        ${report.next_week_focus.map(focus => `<li>${focus}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="text-center mt-4">
            <button class="btn btn-primary me-2" onclick="loadAnalyticsDashboard()">
                <i class="fas fa-chart-bar me-1"></i>Full Analytics
            </button>
            <button class="btn btn-secondary" onclick="refreshAnalytics()">
                <i class="fas fa-sync me-1"></i>Refresh Data
            Adding copyright header to the JavaScript file.            </button>
        </div>
    `;
}

function showAnalyticsLoading() {
    document.getElementById('analyticsContent').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Analyzing your data...</p>
        </div>
    `;
}

function showAnalyticsError(message) {
    document.getElementById('analyticsContent').innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        </div>
    `;
}

function refreshAnalytics() {
    analyticsCache = null;
    loadAnalyticsDashboard();
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message || isLoading) return;

    messageInput.value = '';
    this.setLoading(true);

    try {
        let response;
        if (activeTab === 'career') {
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });
        }

        const data = await response.json();

        if (data.success) {
            this.addMessage(data.response, 'assistant');

            if (activeTab === 'career') {
                 if (data.career_insights && data.career_insights.length > 0) {
                   //addCareerInsights(data.career_insights);
                    }

                    if (data.skill_recommendations && data.skill_recommendations.length > 0) {
                       // addSkillRecommendations(data.skill_recommendations);
                    }

                    if (data.next_steps && data.next_steps.length > 0) {
                        //addNextSteps(data.next_steps);
                    }
            }
            // Update memory overview after successful interaction
           if (data.context_events) {
                setTimeout(() => this.loadMemoryOverview(), 1000);
            }
        } else {
            this.addMessage(data.response || 'Sorry, I encountered an error. Please try again.', 'assistant', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        this.addMessage('I\'m having trouble connecting right now. Please try again in a moment.', 'assistant', 'error');
    } finally {
        this.setLoading(false);
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.lifeCoachApp = new LifeCoachApp();
});