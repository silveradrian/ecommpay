#!/usr/bin/env python3
"""
Savi CustomGPT Chatbot Wrapper
A simple Flask application for embedding CustomGPT chatbot
"""

from flask import Flask, render_template
from config import get_config

# Initialize Flask app
app = Flask(__name__)

# Apply configuration
config_class = get_config()
app.config.from_object(config_class)

# Make config available in templates
@app.context_processor
def inject_config():
    return dict(config=app.config)

@app.route('/')
def index():
    """Main CustomGPT chat interface"""
    return render_template('chat.html')

if __name__ == '__main__':
    # Run in debug mode for development
    app.run(debug=True, host='0.0.0.0', port=5000)
