"""Configuration centrale de l'application AOK"""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']

# JWT
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Stripe
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
STRIPE_CONNECT_CLIENT_ID = os.environ.get('STRIPE_CONNECT_CLIENT_ID', '')

# SendGrid
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDGRID_FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@aok-platform.com')
SENDGRID_FROM_NAME = os.environ.get('SENDGRID_FROM_NAME', 'AOK Platform')

# Platform Settings
PLATFORM_COMMISSION_RATE = float(os.environ.get('PLATFORM_COMMISSION_RATE', '0.20'))  # 20%
MIN_WITHDRAWAL_AMOUNT = float(os.environ.get('MIN_WITHDRAWAL_AMOUNT', '50.0'))
PLATFORM_NAME = "AOK"
PLATFORM_URL = os.environ.get('PLATFORM_URL', 'https://aok-platform.com')

# Rate Limiting
RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
RATE_LIMIT_PER_MINUTE = int(os.environ.get('RATE_LIMIT_PER_MINUTE', '60'))
RATE_LIMIT_PER_HOUR = int(os.environ.get('RATE_LIMIT_PER_HOUR', '1000'))

# Redis (for caching and rate limiting)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Security
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
ALLOWED_ADMIN_IPS = os.environ.get('ALLOWED_ADMIN_IPS', '').split(',') if os.environ.get('ALLOWED_ADMIN_IPS') else []

# Audit Logging
AUDIT_LOG_ENABLED = os.environ.get('AUDIT_LOG_ENABLED', 'true').lower() == 'true'

# Two-Factor Authentication
TWO_FA_ENABLED = os.environ.get('TWO_FA_ENABLED', 'false').lower() == 'true'
TWO_FA_ISSUER = PLATFORM_NAME

# File Storage
UPLOAD_DIR = ROOT_DIR / 'uploads'
REPORT_DIR = ROOT_DIR / 'reports'
INVOICE_DIR = ROOT_DIR / 'invoices'

# Create directories
for directory in [UPLOAD_DIR, REPORT_DIR, INVOICE_DIR]:
    directory.mkdir(exist_ok=True)

# Email Templates
EMAIL_TEMPLATES_DIR = ROOT_DIR / 'email_templates'
EMAIL_TEMPLATES_DIR.mkdir(exist_ok=True)
