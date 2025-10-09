#!/usr/bin/env python3
"""
WSGI entry point for Savi CustomGPT Application
Used by production servers like Gunicorn, uWSGI, and Kinsta
"""

import os
from app import app
from config import get_config

# Apply configuration
app.config.from_object(get_config())

# Ensure necessary directories exist
os.makedirs('logs', exist_ok=True)
os.makedirs('uploads', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)
os.makedirs('static/images', exist_ok=True)
os.makedirs('templates', exist_ok=True)

if __name__ == "__main__":
    # This will be used by Kinsta or other WSGI servers
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    app.run(host=host, port=port)
