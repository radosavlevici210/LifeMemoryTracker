
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

class MemoryManager:
    def __init__(self, memory_file="life_memory.json"):
        self.memory_file = memory_file
        self.default_memory = {
            "life_events": [],
            "goals": [],
            "patterns": {},
            "warnings": [],
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
    
    def load_memory(self) -> Dict[str, Any]:
        """Load memory from file or create default"""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    memory = json.load(f)
                    # Ensure all required keys exist
                    for key, value in self.default_memory.items():
                        if key not in memory:
                            memory[key] = value
                    return memory
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading memory file: {e}")
                return self.default_memory.copy()
        return self.default_memory.copy()
    
    def save_memory(self, memory: Dict[str, Any]) -> bool:
        """Save memory to file"""
        try:
            memory["last_updated"] = datetime.now().isoformat()
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(memory, f, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"Error saving memory file: {e}")
            return False
    
    def add_life_event(self, event_text: str) -> bool:
        """Add a life event to memory"""
        memory = self.load_memory()
        
        event = {
            "id": len(memory["life_events"]) + 1,
            "date": datetime.now().isoformat(),
            "entry": event_text,
            "timestamp": datetime.now().isoformat()
        }
        
        memory["life_events"].append(event)
        return self.save_memory(memory)
    
    def add_goal(self, goal_text: str, target_date: str = None) -> bool:
        """Add a goal to memory"""
        memory = self.load_memory()
        
        goal = {
            "id": len(memory["goals"]) + 1,
            "goal": goal_text,
            "status": "active",
            "created_date": datetime.now().isoformat(),
            "target_date": target_date,
            "progress": 0
        }
        
        memory["goals"].append(goal)
        return self.save_memory(memory)
    
    def get_recent_events(self, limit: int = 10) -> List[Dict]:
        """Get recent life events"""
        memory = self.load_memory()
        return memory["life_events"][-limit:] if memory["life_events"] else []
    
    def get_active_goals(self) -> List[Dict]:
        """Get active goals"""
        memory = self.load_memory()
        return [goal for goal in memory["goals"] if goal.get("status") == "active"]
    
    def update_pattern(self, pattern_name: str, pattern_data: Dict) -> bool:
        """Update a pattern in memory"""
        memory = self.load_memory()
        
        memory["patterns"][pattern_name] = {
            "data": pattern_data,
            "last_updated": datetime.now().isoformat()
        }
        
        return self.save_memory(memory)
    
    def get_memory_stats(self) -> Dict[str, int]:
        """Get basic memory statistics"""
        memory = self.load_memory()
        
        return {
            "total_events": len(memory["life_events"]),
            "total_goals": len(memory["goals"]),
            "active_goals": len([g for g in memory["goals"] if g.get("status") == "active"]),
            "patterns_tracked": len(memory["patterns"]),
            "warnings": len(memory["warnings"])
        }
