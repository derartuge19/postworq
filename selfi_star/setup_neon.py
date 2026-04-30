#!/usr/bin/env python3
"""
Neon Database Setup Script for SelfiStar
This script will help you set up the Neon database connection
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """Create .env file with Neon database configuration"""
    
    # Neon connection details (from the URL you provided)
    neon_config = """# Database Configuration (Neon)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_Ck3JqV2u5m1x
DB_HOST=flat-thunder-79099653.aws.neon.tech
DB_PORT=5432

# Django Configuration
SECRET_KEY=django-insecure-change-this-in-production-please-use-django-generate-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-backend-domain.railway.app

# CORS Configuration (Add your Vercel domain)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-frontend-domain.vercel.app

# Production Settings
ENVIRONMENT=production
"""
    
    # Create .env file in backend directory
    backend_dir = Path(__file__).parent / "backend"
    env_file = backend_dir / ".env"
    
    with open(env_file, 'w') as f:
        f.write(neon_config)
    
    print(f"✅ Created .env file at: {env_file}")
    print("⚠️  Please update the placeholder values before deployment!")
    
    return env_file

def test_database_connection():
    """Test the database connection"""
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        # Load environment variables
        backend_dir = Path(__file__).parent / "backend"
        load_dotenv(backend_dir / ".env")
        
        # Test connection
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        
        print("✅ Database connection successful!")
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def run_django_migrations():
    """Run Django migrations"""
    try:
        backend_dir = Path(__file__).parent / "backend"
        os.chdir(backend_dir)
        
        # Run migrations
        os.system("python manage.py migrate")
        print("✅ Django migrations completed!")
        
        # Create superuser (optional)
        print("📝 To create an admin user, run: python manage.py createsuperuser")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def main():
    print("🚀 SelfiStar Neon Database Setup")
    print("=" * 40)
    
    # Step 1: Create .env file
    print("\n📝 Step 1: Creating .env file...")
    create_env_file()
    
    # Step 2: Test database connection
    print("\n🔌 Step 2: Testing database connection...")
    if test_database_connection():
        print("✅ Connection test passed!")
        
        # Step 3: Run migrations
        print("\n🗄️  Step 3: Running Django migrations...")
        if run_django_migrations():
            print("\n🎉 Setup completed successfully!")
            print("\n📋 Next steps:")
            print("1. Deploy backend to Railway/Render/Heroku")
            print("2. Update frontend API URL in src/config.js")
            print("3. Deploy frontend to Vercel")
        else:
            print("❌ Migration failed. Please check your configuration.")
    else:
        print("❌ Please check your Neon database credentials in the .env file")

if __name__ == "__main__":
    main()
