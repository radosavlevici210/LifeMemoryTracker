
import os
import json
from datetime import datetime, date
from typing import Dict, Any, List
from memory_manager import MemoryManager
try:
    import openai
except ImportError:
    openai = None

class LifeCoach:
    def __init__(self):
        self.memory_manager = MemoryManager()
        
        # Initialize OpenAI
        if openai and os.getenv("OPENAI_API_KEY"):
            openai.api_key = os.getenv("OPENAI_API_KEY")
            self.openai_available = True
        else:
            self.openai_available = False
            print("Warning: OpenAI API key not found. Using fallback responses.")
    
    def generate_response(self, user_message: str) -> Dict[str, Any]:
        """Generate AI response to user message"""
        try:
            # Save user message to memory
            self.memory_manager.add_life_event(user_message)
            
            if self.openai_available:
                return self._generate_openai_response(user_message)
            else:
                return self._generate_fallback_response(user_message)
                
        except Exception as e:
            print(f"Error generating response: {e}")
            return {
                "success": False,
                "response": "I'm experiencing technical difficulties. Please try again later.",
                "error": str(e)
            }
    
    def _generate_openai_response(self, user_message: str) -> Dict[str, Any]:
        """Generate response using OpenAI API"""
        try:
            # Get recent context
            memory = self.memory_manager.load_memory()
            recent_events = self.memory_manager.get_recent_events(10)
            active_goals = self.memory_manager.get_active_goals()
            
            # Build context
            context = self._build_context(recent_events, active_goals, memory)
            
            # Create system prompt
            system_prompt = f"""You are an AI life coach providing personalized guidance. 
            
Context about the user:
{context}

Guidelines:
- Be empathetic, supportive, and constructive
- Provide actionable advice
- Reference their goals and past experiences when relevant
- Ask thoughtful follow-up questions
- Help them recognize patterns and growth opportunities
- Keep responses conversational and encouraging
"""
            
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Analyze patterns
            self._analyze_patterns(user_message, memory)
            
            return {
                "success": True,
                "response": ai_response,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return self._generate_fallback_response(user_message)
    
    def _generate_fallback_response(self, user_message: str) -> Dict[str, Any]:
        """Generate fallback response when OpenAI is unavailable"""
        # Simple keyword-based responses
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['goal', 'achieve', 'accomplish']):
            response = "That's a great goal! Breaking it down into smaller, manageable steps can help you make steady progress. What's the first small step you could take today?"
        elif any(word in message_lower for word in ['stress', 'worried', 'anxious']):
            response = "I understand you're feeling stressed. Remember that it's normal to feel this way sometimes. Consider taking some deep breaths, and think about what aspects of the situation you can control."
        elif any(word in message_lower for word in ['happy', 'excited', 'great', 'awesome']):
            response = "That's wonderful to hear! It's important to celebrate these positive moments. What do you think contributed to feeling this way?"
        elif any(word in message_lower for word in ['tired', 'exhausted', 'busy']):
            response = "It sounds like you've been working hard. Remember that rest and self-care are just as important as productivity. How can you create some space for yourself today?"
        else:
            response = "Thank you for sharing that with me. Can you tell me more about how this is affecting you? I'm here to listen and help you work through your thoughts."
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "fallback": True
        }
    
    def _build_context(self, recent_events: List[Dict], active_goals: List[Dict], memory: Dict) -> str:
        """Build context string from user's memory"""
        context_parts = []
        
        if recent_events:
            context_parts.append("Recent life updates:")
            for event in recent_events[-5:]:  # Last 5 events
                date_str = event.get('date', '')[:10]  # Just the date part
                context_parts.append(f"- {date_str}: {event.get('entry', '')}")
        
        if active_goals:
            context_parts.append("\nCurrent goals:")
            for goal in active_goals[:3]:  # Top 3 goals
                context_parts.append(f"- {goal.get('goal', '')}")
        
        if memory.get('patterns'):
            context_parts.append(f"\nRecognized patterns: {len(memory['patterns'])} tracked")
        
        return "\n".join(context_parts) if context_parts else "No previous context available."
    
    def _analyze_patterns(self, user_message: str, memory: Dict):
        """Analyze patterns in user behavior"""
        try:
            message_lower = user_message.lower()
            
            # Mood analysis
            positive_words = ['happy', 'excited', 'great', 'awesome', 'good', 'wonderful', 'amazing']
            negative_words = ['sad', 'depressed', 'anxious', 'worried', 'stressed', 'difficult', 'hard']
            
            mood_score = 0
            for word in positive_words:
                if word in message_lower:
                    mood_score += 1
            for word in negative_words:
                if word in message_lower:
                    mood_score -= 1
            
            # Update mood pattern
            mood_pattern = memory.get('patterns', {}).get('mood_trends', {'scores': [], 'dates': []})
            mood_pattern['scores'].append(mood_score)
            mood_pattern['dates'].append(date.today().isoformat())
            
            # Keep only last 30 entries
            if len(mood_pattern['scores']) > 30:
                mood_pattern['scores'] = mood_pattern['scores'][-30:]
                mood_pattern['dates'] = mood_pattern['dates'][-30:]
            
            self.memory_manager.update_pattern('mood_trends', mood_pattern)
            
            # Check for concerning patterns
            if len(mood_pattern['scores']) >= 5:
                recent_scores = mood_pattern['scores'][-5:]
                if all(score < 0 for score in recent_scores):
                    warning = f"Pattern detected: Multiple negative mood indicators in recent entries ({date.today().isoformat()})"
                    if warning not in memory.get("warnings", []):
                        memory["warnings"].append(warning)
                        self.memory_manager.save_memory(memory)
                        
        except Exception as e:
            print(f"Error in pattern analysis: {e}")
    
    def get_memory_summary(self):
        """Get a summary of the user's memory data"""
        memory = self.memory_manager.load_memory()
        recent_events = self.memory_manager.get_recent_events(5)
        active_goals = self.memory_manager.get_active_goals()
        
        return {
            "total_events": len(memory["life_events"]),
            "recent_events": recent_events,
            "active_goals": active_goals,
            "total_goals": len(memory["goals"]),
            "warnings": memory.get("warnings", [])[-3:],  # Last 3 warnings
            "patterns": memory.get("patterns", {})
        }
    
    def add_goal(self, goal_text: str, target_date: str = None):
        """Add a new goal"""
        return self.memory_manager.add_goal(goal_text, target_date)
