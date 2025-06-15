from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import datetime
import json
import os

app = Flask(__name__)
CORS(app)

openai.api_key = "your-openai-api-key"  # Replace this with your OpenAI key

MEMORY_FILE = "life_memory.json"

def load_memory():
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "r") as f:
            return json.load(f)
    return {"life_events": [], "goals": [], "warnings": []}

def save_memory(data):
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json["message"]
    today = datetime.date.today().isoformat()

    memory = load_memory()
    memory["life_events"].append({"date": today, "entry": user_input})
    save_memory(memory)

    recent_entries = memory["life_events"][-10:]
    memory_summary = "\n".join([f"{e['date']}: {e['entry']}" for e in recent_entries])

    prediction_prompt = (
        f"You are a predictive assistant. Based on the user's last 10 life updates:

"
        f"{memory_summary}

"
        f"Predict what could happen in the user's life in the next 7 to 30 days. "
        f"Think deeply about patterns, emotions, behaviors, and possible consequences. "
        f"Then, give clear advice on how the user can succeed, avoid danger, and improve their life. "
        f"Do not be vague. Be direct, wise, and helpful. Always encourage positive transformation."
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
