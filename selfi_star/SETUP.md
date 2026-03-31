# Selfie Star App - Setup Guide

## Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

## Backend Setup (Django)

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Setup
Make sure PostgreSQL is running and create the database:
```sql
CREATE DATABASE selfi_star;
```

### 4. Run Migrations
```bash
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Start Django Server
```bash
python manage.py runserver 8000
```

The backend will be available at `http://localhost:8000`
Admin panel: `http://localhost:8000/admin`

## Frontend Setup (React + Vite)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user

### Profile
- `GET /api/profile/me/` - Get current user profile
- `PATCH /api/profile/{id}/` - Update profile
- `POST /api/profile/add_xp/` - Add XP points
- `POST /api/profile/daily_checkin/` - Daily check-in

### Reels
- `GET /api/reels/` - Get all reels
- `POST /api/reels/` - Create new reel
- `POST /api/reels/{id}/vote/` - Vote on reel

### Quests
- `GET /api/quests/` - Get all quests
- `POST /api/quests/{id}/complete/` - Complete quest

### Subscription
- `GET /api/subscription/` - Get subscription info
- `POST /api/subscription/upgrade/` - Upgrade plan

### Notifications
- `GET /api/notifications/me/` - Get notification preferences
- `PUT /api/notifications/me/` - Update notification preferences

## Environment Variables

Backend `.env` file:
```
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production
DB_ENGINE=django.db.backends.postgresql
DB_NAME=selfi_star
DB_USER=postgres
DB_PASSWORD=eden111310
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Database Schema

### Models
- **UserProfile** - Extended user info (XP, level, streak, avatar)
- **Reel** - User-uploaded reels/photos
- **Vote** - Votes on reels
- **Quest** - Available quests
- **UserQuest** - User quest progress
- **Subscription** - User subscription plan
- **NotificationPreference** - User notification settings

## Troubleshooting

### PostgreSQL Connection Error
- Ensure PostgreSQL is running
- Check credentials in `.env` file
- Verify database exists: `psql -U postgres -l`

### CORS Error
- Backend CORS is configured for `http://localhost:5173`
- If using different port, update `CORS_ALLOWED_ORIGINS` in `config/settings.py`

### Port Already in Use
- Django: `python manage.py runserver 8001`
- Vite: `npm run dev -- --port 5174`
