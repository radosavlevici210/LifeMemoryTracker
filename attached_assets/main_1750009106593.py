from flask import Flask, request, jsonify, session
from flask_cors import CORS
import openai
import datetime
import json
import os

app = Flask(__name__)
app.secret_key = "super-secret-key"  # Change this for real deployment
CORS(app)

openai.api_key = "your-openai-api-key"  # Replace this with your OpenAI key

MEMORY_FILE = "life_memory.json"
USAGE_LOG = "usage_log.json"
USERS_FILE = "users.json"

def load_file(path, default):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return default

def save_file(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    device = data.get("device", "unknown")
    account = data.get("bank_account", "not provided")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    users = load_file(USERS_FILE, [])
    timestamp = datetime.datetime.now().isoformat()
    users.append({
        "email": email,
        "device": device,
        "bank_account": account,
        "ip": request.remote_addr,
        "timestamp": timestamp
    })
    save_file(USERS_FILE, users)
    session["user_email"] = email
    return jsonify({"message": "Registered and logged in successfully"})

@app.route("/chat", methods=["POST"])
def chat():
    if "user_email" not in session:
        return jsonify({"error": "Not authenticated"}), 403

    user_input = request.json.get("message", "No message")
    user_email = session["user_email"]
    user_ip = request.remote_addr
    timestamp = datetime.datetime.now().isoformat()

    memory = load_file(MEMORY_FILE, {"life_events": [], "goals": [], "warnings": []})
    usage_log = load_file(USAGE_LOG, [])

    memory["life_events"].append({"date": timestamp, "entry": user_input})
    usage_log.append({
        "timestamp": timestamp,
        "email": user_email,
        "ip": user_ip,
        "message": user_input
    })

    save_file(MEMORY_FILE, memory)
    save_file(USAGE_LOG, usage_log)

    recent_entries = memory["life_events"][-10:]
    memory_summary = "\n".join([f"{e['date']}: {e['entry']}" for e in recent_entries])

    prediction_prompt = (
        f"You are a predictive assistant. Based on the user's last 10 life updates:\n\n"
        f"{memory_summary}\n\n"
        f"Predict what could happen in the user's life in the next 7 to 30 days. "
        f"Give warnings and advice. Help the user succeed and avoid risk."
    )

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prediction_prompt},
            {"role": "user", "content": user_input}
        ]
    )

    reply = response.choices[0].message["content"]
    return jsonify({"response": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
