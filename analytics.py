
import json
import statistics
from datetime import datetime, date, timedelta
from collections import Counter, defaultdict
from models import LifeMemoryManager

class LifeAnalytics:
    """Advanced analytics for life coaching insights"""
    
    def __init__(self):
        self.memory_manager = LifeMemoryManager()
    
    def generate_comprehensive_report(self) -> dict:
        """Generate a comprehensive analytics report"""
        memory = self.memory_manager.load_memory()
        
        return {
            "summary": self._generate_summary_stats(memory),
            "mood_analysis": self._analyze_mood_trends(memory),
            "goal_progress": self._analyze_goal_progress(memory),
            "activity_patterns": self._analyze_activity_patterns(memory),
            "growth_metrics": self._calculate_growth_metrics(memory),
            "recommendations": self._generate_data_driven_recommendations(memory),
            "time_analysis": self._analyze_time_patterns(memory),
            "achievement_tracking": self._track_achievements(memory)
        }
    
    def _generate_summary_stats(self, memory):
        """Generate basic summary statistics"""
        life_events = memory.get("life_events", [])
        goals = memory.get("goals", [])
        
        return {
            "total_entries": len(life_events),
            "total_goals": len(goals),
            "active_goals": len([g for g in goals if g.get("status") == "active"]),
            "days_tracked": self._calculate_tracking_days(life_events),
            "average_entries_per_week": self._calculate_weekly_average(life_events),
            "consistency_score": self._calculate_consistency_score(life_events)
        }
    
    def _analyze_mood_trends(self, memory):
        """Analyze mood patterns over time"""
        life_events = memory.get("life_events", [])
        
        positive_words = ["happy", "excited", "grateful", "accomplished", "successful", "motivated", "confident", "proud", "satisfied", "optimistic"]
        negative_words = ["sad", "frustrated", "angry", "stressed", "overwhelmed", "disappointed", "worried", "anxious", "tired", "discouraged"]
        
        mood_data = []
        weekly_mood = defaultdict(list)
        
        for event in life_events:
            text = event["entry"].lower()
            positive_count = sum(1 for word in positive_words if word in text)
            negative_count = sum(1 for word in negative_words if word in text)
            
            mood_score = positive_count - negative_count
            event_date = datetime.fromisoformat(event["date"])
            week = event_date.strftime("%Y-W%U")
            
            mood_data.append({
                "date": event["date"],
                "mood_score": mood_score,
                "positive_indicators": positive_count,
                "negative_indicators": negative_count
            })
            
            weekly_mood[week].append(mood_score)
        
        # Calculate weekly averages
        weekly_averages = {week: statistics.mean(scores) for week, scores in weekly_mood.items()}
        
        return {
            "daily_mood": mood_data[-30:],  # Last 30 entries
            "weekly_averages": dict(list(weekly_averages.items())[-12:]),  # Last 12 weeks
            "overall_trend": self._calculate_trend(list(weekly_averages.values())),
            "mood_volatility": statistics.stdev(list(weekly_averages.values())) if len(weekly_averages) > 1 else 0
        }
    
    def _analyze_goal_progress(self, memory):
        """Analyze goal completion and progress patterns"""
        goals = memory.get("goals", [])
        
        if not goals:
            return {"message": "No goals found for analysis"}
        
        completed_goals = [g for g in goals if g.get("status") == "completed"]
        active_goals = [g for g in goals if g.get("status") == "active"]
        
        # Calculate average time to completion
        completion_times = []
        for goal in completed_goals:
            if goal.get("created_date") and goal.get("completed_date"):
                created = datetime.fromisoformat(goal["created_date"])
                completed = datetime.fromisoformat(goal["completed_date"])
                completion_times.append((completed - created).days)
        
        return {
            "total_goals": len(goals),
            "completed_goals": len(completed_goals),
            "active_goals": len(active_goals),
            "completion_rate": len(completed_goals) / len(goals) * 100 if goals else 0,
            "average_completion_time": statistics.mean(completion_times) if completion_times else 0,
            "goals_by_category": self._categorize_goals(goals),
            "overdue_goals": self._identify_overdue_goals(active_goals)
        }
    
    def _analyze_activity_patterns(self, memory):
        """Analyze user activity and engagement patterns"""
        life_events = memory.get("life_events", [])
        
        if not life_events:
            return {"message": "No activity data available"}
        
        # Activity by day of week
        day_activity = defaultdict(int)
        hour_activity = defaultdict(int)
        
        for event in life_events:
            event_datetime = datetime.fromisoformat(event.get("timestamp", event["date"]))
            day_name = event_datetime.strftime("%A")
            hour = event_datetime.hour
            
            day_activity[day_name] += 1
            hour_activity[hour] += 1
        
        return {
            "activity_by_day": dict(day_activity),
            "activity_by_hour": dict(hour_activity),
            "most_active_day": max(day_activity, key=day_activity.get) if day_activity else None,
            "peak_hour": max(hour_activity, key=hour_activity.get) if hour_activity else None,
            "entry_frequency": self._calculate_entry_frequency(life_events)
        }
    
    def _calculate_growth_metrics(self, memory):
        """Calculate personal growth and development metrics"""
        life_events = memory.get("life_events", [])
        patterns = memory.get("patterns", {})
        
        growth_keywords = ["learned", "improved", "developed", "achieved", "mastered", "overcame", "progress", "growth", "success"]
        challenge_keywords = ["challenge", "difficult", "struggle", "problem", "obstacle", "setback"]
        
        growth_count = 0
        challenge_count = 0
        
        for event in life_events[-30:]:  # Last 30 entries
            text = event["entry"].lower()
            growth_count += sum(1 for word in growth_keywords if word in text)
            challenge_count += sum(1 for word in challenge_keywords if word in text)
        
        return {
            "growth_indicators": growth_count,
            "challenge_mentions": challenge_count,
            "growth_to_challenge_ratio": growth_count / max(challenge_count, 1),
            "resilience_score": self._calculate_resilience_score(life_events),
            "learning_frequency": self._calculate_learning_frequency(life_events),
            "skill_development_areas": self._identify_skill_areas(life_events)
        }
    
    def _generate_data_driven_recommendations(self, memory):
        """Generate personalized recommendations based on data analysis"""
        recommendations = []
        
        # Analyze mood trends
        mood_analysis = self._analyze_mood_trends(memory)
        if mood_analysis.get("overall_trend", 0) < 0:
            recommendations.append({
                "type": "mood",
                "priority": "high",
                "recommendation": "Your mood trend shows decline. Consider scheduling activities that typically boost your mood."
            })
        
        # Analyze goal progress
        goal_analysis = self._analyze_goal_progress(memory)
        if goal_analysis.get("completion_rate", 0) < 50:
            recommendations.append({
                "type": "goals",
                "priority": "medium",
                "recommendation": "Your goal completion rate is low. Consider breaking goals into smaller, more manageable tasks."
            })
        
        # Analyze activity patterns
        activity_analysis = self._analyze_activity_patterns(memory)
        entry_frequency = activity_analysis.get("entry_frequency", {})
        if entry_frequency.get("days_since_last", 0) > 7:
            recommendations.append({
                "type": "engagement",
                "priority": "medium",
                "recommendation": "You haven't logged an entry in a while. Regular reflection helps maintain progress."
            })
        
        return recommendations
    
    def _calculate_tracking_days(self, life_events):
        """Calculate number of unique days with entries"""
        if not life_events:
            return 0
        
        unique_dates = set(event["date"] for event in life_events)
        return len(unique_dates)
    
    def _calculate_weekly_average(self, life_events):
        """Calculate average entries per week"""
        if not life_events:
            return 0
        
        first_date = datetime.fromisoformat(life_events[0]["date"])
        last_date = datetime.fromisoformat(life_events[-1]["date"])
        weeks = (last_date - first_date).days / 7
        
        return len(life_events) / max(weeks, 1)
    
    def _calculate_consistency_score(self, life_events):
        """Calculate consistency score (0-100)"""
        if len(life_events) < 7:
            return 0
        
        # Calculate gaps between entries
        dates = [datetime.fromisoformat(event["date"]) for event in life_events]
        dates.sort()
        
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        avg_gap = statistics.mean(gaps)
        
        # Score based on average gap (lower is better)
        consistency_score = max(0, 100 - (avg_gap * 10))
        return min(100, consistency_score)
    
    def _calculate_trend(self, values):
        """Calculate simple trend direction"""
        if len(values) < 2:
            return "insufficient_data"
        
        # Simple linear trend
        n = len(values)
        sum_x = sum(range(n))
        sum_y = sum(values)
        sum_xy = sum(i * values[i] for i in range(n))
        sum_x2 = sum(i * i for i in range(n))
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        
        if slope > 0.1:
            return "improving"
        elif slope < -0.1:
            return "declining"
        else:
            return "stable"
    
    def _categorize_goals(self, goals):
        """Categorize goals by type"""
        categories = defaultdict(int)
        
        for goal in goals:
            goal_text = goal["goal"].lower()
            if any(word in goal_text for word in ["career", "job", "work", "professional"]):
                categories["career"] += 1
            elif any(word in goal_text for word in ["health", "fitness", "exercise", "diet"]):
                categories["health"] += 1
            elif any(word in goal_text for word in ["relationship", "family", "friend", "social"]):
                categories["relationships"] += 1
            elif any(word in goal_text for word in ["learn", "skill", "education", "course"]):
                categories["learning"] += 1
            else:
                categories["personal"] += 1
        
        return dict(categories)
    
    def _identify_overdue_goals(self, active_goals):
        """Identify goals that are overdue"""
        overdue = []
        today = date.today()
        
        for goal in active_goals:
            if goal.get("target_date"):
                target = datetime.fromisoformat(goal["target_date"]).date()
                if target < today:
                    overdue.append({
                        "goal": goal["goal"],
                        "target_date": goal["target_date"],
                        "days_overdue": (today - target).days
                    })
        
        return overdue
    
    def _calculate_entry_frequency(self, life_events):
        """Calculate entry frequency metrics"""
        if not life_events:
            return {}
        
        last_entry = datetime.fromisoformat(life_events[-1]["date"])
        days_since_last = (date.today() - last_entry.date()).days
        
        # Calculate average days between entries
        dates = [datetime.fromisoformat(event["date"]) for event in life_events]
        dates.sort()
        
        if len(dates) > 1:
            gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_gap = statistics.mean(gaps)
        else:
            avg_gap = 0
        
        return {
            "days_since_last": days_since_last,
            "average_gap": avg_gap,
            "frequency_score": max(0, 100 - (avg_gap * 5))
        }
    
    def _calculate_resilience_score(self, life_events):
        """Calculate resilience based on recovery from challenges"""
        if len(life_events) < 5:
            return 50  # Default score
        
        challenge_words = ["problem", "difficult", "struggle", "setback", "failed"]
        recovery_words = ["solved", "overcame", "better", "improved", "learned"]
        
        resilience_events = 0
        total_challenges = 0
        
        for i, event in enumerate(life_events):
            text = event["entry"].lower()
            if any(word in text for word in challenge_words):
                total_challenges += 1
                # Look for recovery in next few entries
                for j in range(i+1, min(i+4, len(life_events))):
                    next_text = life_events[j]["entry"].lower()
                    if any(word in next_text for word in recovery_words):
                        resilience_events += 1
                        break
        
        if total_challenges == 0:
            return 75  # No challenges mentioned
        
        return (resilience_events / total_challenges) * 100
    
    def _calculate_learning_frequency(self, life_events):
        """Calculate how often learning/growth is mentioned"""
        learning_words = ["learned", "discovered", "realized", "understood", "insight", "knowledge"]
        
        learning_count = 0
        for event in life_events[-30:]:  # Last 30 entries
            text = event["entry"].lower()
            if any(word in text for word in learning_words):
                learning_count += 1
        
        return (learning_count / min(30, len(life_events))) * 100 if life_events else 0
    
    def _identify_skill_areas(self, life_events):
        """Identify skill development areas mentioned"""
        skill_words = {
            "technical": ["programming", "coding", "software", "computer", "technical", "digital"],
            "communication": ["presentation", "speaking", "writing", "communication", "meeting"],
            "leadership": ["leadership", "management", "team", "leading", "mentoring"],
            "creative": ["design", "creative", "art", "writing", "innovation"],
            "analytical": ["analysis", "data", "research", "problem-solving", "critical thinking"]
        }
        
        skill_mentions = defaultdict(int)
        
        for event in life_events[-50:]:  # Last 50 entries
            text = event["entry"].lower()
            for category, words in skill_words.items():
                if any(word in text for word in words):
                    skill_mentions[category] += 1
        
        return dict(skill_mentions)
    
    def _track_achievements(self, memory):
        """Track and categorize achievements"""
        life_events = memory.get("life_events", [])
        achievement_words = ["achieved", "accomplished", "completed", "finished", "succeeded", "won", "graduated", "promoted"]
        
        achievements = []
        for event in life_events:
            text = event["entry"].lower()
            if any(word in text for word in achievement_words):
                achievements.append({
                    "date": event["date"],
                    "achievement": event["entry"],
                    "type": event.get("type", "general")
                })
        
        # Group by month
        monthly_achievements = defaultdict(int)
        for achievement in achievements:
            month = datetime.fromisoformat(achievement["date"]).strftime("%Y-%m")
            monthly_achievements[month] += 1
        
        return {
            "total_achievements": len(achievements),
            "recent_achievements": achievements[-10:],  # Last 10
            "monthly_counts": dict(monthly_achievements),
            "achievement_rate": len(achievements) / max(len(life_events), 1) * 100
        }
    
    def generate_weekly_report(self) -> dict:
        """Generate a focused weekly progress report"""
        memory = self.memory_manager.load_memory()
        
        # Get events from last 7 days
        week_ago = date.today() - timedelta(days=7)
        recent_events = [
            event for event in memory.get("life_events", [])
            if datetime.fromisoformat(event["date"]).date() >= week_ago
        ]
        
        return {
            "period": "Weekly Report",
            "date_range": f"{week_ago.isoformat()} to {date.today().isoformat()}",
            "entries_this_week": len(recent_events),
            "mood_summary": self._analyze_weekly_mood(recent_events),
            "achievements": self._extract_weekly_achievements(recent_events),
            "challenges": self._extract_weekly_challenges(recent_events),
            "goals_worked_on": self._identify_goals_mentioned(recent_events, memory),
            "next_week_focus": self._suggest_next_week_focus(recent_events, memory)
        }
    
    def _analyze_weekly_mood(self, recent_events):
        """Analyze mood for the week"""
        if not recent_events:
            return "No entries this week"
        
        positive_words = ["happy", "excited", "accomplished", "grateful", "successful"]
        negative_words = ["stressed", "frustrated", "tired", "overwhelmed", "disappointed"]
        
        positive_count = 0
        negative_count = 0
        
        for event in recent_events:
            text = event["entry"].lower()
            positive_count += sum(1 for word in positive_words if word in text)
            negative_count += sum(1 for word in negative_words if word in text)
        
        if positive_count > negative_count:
            return "Predominantly positive"
        elif negative_count > positive_count:
            return "Some challenges noted"
        else:
            return "Balanced week"
    
    def _extract_weekly_achievements(self, recent_events):
        """Extract achievements from recent events"""
        achievement_words = ["achieved", "completed", "finished", "accomplished", "succeeded"]
        achievements = []
        
        for event in recent_events:
            text = event["entry"].lower()
            if any(word in text for word in achievement_words):
                achievements.append(event["entry"])
        
        return achievements[:5]  # Top 5
    
    def _extract_weekly_challenges(self, recent_events):
        """Extract challenges from recent events"""
        challenge_words = ["difficult", "challenging", "struggle", "problem", "obstacle"]
        challenges = []
        
        for event in recent_events:
            text = event["entry"].lower()
            if any(word in text for word in challenge_words):
                challenges.append(event["entry"])
        
        return challenges[:3]  # Top 3
    
    def _identify_goals_mentioned(self, recent_events, memory):
        """Identify which goals were mentioned in recent entries"""
        goals = memory.get("goals", [])
        mentioned_goals = []
        
        for goal in goals:
            goal_keywords = goal["goal"].lower().split()[:3]  # First 3 words
            for event in recent_events:
                if any(keyword in event["entry"].lower() for keyword in goal_keywords):
                    mentioned_goals.append(goal["goal"])
                    break
        
        return mentioned_goals
    
    def _suggest_next_week_focus(self, recent_events, memory):
        """Suggest focus areas for next week"""
        suggestions = []
        
        # If no entries this week, suggest consistency
        if len(recent_events) < 3:
            suggestions.append("Increase daily reflection consistency")
        
        # Check goal progress
        active_goals = [g for g in memory.get("goals", []) if g.get("status") == "active"]
        mentioned_goals = self._identify_goals_mentioned(recent_events, memory)
        
        unmentioned_goals = [g["goal"] for g in active_goals if g["goal"] not in mentioned_goals]
        if unmentioned_goals:
            suggestions.append(f"Work on neglected goal: {unmentioned_goals[0]}")
        
        # Check for repeated challenges
        challenge_words = ["difficult", "challenging", "struggle"]
        repeated_challenges = []
        for event in recent_events:
            text = event["entry"].lower()
            if any(word in text for word in challenge_words):
                repeated_challenges.append(text)
        
        if len(repeated_challenges) > 2:
            suggestions.append("Address recurring challenges with specific action plans")
        
        return suggestions[:3] if suggestions else ["Continue current positive momentum"]
