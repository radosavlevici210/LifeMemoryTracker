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

    memory_summary = "\n".join([f"{e['date']}: {e['entry']}" for e in memory["life_events"][-5:]])

    system_prompt = (
        f"You are a wise assistant who knows the user's life history and helps them improve their life, avoid danger, and succeed.
"
        f"Today is {today}. Here are the last entries from their life:
{memory_summary}
"
        f"Give powerful and honest advice. Predict what could happen if the user follows bad patterns or good ones. "
        f"Help them make money, find peace, and help others. Think like a life coach, business mentor, and protector."
    )

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
    )

    reply = response.choices[0].message["content"]
    return jsonify({"response": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
