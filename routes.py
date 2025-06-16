
from flask import render_template, request, jsonify, abort, session, redirect, url_for, flash
from app import app
from life_coach import LifeCoach
from career_coach import CareerCoach
from analytics import LifeAnalytics
from auth import login_required, authenticate, login_user, logout_user, is_authenticated, get_current_user
import time
import logging
import os

# Initialize coaches and analytics
life_coach = LifeCoach()
career_coach = CareerCoach()
analytics = LifeAnalytics()

# Simple request tracking
request_count = 0

@app.route("/register", methods=["GET", "POST"])
def register():
    """User registration"""
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form
        email = data.get('email', '').strip()
        device = data.get('device', 'unknown')
        
        if not email:
            if request.is_json:
                return jsonify({"error": "Email is required"}), 400
            else:
                flash('Email is required', 'error')
                return render_template("register.html")
        
        # Simple registration - in production, add proper validation
        users_file = "users.json"
        users = []
        if os.path.exists(users_file):
            try:
                with open(users_file, 'r') as f:
                    users = json.load(f)
            except:
                users = []
        
        # Check if user already exists
        if any(user.get('email') == email for user in users):
            if request.is_json:
                return jsonify({"error": "Email already registered"}), 400
            else:
                flash('Email already registered. Please login.', 'error')
                return redirect(url_for('login'))
        
        # Add new user
        import datetime
        import json
        users.append({
            "email": email,
            "device": device,
            "ip": request.environ.get('REMOTE_ADDR', 'unknown'),
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        with open(users_file, 'w') as f:
            json.dump(users, f, indent=2)
        
        # Auto-login after registration
        login_user(email.split('@')[0])  # Use email prefix as username
        
        if request.is_json:
            return jsonify({"message": "Registered and logged in successfully"})
        else:
            flash('Registration successful!', 'success')
            return redirect(url_for('index'))
    
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    """Login page"""
    if is_authenticated():
        return redirect(url_for('index'))
    
    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if authenticate(username, password):
            login_user(username)
            
            if request.is_json:
                return jsonify({"success": True, "redirect": url_for('index')})
            else:
                flash('Login successful!', 'success')
                return redirect(url_for('index'))
        else:
            if request.is_json:
                return jsonify({"success": False, "error": "Invalid username or password"}), 401
            else:
                flash('Invalid username or password', 'error')
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    """Logout user"""
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))

