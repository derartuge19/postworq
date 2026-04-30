# 🚀 Render + Vercel Deployment Guide

## 🎯 Quick Deployment (5 minutes total)

### 🌐 BACKEND - Render (3 minutes)
1. Go to **https://render.com**
2. Click **"New"** → **"Web Service"**
3. Connect GitHub: **`derartuge19/postworq`**
4. **Settings:**
   - Name: `selfi-star-backend`
   - Root Directory: `selfi_star`
   - Runtime: `Python 3`
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. **Environment Variables** (Render will auto-add from render.yaml):
   ```
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=your-db-password-here
   DB_HOST=your-db-host-here
   DB_PORT=5432
   SECRET_KEY=auto-generated-by-render
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app,https://your-frontend-domain.onrender.com
   ```
6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. Copy your backend URL: `https://selfi-star-backend.onrender.com`

### 🎨 FRONTEND - Vercel (2 minutes)
1. Go to **https://vercel.com**
2. Click **"New Project"**
3. Import GitHub: **`derartuge19/postworq`**
4. **Settings:**
   - Framework Preset: `Vite`
   - Root Directory: `selfi_star`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **"Deploy"**
6. Copy your frontend URL: `https://your-app.vercel.app`

### 🔗 Final Steps (1 minute)
1. **Update CORS in Render:**
   - Go to your Render dashboard
   - Edit Environment Variables
   - Update `CORS_ALLOWED_ORIGINS` to include your actual Vercel URL
2. **Restart Render service** (takes 30 seconds)
3. **Test your app!**

## ✅ What's Already Configured:

### 🗄️ Database (Neon)
- ✅ PostgreSQL database ready
- ✅ Connection details configured
- ✅ Migrations ready to run

### 🔧 Backend (Django)
- ✅ Production settings
- ✅ CORS configured
- ✅ Environment variables
- ✅ Auto-deployment from GitHub

### 🎨 Frontend (React)
- ✅ API URL auto-detection
- ✅ Production build ready
- ✅ Environment-specific config

## 📱 Features Ready:
- ✅ User registration/login
- ✅ Profile management
- ✅ Video uploads
- ✅ Real-time database
- ✅ Production deployment

## 🛠️ Troubleshooting:

### If CORS errors:
1. Check `CORS_ALLOWED_ORIGINS` in Render environment variables
2. Make sure your Vercel URL is included
3. Restart Render service

### If database errors:
1. Verify Neon connection details
2. Check if database is accessible
3. Run migrations manually if needed

### If 500 errors:
1. Check Render logs
2. Verify all environment variables
3. Make sure build succeeded

## 🎉 Success!
Your SelfiStar app will be live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://selfi-star-backend.onrender.com`

The connection errors will be completely resolved!
