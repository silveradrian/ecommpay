#!/usr/bin/env python3
"""
Savi CustomGPT Chatbot Wrapper
A simple Flask application for embedding CustomGPT chatbot
"""

from flask import Flask, render_template, send_from_directory
from config import get_config
import os

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
    """Serve the deployment options page"""
    return send_from_directory('.', 'index.html')

@app.route('/static.html')
def static_demo():
    """Serve embedded chat demo page"""
    return send_from_directory('.', 'static.html')

@app.route('/livechat-demo.html')
def livechat_demo():
    """Serve live chat widget demo page"""
    return send_from_directory('.', 'livechat-demo.html')

@app.route('/chat')
def chat():
    """Original CustomGPT chat interface"""
    return render_template('chat.html')

if __name__ == '__main__':
    # Run in debug mode for development
    app.run(debug=True, host='0.0.0.0', port=5000)
