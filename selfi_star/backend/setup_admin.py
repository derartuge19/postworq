#!/usr/bin/env python3
"""
Standalone script to create super admin on Render deploy.
Run this before starting gunicorn.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
django.setup()

from django.contrib.auth.models import User

def create_superadmin():
    # Get credentials from environment variables with defaults
    username = os.getenv('ADMIN_USERNAME', 'superadmin')
    email = os.getenv('ADMIN_EMAIL', 'superadmin@yourapp.com')
    password = os.getenv('ADMIN_PASSWORD', 'Admin123!')
    
    print(f"Checking for super admin: {username}")
    
    # Check if user already exists
    existing = User.objects.filter(username=username).first()
    if existing:
        if existing.is_superuser:
            print(f"✓ Super admin '{username}' already exists - skipping")
            return True
        else:
            # Promote to super admin
            existing.is_staff = True
            existing.is_superuser = True
            existing.save()
            print(f"✓ User '{username}' promoted to super admin")
            return True
    
    # Check if email is taken
    if User.objects.filter(email=email).exclude(username=username).exists():
        print(f"⚠ Email '{email}' already used by another user")
        return False
    
    # Create super admin
    try:
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name='Super',
            last_name='Admin'
        )
        print(f"✓ Super admin created successfully!")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Password: {'*' * len(password)}")
        return True
    except Exception as e:
        print(f"✗ Failed to create super admin: {e}")
        return False

if __name__ == '__main__':
    success = create_superadmin()
    sys.exit(0 if success else 1)
