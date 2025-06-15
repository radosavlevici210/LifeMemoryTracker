import os
import logging
from flask import Flask, request, g
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

# Set up logging
if os.environ.get("FLASK_ENV") == "production":
    logging.basicConfig(level=logging.INFO)
else:
    logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Security configurations
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['SESSION_COOKIE_SECURE'] = os.environ.get("FLASK_ENV") == "production"
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

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

# Import routes after app configuration
from routes import *

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
