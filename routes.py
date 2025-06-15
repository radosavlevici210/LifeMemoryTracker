from flask import render_template, request, jsonify
from app import app
from life_coach import LifeCoach

# Initialize the life coach
life_coach = LifeCoach()

@app.route("/")
def index():
    """Main page route"""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """Handle chat messages"""
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
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}",
            "response": "I'm experiencing technical difficulties. Please try again."
        }), 500

@app.route("/memory", methods=["GET"])
def get_memory():
    """Get memory summary"""
    try:
        summary = life_coach.get_memory_summary()
        return jsonify(summary)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "AI Life Coach"})
