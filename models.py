import json
import os
from datetime import datetime, date
from typing import Dict, List, Any

class LifeMemoryManager:
    """Manages persistent storage of user's life events, goals, and patterns"""
    
    def __init__(self, user_id=None, memory_file: str = "life_memory.json"):
        self.user_id = user_id
        self.memory_file = memory_file
        self.default_structure = {
            "life_events": [],
            "goals": [],
            "warnings": [],
            "patterns": {},
            "user_profile": {
                "name": "",
                "preferences": {},
                "coaching_style": "supportive"
            }
        }
    
    def load_memory(self) -> Dict[str, Any]:
        """Load memory from JSON file or return default structure"""
        try:
            if os.path.exists(self.memory_file):
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Ensure all required keys exist
                    for key in self.default_structure:
                        if key not in data:
                            data[key] = self.default_structure[key]
                    return data
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading memory file: {e}")
        
        return self.default_structure.copy()
    
    def save_memory(self, data: Dict[str, Any]) -> bool:
        """Save memory to JSON file"""
        try:
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            return True
        except IOError as e:
            print(f"Error saving memory file: {e}")
            return False
    
    def add_life_event(self, entry: str, event_type: str = "general") -> bool:
        """Add a new life event with timestamp"""
        memory = self.load_memory()
        today = date.today().isoformat()
        
        event = {
            "date": today,
            "timestamp": datetime.now().isoformat(),
            "entry": entry,
            "type": event_type
        }
        
        memory["life_events"].append(event)
        return self.save_memory(memory)
    
    def get_recent_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get the most recent life events"""
        memory = self.load_memory()
        return memory["life_events"][-limit:] if memory["life_events"] else []
    
    def add_goal(self, goal: str, target_date: str = None) -> bool:
        """Add a new goal"""
        memory = self.load_memory()
        goal_entry = {
            "id": len(memory["goals"]) + 1,
            "goal": goal,
            "created_date": date.today().isoformat(),
            "target_date": target_date,
            "status": "active",
            "progress": 0
        }
        
        memory["goals"].append(goal_entry)
        return self.save_memory(memory)
    
    def get_active_goals(self) -> List[Dict[str, Any]]:
        """Get all active goals"""
        memory = self.load_memory()
        return [goal for goal in memory["goals"] if goal.get("status") == "active"]
    
    def update_pattern(self, pattern_name: str, data: Any) -> bool:
        """Update or add a pattern analysis"""
        memory = self.load_memory()
        memory["patterns"][pattern_name] = {
            "data": data,
            "last_updated": datetime.now().isoformat()
        }
        return self.save_memory(memory)