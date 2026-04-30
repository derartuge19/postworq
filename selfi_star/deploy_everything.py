#!/usr/bin/env python3
"""
Complete Deployment Script for SelfiStar
This script will deploy both backend and frontend automatically
"""

import os
import sys
import subprocess
from pathlib import Path

def generate_secret_key():
    """Generate a Django secret key"""
    import secrets
    return secrets.token_urlsafe(50)

def create_production_env():
    """Create production environment file"""
    secret_key = generate_secret_key()
    
    production_env = f"""# Production Database Configuration (Neon)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_Ck3JqV2u5m1x
DB_HOST=flat-thunder-79099653.aws.neon.tech
DB_PORT=5432

# Django Configuration
SECRET_KEY={secret_key}
DEBUG=False
ALLOWED_HOSTS=railway.app,render.com,herokuapp.com,localhost,127.0.0.1

# CORS Configuration (Will be updated after deployment)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000,http://localhost:5173

# Production Settings
ENVIRONMENT=production
"""
    
    with open('backend/.env.production', 'w') as f:
        f.write(production_env)
    
    print("✅ Created production environment file")
    return production_env

def update_frontend_config():
    """Update frontend configuration for production"""
    config_js = """// API Configuration for different environments
const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we're on Vercel or localhost
  const hostname = window.location.hostname;
  const isVercel = hostname.includes('vercel.app');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  if (isVercel) {
    return {
      API_BASE_URL: 'https://selfi-star-backend.railway.app/api', // Update after backend deployment
      ENVIRONMENT: 'production'
    };
  } else if (isLocalhost) {
    return {
      API_BASE_URL: 'http://localhost:8000/api',
      ENVIRONMENT: 'development'
    };
  } else {
    return {
      API_BASE_URL: 'https://selfi-star-backend.railway.app/api', // Fallback
      ENVIRONMENT: 'production'
    };
  }
};

const config = getApiConfig();

export default config;
"""
    
    with open('src/config.js', 'w') as f:
        f.write(config_js)
    
    print("✅ Updated frontend configuration")

def create_railway_config():
    """Create Railway configuration file"""
    railway_config = {
        "build": {
            "builder": "NIXPACKS"
        },
        "deploy": {
            "startCommand": "cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT",
            "healthcheckPath": "/api/"
        }
    }
    
    import json
    with open('railway.json', 'w') as f:
        json.dump(railway_config, f, indent=2)
    
    print("✅ Created Railway configuration")

def create_vercel_config():
    """Create Vercel configuration file"""
    vercel_config = {
        "version": 2,
        "builds": [
            {
                "src": "package.json",
                "use": "@vercel/static-build",
                "config": {
                    "distDir": "dist"
                }
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "/index.html"
            }
        ]
    }
    
    import json
    with open('vercel.json', 'w') as f:
        json.dump(vercel_config, f, indent=2)
    
    print("✅ Created Vercel configuration")

def main():
    print("🚀 SelfiStar Complete Deployment Setup")
    print("=" * 50)
    
    # Change to project directory
    os.chdir(Path(__file__).parent)
    
    print("\n📝 Step 1: Creating production environment...")
    create_production_env()
    
    print("\n⚙️  Step 2: Updating frontend configuration...")
    update_frontend_config()
    
    print("\n🚂 Step 3: Creating Railway configuration...")
    create_railway_config()
    
    print("\n🔧 Step 4: Creating Vercel configuration...")
    create_vercel_config()
    
    print("\n📋 Step 5: Deployment Instructions:")
    print("=" * 30)
    
    print("\n🌐 BACKEND DEPLOYMENT (Railway):")
    print("1. Go to https://railway.app")
    print("2. Click 'New Project' → 'Deploy from GitHub repo'")
    print("3. Select: derartuge19/postworq")
    print("4. Set environment variables from 'backend/.env.production'")
    print("5. Click 'Deploy'")
    
    print("\n🎨 FRONTEND DEPLOYMENT (Vercel):")
    print("1. Go to https://vercel.com")
    print("2. Click 'New Project' → 'Import Git Repository'")
    print("3. Select: derartuge19/postworq")
    print("4. Set root directory to: 'selfi_star'")
    print("5. Click 'Deploy'")
    
    print("\n🔗 POST-DEPLOYMENT:")
    print("1. Get your backend URL from Railway")
    print("2. Update API_BASE_URL in 'src/config.js'")
    print("3. Push changes and redeploy frontend")
    
    print("\n✅ Setup complete! Your files are ready for deployment.")
    
    # Push changes to GitHub
    print("\n📤 Pushing changes to GitHub...")
    try:
        subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
        subprocess.run(['git', 'commit', '-m', 'Add complete deployment configuration'], check=True, capture_output=True)
        subprocess.run(['git', 'push', 'origin', 'master'], check=True, capture_output=True)
        print("✅ Changes pushed to GitHub successfully!")
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Git push failed: {e}")
        print("Please push manually: git add . && git commit -m 'Add deployment config' && git push")

if __name__ == "__main__":
    main()
