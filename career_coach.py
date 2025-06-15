
#!/usr/bin/env python3
"""
AI Life Coach - Career Coaching Module

Copyright (c) 2025 Ervin Remu Radosavlevici
Licensed under the MIT License
"""

import os
import json
from datetime import date, datetime
from openai import OpenAI
from models import LifeMemoryManager

class CareerCoach:
    """Specialized AI Career Coach for professional development"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "your-openai-api-key"))
        self.model = "gpt-4o"
        self.memory_manager = LifeMemoryManager()
    
    def analyze_career_path(self, user_input: str) -> dict:
        """Analyze career progression and provide professional guidance"""
        try:
            # Save career-related input
            self.memory_manager.add_life_event(user_input, "career")
            
            # Get career-specific context
            career_events = self._get_career_events()
            professional_goals = self._get_professional_goals()
            skill_assessments = self._get_skill_assessments()
            
            context = self._build_career_context(career_events, professional_goals, skill_assessments)
            system_prompt = self._create_career_system_prompt(context)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                max_tokens=1000,
                temperature=0.6
            )
            
            ai_response = response.choices[0].message.content
            
            # Analyze career patterns
            self._analyze_career_patterns(user_input, career_events)
            
            return {
                "success": True,
                "response": ai_response,
                "career_insights": self._generate_career_insights(career_events),
                "skill_recommendations": self._recommend_skills(),
                "next_steps": self._suggest_next_steps()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Career analysis failed: {str(e)}",
                "response": "I'm having trouble analyzing your career path. Please try again."
            }
    
    def _get_career_events(self):
        """Get career-related events from memory"""
        memory = self.memory_manager.load_memory()
        return [event for event in memory["life_events"] if event.get("type") == "career"]
    
    def _get_professional_goals(self):
        """Get professional goals"""
        memory = self.memory_manager.load_memory()
        return [goal for goal in memory["goals"] if "career" in goal["goal"].lower() or "job" in goal["goal"].lower()]
    
    def _get_skill_assessments(self):
        """Get skill-related patterns"""
        memory = self.memory_manager.load_memory()
        return memory.get("patterns", {}).get("skills", {})
    
    def _build_career_context(self, career_events, professional_goals, skill_assessments):
        """Build career-specific context"""
        context = f"Career Analysis Date: {date.today().isoformat()}\n\n"
        
        if career_events:
            context += "Career History:\n"
            for event in career_events[-10:]:  # Last 10 career events
                context += f"- {event['date']}: {event['entry']}\n"
            context += "\n"
        
        if professional_goals:
            context += "Professional Goals:\n"
            for goal in professional_goals:
                context += f"- {goal['goal']} (Target: {goal.get('target_date', 'Not set')})\n"
            context += "\n"
        
        if skill_assessments:
            context += "Skill Assessment Data:\n"
            for skill, data in skill_assessments.items():
                context += f"- {skill}: {data}\n"
            context += "\n"
        
        return context
    
    def _create_career_system_prompt(self, context):
        """Create specialized career coaching prompt"""
        return f"""You are an expert career coach and professional development advisor with 15+ years of experience helping professionals advance their careers across various industries.

{context}

Your expertise includes:
- Career path planning and strategy
- Skill development and gap analysis
- Interview preparation and negotiation
- Leadership development
- Industry trend analysis
- Professional networking strategies
- Work-life balance optimization

Guidelines for career coaching:
1. Provide specific, actionable career advice
2. Identify skill gaps and recommend development paths
3. Suggest concrete next steps for career advancement
4. Address both short-term tactics and long-term strategy
5. Consider industry trends and market demands
6. Help with professional goal setting and achievement
7. Provide honest feedback about career decisions
8. Encourage continuous learning and adaptation
9. Address workplace challenges constructively
10. Balance ambition with realistic expectations