@app.route("/")
def index():
    """Main page route"""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chat messages"""
    global request_count
    request_count += 1
    
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({
                "success": False,
                "error": "No message provided"
            }), 400
        
        user_message = data["message"].strip()
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Empty message"
            }), 400
        
        # Generate AI response
        response = life_coach.generate_response(user_message)
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Server error",
            "response": "Sorry, I'm having trouble right now. Please try again."
        }), 500

@app.route("/memory", methods=["GET"])
def get_memory():
    """Get memory summary"""
    try:
        summary = life_coach.get_memory_summary()
        return jsonify(summary)
    except Exception as e:
        logging.error(f"Memory error: {str(e)}")
        return jsonify({"error": "Failed to load memory"}), 500

@app.route("/goals", methods=["POST"])
def add_goal():
    """Add a new goal"""
    try:
        data = request.get_json()
        if not data or "goal" not in data:
            return jsonify({"success": False, "error": "No goal provided"}), 400
        
        goal_text = data["goal"].strip()
        target_date = data.get("target_date")
        
        if not goal_text:
            return jsonify({"success": False, "error": "Empty goal"}), 400
        
        success = life_coach.add_goal(goal_text, target_date)
        
        return jsonify({
            "success": success,
            "message": "Goal added successfully" if success else "Failed to add goal"
        })
        
    except Exception as e:
        logging.error(f"Goals error: {str(e)}")
        return jsonify({"success": False, "error": "Server error"}), 500

@app.route("/career", methods=["POST"])
@login_required
def career_coaching():
    """Handle career coaching requests"""
    try:
        ip = request.environ.get('REMOTE_ADDR', 'unknown')
        if not check_rate_limit(ip, 'career', limit=75, window=60):
            return jsonify({
                "success": False,
                "error": "Too many career coaching requests. Please wait a moment."
            }), 429
        
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({
                "success": False,
                "error": "No message provided"
            }), 400
        
        user_message = data["message"].strip()
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Empty message"
            }), 400
        
        if len(user_message) > 2000:
            return jsonify({
                "success": False,
                "error": "Message too long. Please keep it under 2000 characters."
            }), 400
        
        current_user = get_current_user()
        logging.info(f"Career coaching request from {current_user.get('username', 'unknown')}")
        
        # Generate career coaching response
        response = career_coach.analyze_career_path(user_message)
        
        session['last_activity'] = time.time()
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Career coaching endpoint error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Server error occurred",
            "response": "I'm experiencing technical difficulties with career analysis. Please try again."
        }), 500

@app.route("/career/plan", methods=["POST"])
@login_required
def create_career_plan():
    """Create a structured career development plan"""
    try:
        ip = request.environ.get('REMOTE_ADDR', 'unknown')
        if not check_rate_limit(ip, 'career_plan', limit=5, window=300):
            return jsonify({"success": False, "error": "Too many plan requests"}), 429
        
        data = request.get_json()
        timeframe = data.get("timeframe", "6months") if data else "6months"
        
        current_user = get_current_user()
        logging.info(f"Career plan request from {current_user.get('username', 'unknown')} - Timeframe: {timeframe}")
        
        response = career_coach.create_career_plan(timeframe)
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"Career plan endpoint error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to create career plan"}), 500

@app.route("/analytics", methods=["GET"])
@login_required
def get_analytics():
    """Get comprehensive analytics report"""
    try:
        ip = request.environ.get('REMOTE_ADDR', 'unknown')
        if not check_rate_limit(ip, 'analytics', limit=50, window=60):
            return jsonify({"error": "Too many analytics requests"}), 429
        
        report_type = request.args.get('type', 'comprehensive')
        
        if report_type == 'weekly':
            report = analytics.generate_weekly_report()
        else:
            report = analytics.generate_comprehensive_report()
        
        current_user = get_current_user()
        logging.info(f"Analytics request from {current_user.get('username', 'unknown')} - Type: {report_type}")
        
        return jsonify({
            "success": True,
            "report": report,
            "generated_at": time.time()
        })
        
    except Exception as e:
        logging.error(f"Analytics endpoint error: {str(e)}")
        return jsonify({"error": "Failed to generate analytics report"}), 500

@app.route("/export", methods=["GET"])
def export_data():
    """Export user data"""
    try:
        memory_data = life_coach.memory_manager.load_memory()
        
        export_data = {
            "life_events": memory_data.get("life_events", []),
            "goals": memory_data.get("goals", []),
            "patterns": memory_data.get("patterns", {}),
            "export_timestamp": time.time(),
            "version": "1.0"
        }
        
        return jsonify(export_data)
        
    except Exception as e:
        logging.error(f"Export error: {str(e)}")
        return jsonify({"error": "Failed to export data"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        # Basic health checks
        memory_accessible = life_coach.memory_manager.load_memory() is not None
        
        health_status = {
            "status": "healthy" if memory_accessible else "degraded",
            "service": "AI Life Coach",
            "timestamp": time.time(),
            "version": "1.0.0",
            "memory_system": "operational" if memory_accessible else "error",
            "authentication": "enabled"
        }
        
        status_code = 200 if memory_accessible else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logging.error(f"Health check error: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "service": "AI Life Coach",
            "error": "System error"
        }), 503

@app.route("/privacy", methods=["GET"])
def privacy_policy():
    """Privacy policy page"""
    return render_template("privacy.html")

@app.route("/terms", methods=["GET"])
def terms_of_service():
    """Terms of service page"""
    return render_template("terms.html")

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(429)
def rate_limited(error):
    return jsonify({"error": "Rate limit exceeded. Please slow down."}), 429

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500
