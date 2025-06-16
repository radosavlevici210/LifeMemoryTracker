from flask import render_template, request, jsonify, session, redirect, url_for, flash
from app import app
from life_coach import LifeCoach
from career_coach import CareerCoach
from analytics import LifeAnalytics
import time
import logging

# Initialize components
life_coach = LifeCoach()
career_coach = CareerCoach()
analytics = LifeAnalytics()

@app.route("/")
def index():
    """Main application page"""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chat messages"""
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"success": False, "error": "No message provided"}), 400

        user_message = data["message"].strip()
        if not user_message:
            return jsonify({"success": False, "error": "Empty message"}), 400

        if len(user_message) > 2000:
            return jsonify({"success": False, "error": "Message too long"}), 400

        response = life_coach.generate_response(user_message)
        return jsonify(response)

    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Service temporarily unavailable",
            "response": "I'm experiencing technical difficulties. Please try again."
        }), 500

@app.route("/career", methods=["POST"])
def career_coaching():
    """Handle career coaching requests"""
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"success": False, "error": "No message provided"}), 400

        user_message = data["message"].strip()
        if not user_message:
            return jsonify({"success": False, "error": "Empty message"}), 400

        if len(user_message) > 2000:
            return jsonify({"success": False, "error": "Message too long"}), 400

        response = career_coach.analyze_career_path(user_message)
        return jsonify(response)

    except Exception as e:
        logging.error(f"Career coaching error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Service temporarily unavailable",
            "response": "Career analysis is temporarily unavailable. Please try again."
        }), 500

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
        return jsonify({"success": False, "error": "Service error"}), 500

@app.route("/memory", methods=["GET"])
def get_memory():
    """Get memory summary"""
    try:
        summary = life_coach.get_memory_summary()
        return jsonify(summary)
    except Exception as e:
        logging.error(f"Memory error: {str(e)}")
        return jsonify({"error": "Failed to load memory"}), 500

@app.route("/analytics", methods=["GET"])
def get_analytics():
    """Get analytics report"""
    try:
        report_type = request.args.get('type', 'comprehensive')

        if report_type == 'weekly':
            report = analytics.generate_weekly_report()
        else:
            report = analytics.generate_comprehensive_report()

        return jsonify({
            "success": True,
            "report": report,
            "generated_at": time.time()
        })

    except Exception as e:
        logging.error(f"Analytics error: {str(e)}")
        return jsonify({"error": "Failed to generate analytics"}), 500



@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        memory_accessible = life_coach.memory_manager.load_memory() is not None

        health_status = {
            "status": "healthy" if memory_accessible else "degraded",
            "service": "AI Life Coach",
            "timestamp": time.time(),
            "version": "1.0.0",
            "memory_system": "operational" if memory_accessible else "error"
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

@app.route("/privacy")
def privacy_policy():
    """Privacy policy page"""
    return render_template("privacy.html")

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logging.error(f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500