# AI Life Coach

An intelligent life coaching web application that provides personalized advice and guidance based on your conversation history and goals. Built with Flask, OpenAI GPT-4o, and a modern responsive interface.

## 🌟 Features

- **Intelligent Conversations**: Chat with an AI life coach powered by OpenAI's GPT-4o
- **Memory System**: Persistent storage of your life events, goals, and patterns
- **Goal Tracking**: Set, track, and monitor your personal and professional goals
- **Pattern Analysis**: AI analyzes your behavior patterns and provides insights
- **Responsive Design**: Modern, dark-themed interface that works on all devices
- **Data Security**: Local JSON storage with secure API key management

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-life-coach
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export SESSION_SECRET="your-session-secret"
   ```

4. **Run the application**
   ```bash
   python main.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `SESSION_SECRET` | Secret key for session management | No (auto-generated in dev) |

### Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and use in your environment

## 📁 Project Structure

```
ai-life-coach/
├── app.py              # Flask application setup
├── main.py             # Application entry point
├── routes.py           # API routes and endpoints
├── models.py           # Data models and memory management
├── life_coach.py       # AI coaching logic and OpenAI integration
├── life_memory.json    # User data storage (created automatically)
├── requirements.txt    # Python dependencies
├── static/             # Static assets
│   ├── css/
│   │   └── style.css   # Custom styles
│   └── js/
│       └── app.js      # Frontend JavaScript
└── templates/          # HTML templates
    ├── base.html       # Base template
    └── index.html      # Main interface
```

## 🎯 Usage

### Starting a Conversation

1. Open the application in your browser
2. Type your message in the text area
3. Click "Send" or press Enter
4. The AI coach will respond with personalized advice

### Setting Goals

1. Click the target icon or "Add Goal" button
2. Enter your goal description
3. Optionally set a target date
4. Save the goal

### Viewing Progress

1. Click "Progress" in the navigation or sidebar
2. View your conversation history, goals, and patterns
3. Monitor your personal development journey

## 🔒 Security Features

- **API Key Protection**: Environment variable storage
- **Local Data Storage**: No cloud dependencies for personal data
- **Session Management**: Secure session handling
- **Input Validation**: Proper sanitization of user inputs

## 🌐 Deployment

### Replit Deployment (Recommended)

This application is optimized for Replit deployment:

1. Fork/import the project to Replit
2. Add your `OPENAI_API_KEY` in Replit Secrets
3. Click "Run" or use Replit's deployment feature
4. Share your app with the generated URL

### Manual Deployment

For other platforms:

1. Set environment variables on your hosting platform
2. Install dependencies: `pip install -r requirements.txt`
3. Run with: `gunicorn --bind 0.0.0.0:5000 main:app`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📊 Data Privacy

- All conversation data is stored locally in `life_memory.json`
- No data is sent to third parties except OpenAI for AI responses
- Users have full control over their data
- Data can be exported or deleted at any time

## 🛠️ Technical Details

### Architecture

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript with Bootstrap 5
- **AI Engine**: OpenAI GPT-4o
- **Storage**: JSON file-based persistence
- **Styling**: Bootstrap with custom dark theme

### API Endpoints

- `GET /` - Main application interface
- `POST /chat` - Send message to AI coach
- `GET /memory` - Retrieve user's memory summary
- `POST /goals` - Add new goal
- `GET /health` - Health check endpoint

## 🐛 Troubleshooting

### Common Issues

**"Error: Failed to generate response"**
- Check that your OpenAI API key is valid
- Ensure you have sufficient API credits
- Verify internet connection

**Application won't start**
- Ensure Python 3.11+ is installed
- Check that all dependencies are installed
- Verify environment variables are set

**Frontend not loading**
- Check browser console for JavaScript errors
- Ensure static files are accessible
- Try refreshing the page

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Ervin Remu Radosavlevici**
- Email: radosavlevici210@icloud.com
- Repository: [AI Life Coach](https://github.com/ervinradosavlevici/ai-life-coach)

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4o API
- Bootstrap team for the excellent CSS framework
- Font Awesome for the beautiful icons
- Replit for the hosting platform

## 📈 Roadmap

- [ ] User authentication and multi-user support
- [ ] Data export/import functionality
- [ ] Advanced analytics and insights
- [ ] Mobile app version
- [ ] Integration with calendar apps
- [ ] Voice input support
- [ ] Customizable AI coaching styles

---

**Made with ❤️ for personal development and growth**