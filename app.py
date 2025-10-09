#!/usr/bin/env python3
"""
Savi CustomGPT Chatbot Testing Wrapper
A Flask application for testing embedded CustomGPT chatbot with CRM integration
"""

from flask import Flask, render_template, request, jsonify, session
import os
import json
from datetime import datetime
import uuid
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

# Mock CRM data structure
MOCK_CRM_DATA = {
    'contacts': [
        {
            'id': '1',
            'name': 'John Smith',
            'email': 'john.smith@example.com',
            'company': 'Acme Corp',
            'phone': '+1-555-0123',
            'last_interaction': '2024-10-08',
            'status': 'active'
        },
        {
            'id': '2', 
            'name': 'Sarah Johnson',
            'email': 'sarah.j@techstart.com',
            'company': 'TechStart Inc',
            'phone': '+1-555-0456',
            'last_interaction': '2024-10-07',
            'status': 'prospect'
        }
    ],
    'interactions': [],
    'payments': [
        {
            'id': 'pay_001',
            'contact_id': '1',
            'amount': 1250.00,
            'currency': 'USD',
            'status': 'completed',
            'date': '2024-10-08',
            'description': 'Monthly subscription'
        }
    ]
}

@app.route('/')
def index():
    """Main application dashboard"""
    return render_template('index.html')

@app.route('/chat')
def chat():
    """Chat interface for CustomGPT integration"""
    # Initialize session if needed
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    return render_template('chat.html', session_id=session['session_id'])

@app.route('/api/crm/contacts')
def get_contacts():
    """API endpoint to fetch CRM contacts"""
    return jsonify({
        'success': True,
        'data': MOCK_CRM_DATA['contacts'],
        'total': len(MOCK_CRM_DATA['contacts'])
    })

@app.route('/api/crm/contacts/<contact_id>')
def get_contact(contact_id):
    """API endpoint to fetch specific contact"""
    contact = next((c for c in MOCK_CRM_DATA['contacts'] if c['id'] == contact_id), None)
    if contact:
        return jsonify({'success': True, 'data': contact})
    return jsonify({'success': False, 'error': 'Contact not found'}), 404

@app.route('/api/crm/interactions', methods=['POST'])
def log_interaction():
    """API endpoint to log customer interactions"""
    data = request.json
    interaction = {
        'id': str(uuid.uuid4()),
        'contact_id': data.get('contact_id'),
        'type': data.get('type', 'chat'),
        'content': data.get('content'),
        'timestamp': datetime.utcnow().isoformat(),
        'session_id': session.get('session_id')
    }
    
    MOCK_CRM_DATA['interactions'].append(interaction)
    
    return jsonify({
        'success': True,
        'data': interaction
    })

@app.route('/api/crm/payments')
def get_payments():
    """API endpoint to fetch payment data"""
    contact_id = request.args.get('contact_id')
    payments = MOCK_CRM_DATA['payments']
    
    if contact_id:
        payments = [p for p in payments if p['contact_id'] == contact_id]
    
    return jsonify({
        'success': True,
        'data': payments,
        'total': len(payments)
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    # Ensure static and template directories exist
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('static/images', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run in debug mode for development
    app.run(debug=True, host='0.0.0.0', port=5000)
