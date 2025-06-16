
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
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Proxy fix for deployment behind reverse proxies
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# CORS configuration - Allow all origins for production flexibility
CORS(app, origins="*", supports_credentials=True)

# Security headers
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    # Always enable HSTS for production security
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Enhanced rate limiting middleware for production
@app.before_request
def rate_limit():
    # More flexible rate limiting for production use
    ip = request.environ.get('REMOTE_ADDR')
    if not hasattr(g, 'rate_limits'):
        g.rate_limits = {}
    
    # Allow 500 requests per minute per IP for production
    import time
    current_time = time.time()
    if ip in g.rate_limits:
        if current_time - g.rate_limits[ip]['last_reset'] > 60:
            g.rate_limits[ip] = {'count': 0, 'last_reset': current_time}
        g.rate_limits[ip]['count'] += 1
        # Increased limit for production usage
        if g.rate_limits[ip]['count'] > 500:
            from flask import abort
            abort(429)  # Too Many Requests
    else:
        g.rate_limits[ip] = {'count': 1, 'last_reset': current_time}

# Import routes after app configuration
import routes

if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_ENV") != "production"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
