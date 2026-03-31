# Selfie Star App - Complete Working Guide

## Current Status ✅

### Backend (Django)
- ✅ Running on http://localhost:8000
- ✅ PostgreSQL database connected (selfi_star)
- ✅ All tables created and synced
- ✅ User registration working
- ✅ User login working
- ✅ Token authentication configured
- ✅ CORS enabled for frontend

### Frontend (React + Vite)
- ✅ Running on http://localhost:5173
- ✅ Modular component structure
- ✅ API integration ready
- ✅ Login/Register screens connected to backend
- ✅ Onboarding flow implemented
- ✅ Main app shell with navigation

### Database (PostgreSQL)
- ✅ Database: selfi_star
- ✅ User: postgres
- ✅ Password: eden111310
- ✅ All tables created:
  - auth_user
  - api_userprofile
  - api_reel
  - api_vote
  - api_quest
  - api_subscription
  - api_notificationpreference
  - authtoken_token

## How to Test

### 1. Sign Up
1. Go to http://localhost:5173
2. Click "Create Account 🚀"
3. Fill in details:
   - Full Name: Your Name
   - Email: yourname@example.com
   - Password: testpass123
4. Click "Continue →"
5. Add phone number (optional, can skip)
6. Set privacy preferences
7. Choose plan (Free/Pro/Premium)
8. Click "Start with [Plan] 🌟"

### 2. Log In
1. Go to http://localhost:5173
2. Click "Log In"
3. Use credentials from signup:
   - Email: yourname@example.com
   - Password: testpass123
4. Click "Log In 🚀"

### 3. View App
After login, you'll see:
- Feed tab (📸) - Reels coming soon
- Quests tab (🎯) - Quests coming soon
- Profile tab (👤) - Your profile info

## API Endpoints

### Authentication
```
POST /api/auth/register/
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpass123",
  "first_name": "Test",
  "last_name": "User"
}

POST /api/auth/login/
{
  "username": "testuser",
  "password": "testpass123"
}
```

### Profile
```
GET /api/profile/me/
Authorization: Token YOUR_TOKEN

POST /api/profile/add_xp/
Authorization: Token YOUR_TOKEN
{
  "xp": 100
}

POST /api/profile/daily_checkin/
Authorization: Token YOUR_TOKEN
```

### Reels
```
GET /api/reels/
Authorization: Token YOUR_TOKEN

POST /api/reels/
Authorization: Token YOUR_TOKEN
(multipart/form-data with image)

POST /api/reels/{id}/vote/
Authorization: Token YOUR_TOKEN
```

### Quests
```
GET /api/quests/
Authorization: Token YOUR_TOKEN

POST /api/quests/{id}/complete/
Authorization: Token YOUR_TOKEN
```

## Database Schema

### UserProfile
- user_id (FK to User)
- avatar (ImageField)
- bio (TextField)
- xp (IntegerField)
- level (IntegerField)
- streak (IntegerField)
- last_checkin (DateTimeField)
- language (CharField)

### Reel
- user_id (FK to User)
- image (ImageField)
- caption (TextField)
- votes (IntegerField)
- created_at (DateTimeField)

### Vote
- user_id (FK to User)
- reel_id (FK to Reel)
- created_at (DateTimeField)

### Quest
- title (CharField)
- description (TextField)
- xp_reward (IntegerField)
- is_active (BooleanField)

### Subscription
- user_id (FK to User)
- plan (CharField: free/pro/premium)
- started_at (DateTimeField)
- expires_at (DateTimeField)

### NotificationPreference
- user_id (FK to User)
- email_notifications (BooleanField)
- push_notifications (BooleanField)
- sms_notifications (BooleanField)
- phone (CharField)

## File Structure

```
Frontend:
src/
├── components/
│   ├── SplashScreen.jsx
│   ├── LoginScreen.jsx
│   ├── RegisterScreen.jsx
│   ├── OnboardingScreen.jsx
│   ├── AppShell.jsx
│   ├── Inp.jsx
│   ├── GradBtn.jsx
│   └── index.js
├── constants/
│   └── theme.js
├── api.js
├── App.jsx
└── main.jsx

Backend:
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   ├── signals.py
│   └── apps.py
├── manage.py
├── requirements.txt
└── .env
```

## Troubleshooting

### "Connection refused" error
- Check if both servers are running: `npm run dev` and `python manage.py runserver 8000`
- Check if PostgreSQL is running

### "CORS error" in browser console
- Backend CORS is configured for localhost:5173
- If using different port, update CORS_ALLOWED_ORIGINS in backend/config/settings.py

### "Invalid credentials" on login
- Make sure you're using the email prefix as username (e.g., for test@example.com, username is "test")
- Check that the user exists in database

### Database connection error
- Verify PostgreSQL is running
- Check credentials in backend/.env
- Verify database exists: `psql -U postgres -l`

## Next Steps to Implement

1. **Reel Upload** - Camera/gallery integration
2. **Reel Feed** - Display and vote on reels
3. **Quest System** - Show quests and track completion
4. **XP & Leveling** - Update profile with XP gains
5. **Daily Check-in** - Streak tracking
6. **Notifications** - Email/SMS/Push notifications
7. **Subscription** - Plan upgrades
8. **Analytics** - User stats and insights
9. **Real-time** - WebSocket for live updates
10. **Offline** - Service workers for offline mode

## Running the Servers

Both servers are currently running in the background!

To stop them:
```
# Stop frontend
Ctrl+C in npm terminal

# Stop backend
Ctrl+C in Django terminal
```

To restart:
```
# Frontend
npm run dev

# Backend
cd backend
python manage.py runserver 8000
```

## Admin Panel

Access Django admin at: http://localhost:8000/admin

Create superuser:
```bash
cd backend
python manage.py createsuperuser
```

Then log in with your superuser credentials.
