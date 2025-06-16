#!/usr/bin/env python3
"""
AI Life Coach - Authentication Module

Copyright (c) 2025 Ervin Remu Radosavlevici
Licensed under the MIT License
"""

import os
import hashlib
import secrets
from functools import wraps
from flask import session, request, jsonify, redirect, url_for

# Simple authentication system
USERS = {
    "Ervin": {
        "password_hash": hashlib.sha256("Quantum".encode()).hexdigest(),
        "is_admin": True
    }
}

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

def login_user(username):
    """Log in user by setting session"""
    session['logged_in'] = True
    session['username'] = username
    session['user_id'] = username  # Simple user ID
    session.permanent = True

def logout_user():
    """Log out user by clearing session"""
    session.pop('logged_in', None)
    session.pop('username', None)
    session.pop('user_id', None)

def is_authenticated():
    """Check if user is authenticated"""
    return session.get('logged_in', False)

def get_current_user():
    """Get current user info"""
    if is_authenticated():
        username = session.get('username')
        return {
            'username': username,
            'is_authenticated': True,
            'user_id': username
        }
    return {'is_authenticated': False}

def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            if request.is_json:
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def authenticate(username, password):
    """Authenticate user credentials"""
    if username in USERS:
        user_data = USERS[username]
        if verify_password(password, user_data['password_hash']):
            return True
    return False