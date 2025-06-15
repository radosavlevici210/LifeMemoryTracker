# Contributing to AI Life Coach

Thank you for your interest in contributing to the AI Life Coach project! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/ai-life-coach.git
   cd ai-life-coach
   ```
3. **Set up the development environment**:
   ```bash
   pip install -r requirements.txt
   export OPENAI_API_KEY="your-api-key"
   ```

## Development Guidelines

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Keep functions focused and single-purpose
- Maximum line length: 88 characters (Black formatter standard)

### Project Structure

- `app.py` - Flask application setup
- `routes.py` - API endpoints
- `models.py` - Data models and storage
- `life_coach.py` - AI integration logic
- `static/` - Frontend assets
- `templates/` - HTML templates

### Frontend Guidelines

- Use Bootstrap 5 classes for styling
- Maintain dark theme consistency
- Keep JavaScript modular and well-commented
- Ensure responsive design works on all devices

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/goal-categories` - New features
- `fix/memory-loading-bug` - Bug fixes
- `docs/api-documentation` - Documentation updates
- `refactor/database-structure` - Code refactoring

### Commit Messages

Write clear, concise commit messages:
```
feat: add goal categorization feature
fix: resolve memory loading timeout issue
docs: update API endpoint documentation
refactor: simplify chat message handling
```

### Testing

Before submitting changes:

1. **Test the application manually**:
   - Start the server: `python main.py`
   - Test chat functionality
   - Test goal creation and viewing
   - Test memory overview

2. **Check for errors**:
   - No console errors in browser
   - No Python exceptions in terminal
   - API endpoints return expected responses

3. **Verify responsive design**:
   - Test on desktop, tablet, and mobile sizes
   - Ensure all features work on different screen sizes

## Submitting Changes

### Pull Request Process

1. **Create a pull request** from your feature branch to `main`
2. **Provide a clear description** of your changes
3. **Include screenshots** if UI changes are involved
4. **Reference any related issues**

### Pull Request Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design verified
- [ ] API endpoints tested

## Screenshots (if applicable)
Add screenshots of UI changes.

## Related Issues
Closes #issue_number
```

## Feature Requests

### Before Submitting

1. Check existing issues to avoid duplicates
2. Consider if the feature aligns with project goals
3. Think about implementation complexity

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Explain why this feature would be valuable.

## Proposed Implementation
Brief outline of how it could be implemented.

## Additional Context
Any additional information or mockups.
```

## Bug Reports

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Python version: [e.g., 3.11]
```

## Development Areas

### High Priority
- User authentication system
- Data export/import functionality
- Enhanced analytics and insights
- Performance optimizations

### Medium Priority
- Goal categories and tags
- Conversation search functionality
- Data visualization improvements
- Mobile app considerations

### Low Priority
- Voice input support
- Custom AI coaching styles
- Third-party integrations
- Advanced pattern recognition

## Questions?

If you have questions about contributing:

1. Check existing issues and documentation
2. Create a discussion thread for general questions
3. Contact the maintainer: radosavlevici210@icloud.com

## Recognition

Contributors will be recognized in the project README and release notes.

Thank you for helping make AI Life Coach better!