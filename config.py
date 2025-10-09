#!/usr/bin/env python3
"""
Configuration settings for Savi CustomGPT Application
Supports development, testing, and production environments
"""

import os
from pathlib import Path

# Base directory of the application
BASE_DIR = Path(__file__).parent.absolute()

class Config:
    """Base configuration class"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'savi-dev-key-change-in-production'
    FLASK_APP = os.environ.get('FLASK_APP') or 'app.py'
    
    # Application settings
    APP_NAME = 'Savi CustomGPT Testing Wrapper'
    APP_VERSION = '1.0.0'
    
    # CustomGPT settings
    CUSTOMGPT_API_KEY = os.environ.get('CUSTOMGPT_API_KEY')
    CUSTOMGPT_PROJECT_ID = os.environ.get('CUSTOMGPT_PROJECT_ID', '82753')
    CUSTOMGPT_PROJECT_KEY = os.environ.get('CUSTOMGPT_PROJECT_KEY', 'ea4e59faa461427ca9e80161e2de77c0')
    CUSTOMGPT_BASE_URL = os.environ.get('CUSTOMGPT_BASE_URL', 'https://app.customgpt.ai/api/v1')
    CUSTOMGPT_EMBED_URL = 'https://cdn.customgpt.ai/js/embed.js'
    
    # CRM Integration settings
    CRM_API_URL = os.environ.get('CRM_API_URL')
    CRM_API_KEY = os.environ.get('CRM_API_KEY')
    
    # Database settings
    DATABASE_URL = os.environ.get('DATABASE_URL') or f'sqlite:///{BASE_DIR}/savi.db'
    
    # Redis settings (for session storage)
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    
    # Logging settings
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.environ.get('LOG_FILE', 'logs/savi.log')
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class DevelopmentConfig(Config):
    """Development configuration"""
    
    DEBUG = True
    FLASK_ENV = 'development'
    
    # Less strict security for development
    SESSION_COOKIE_SECURE = False
    
    # Enable debug toolbar
    DEBUG_TB_ENABLED = True
    DEBUG_TB_INTERCEPT_REDIRECTS = False

class ProductionConfig(Config):
    """Production configuration for Kinsta deployment"""
    
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Kinsta specific settings
    PORT = int(os.environ.get('PORT', 5000))
    HOST = os.environ.get('HOST', '0.0.0.0')
    
    # Enhanced security headers
    SEND_FILE_MAX_AGE_DEFAULT = 31536000  # 1 year for static files

class TestingConfig(Config):
    """Testing configuration"""
    
    TESTING = True
    DEBUG = True
    
    # Use in-memory database for testing
    DATABASE_URL = 'sqlite:///:memory:'
    
    # Disable CSRF protection for testing
    WTF_CSRF_ENABLED = False
    
    # Less strict security for testing
    SESSION_COOKIE_SECURE = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
