
#!/usr/bin/env python3
"""
AI Life Coach - Production Application

Copyright (c) 2025 Ervin Remus Radosavlevici
Licensed under the MIT License
"""

import os
import logging
from flask import Flask, g
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

# Production logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)

# Production configurations
app.secret_key = os.environ.get("SESSION_SECRET", os.urandom(32))
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400

# Production proxy configuration
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Production CORS
CORS(app, origins=["*"], supports_credentials=True)

# Production security headers
@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Import routes
import routes

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
