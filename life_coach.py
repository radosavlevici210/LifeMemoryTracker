#!/usr/bin/env python3
"""
AI Life Coach - Main AI Logic

Copyright (c) 2025 Ervin Remu Radosavlevici
Licensed under the MIT License
"""

import os
import json
from datetime import date
from openai import OpenAI
from models import LifeMemoryManager

class LifeCoach:
    """AI Life Coach using OpenAI GPT for personalized advice"""
    
    def __init__(self):
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key"))
        self.model = "gpt-4o"
        self.memory_manager = LifeMemoryManager()
    
    def generate_response(self, user_input: str) -> dict:
        """Generate AI response based on user input and memory"""
        try:
            # Save user input to memory
            self.memory_manager.add_life_event(user_input)
            
            # Get context from memory
            recent_events = self.memory_manager.get_recent_events(10)
            active_goals = self.memory_manager.get_active_goals()
            memory = self.memory_manager.load_memory()
            
            # Build context summary
            context = self._build_context(recent_events, active_goals, memory)
            
            # Create system prompt
            system_prompt = self._create_system_prompt(context)
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                max_tokens=800,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Analyze patterns and update warnings if needed
            self._analyze_patterns(user_input, recent_events)
            
            return {
                "success": True,
                "response": ai_response,
                "context_events": len(recent_events),
                "active_goals": len(active_goals)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to generate response: {str(e)}",
                "response": "I'm having trouble connecting right now. Please try again in a moment."
            }
    
    def _build_context(self, recent_events, active_goals, memory):
        """Build context string from user's history"""
        context = f"Today is {date.today().isoformat()}.\n\n"
        
        if recent_events:
            context += "Recent life events:\n"
            for event in recent_events:
                context += f"- {event['date']}: {event['entry']}\n"
            context += "\n"
        
        if active_goals:
            context += "Active goals:\n"
            for goal in active_goals:
                context += f"- {goal['goal']} (created: {goal['created_date']})\n"
            context += "\n"
        
        if memory.get("warnings"):
            context += "Previous warnings/concerns:\n"
            for warning in memory["warnings"][-3:]:  # Last 3 warnings
                context += f"- {warning}\n"
            context += "\n"
        
        return context
    
    def _create_system_prompt(self, context):
        """Create the system prompt for the AI"""
        return f"""You are a wise, experienced life coach and mentor. Your role is to provide personalized, actionable advice to help users improve their lives, achieve their goals, and avoid potential pitfalls.

{context}

Guidelines for your responses:
1. Be supportive but honest - don't sugarcoat important truths
2. Provide specific, actionable advice rather than generic platitudes
3. Identify patterns in the user's behavior and point them out constructively
4. Help predict potential consequences of current behaviors/decisions
5. Encourage positive transformation and personal growth
6. Address both immediate concerns and long-term wellbeing
7. Consider their goals when giving advice
8. Be direct but compassionate
9. If you notice concerning patterns, address them with care
10. Celebrate progress and positive changes

Remember: You're not just answering questions, you're helping guide someone's life journey. Make your advice count."""
    
    def _analyze_patterns(self, current_input, recent_events):
        """Analyze patterns in user behavior and update warnings"""
        try:
            # Simple pattern detection (can be enhanced)
            negative_keywords = ["stressed", "overwhelmed", "anxious", "depressed", "tired", "frustrated", "angry", "sad"]
            positive_keywords = ["happy", "excited", "accomplished", "grateful", "motivated", "productive", "successful"]
            
            recent_text = " ".join([event["entry"].lower() for event in recent_events[-5:]])
            current_text = current_input.lower()
            
            negative_count = sum(1 for keyword in negative_keywords if keyword in recent_text + " " + current_text)
            positive_count = sum(1 for keyword in positive_keywords if keyword in recent_text + " " + current_text)
            
            # Update patterns
            self.memory_manager.update_pattern("mood_trend", {
                "negative_indicators": negative_count,
                "positive_indicators": positive_count,
                "recent_entries": len(recent_events)
            })
            
            # Add warning if concerning pattern detected
            if negative_count >= 3 and positive_count == 0:
                memory = self.memory_manager.load_memory()
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
