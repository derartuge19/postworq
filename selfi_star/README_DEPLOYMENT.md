# Deployment Guide for SelfiStar

## Prerequisites
- Neon PostgreSQL database (already set up)
- Vercel account (for frontend)
- Heroku/Railway/Render account (for backend)

## Database Setup (Neon)
Your Neon database is already configured with these details:
- Database: neondb
- User: neondb_owner
- Host: flat-thunder-79099653.aws.neon.tech
- Port: 5432

## Backend Deployment (Heroku/Railway/Render)

### Option 1: Deploy to Heroku
1. Create a new Heroku app
2. Add environment variables from `.env.example`
3. Deploy the backend

### Option 2: Deploy to Railway (Recommended)
1. Connect your GitHub repo to Railway
2. Set environment variables
3. Railway will auto-deploy

### Environment Variables Needed:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_Ck3JqV2u5m1x
DB_HOST=flat-thunder-79099653.aws.neon.tech
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

## Frontend Deployment (Vercel)
1. Connect your GitHub repo to Vercel
2. Update the API URL in `src/config.js` after backend deployment
3. Vercel will auto-deploy

## Steps to Complete:

### 1. Deploy Backend First
- Choose Railway/Render/Heroku
- Set environment variables
- Deploy and get the backend URL

### 2. Update Frontend API URL
- Edit `src/config.js`
- Replace `https://your-backend-domain.com/api` with your actual backend URL

### 3. Deploy Frontend
- Push changes to GitHub
- Vercel will auto-deploy

### 4. Run Database Migrations
- Most platforms have a way to run migrations
- Or connect to your deployed backend and run: `python manage.py migrate`

## Quick Commands:
```bash
# Test locally with Neon database
cp .env.example backend/.env
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Troubleshooting:
- If CORS errors: Check CORS_ALLOWED_ORIGINS in backend settings
- If database errors: Verify Neon connection details
- If 500 errors: Check backend logs
