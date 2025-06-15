import os
import logging
from flask import Flask, request, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy.orm import DeclarativeBase

# Set up logging
if os.environ.get("FLASK_ENV") == "production":
    logging.basicConfig(level=logging.INFO)
else:
    logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

# Initialize extensions
db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

app = Flask(__name__)

# Security configurations
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SESSION_COOKIE_SECURE'] = os.environ.get("FLASK_ENV") == "production"
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize extensions
db.init_app(app)
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Proxy fix for deployment behind reverse proxies
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# CORS configuration
CORS(app, origins=["http://localhost:5000", "https://*.replit.app", "https://*.netlify.app"])

# Security headers
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    if os.environ.get("FLASK_ENV") == "production":
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Rate limiting middleware
@app.before_request
def rate_limit():
    # Simple rate limiting based on IP
    ip = request.environ.get('REMOTE_ADDR')
    if not hasattr(g, 'rate_limits'):
        g.rate_limits = {}
    
    # Allow 100 requests per minute per IP
    import time
    current_time = time.time()
    if ip in g.rate_limits:
        if current_time - g.rate_limits[ip]['last_reset'] > 60:
            g.rate_limits[ip] = {'count': 0, 'last_reset': current_time}
        g.rate_limits[ip]['count'] += 1
        if g.rate_limits[ip]['count'] > 100:
            from flask import abort
            abort(429)  # Too Many Requests
    else:
        g.rate_limits[ip] = {'count': 1, 'last_reset': current_time}

# Create database tables and initialize default user
with app.app_context():
    # Import models to ensure tables are created
    import models
    db.create_all()
    
    # Create default user if not exists
    from models import User
    default_user = User.query.filter_by(username='Ervin').first()
    if not default_user:
        default_user = User(username='Ervin')
        default_user.set_password('Quantum')
        db.session.add(default_user)
        db.session.commit()
        logging.info("Created default user: Ervin")

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Import routes after app configuration
import routes

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