Focus on practical guidance that leads to measurable career progress."""
    
    def _analyze_career_patterns(self, current_input, career_events):
        """Analyze career progression patterns"""
        try:
            career_keywords = {
                "growth": ["promotion", "raise", "advancement", "leadership", "management"],
                "learning": ["course", "training", "certification", "skill", "education"],
                "challenges": ["stress", "conflict", "difficulty", "struggle", "problem"],
                "networking": ["meeting", "conference", "connection", "mentor", "colleague"],
                "transitions": ["interview", "application", "job search", "career change"]
            }
            
            pattern_analysis = {}
            recent_text = " ".join([event["entry"].lower() for event in career_events[-5:]])
            current_text = current_input.lower()
            all_text = recent_text + " " + current_text
            
            for category, keywords in career_keywords.items():
                count = sum(1 for keyword in keywords if keyword in all_text)
                pattern_analysis[category] = count
            
            self.memory_manager.update_pattern("career_focus", pattern_analysis)
            
        except Exception as e:
            print(f"Career pattern analysis error: {e}")
    
    def _generate_career_insights(self, career_events):
        """Generate insights from career data"""
        if len(career_events) < 3:
            return ["Build more career history to generate insights"]
        
        insights = []
        recent_events = career_events[-5:]
        
        # Analyze frequency of career updates
        if len(recent_events) >= 3:
            insights.append("Active career development - regular professional updates")
        
        # Check for growth indicators
        growth_words = ["promotion", "raise", "new role", "leadership"]
        if any(word in event["entry"].lower() for event in recent_events for word in growth_words):
            insights.append("Positive career trajectory detected")
        
        return insights
    
    def _recommend_skills(self):
        """Recommend skills based on career patterns"""
        memory = self.memory_manager.load_memory()
        patterns = memory.get("patterns", {}).get("career_focus", {})
        
        recommendations = []
        
        if patterns.get("leadership", 0) > 0:
            recommendations.append("Leadership and team management skills")
        
        if patterns.get("learning", 0) > 2:
            recommendations.append("Continuous learning mindset - consider advanced certifications")
        
        if patterns.get("networking", 0) < 1:
            recommendations.append("Professional networking and relationship building")
        
        return recommendations or ["Focus on core technical skills in your field"]
    
    def _suggest_next_steps(self):
        """Suggest specific career next steps"""
        return [
            "Update your resume with recent achievements",
            "Set up informational interviews in your target field",
            "Identify 2-3 key skills to develop this quarter",
            "Establish regular career check-ins with your manager"
        ]
    
    def create_career_plan(self, timeframe: str = "6months") -> dict:
        """Create a structured career development plan"""
        try:
            memory = self.memory_manager.load_memory()
            career_events = self._get_career_events()
            professional_goals = self._get_professional_goals()
            
            plan_prompt = f"""Based on the user's career history and goals, create a detailed {timeframe} career development plan.
            
Career History: {json.dumps(career_events[-5:], default=str)}
Current Goals: {json.dumps(professional_goals, default=str)}

Create a structured plan with:
1. Immediate actions (next 30 days)
2. Short-term goals (1-3 months)
3. Medium-term objectives (3-6 months)
4. Skill development priorities
5. Networking targets
6. Measurement criteria

Format as actionable steps with specific timelines."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are creating a professional career development plan. Be specific and actionable."},
                    {"role": "user", "content": plan_prompt}
                ],
                max_tokens=1200,
                temperature=0.5
            )
            
            plan = response.choices[0].message.content
            
            # Save the plan
            career_plan = {
                "plan": plan,
                "created_date": date.today().isoformat(),
                "timeframe": timeframe,
                "status": "active"
            }
            
            memory["career_plans"] = memory.get("career_plans", [])
            memory["career_plans"].append(career_plan)
            self.memory_manager.save_memory(memory)
            
            return {
                "success": True,
                "plan": plan,
                "plan_id": len(memory["career_plans"])
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create career plan: {str(e)}"
            }
