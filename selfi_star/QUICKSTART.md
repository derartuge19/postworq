# Selfie Star App - Quick Start

## Status
✅ Backend: Running on http://localhost:8000
✅ Frontend: Running on http://localhost:5173
✅ Database: PostgreSQL (selfi_star) - All tables created

## What's Working

### Backend (Django)
- User registration with automatic profile creation
- User login with token authentication
- All database tables created and synced
- REST API endpoints ready
- CORS configured for frontend communication

### Frontend (React)
- Connected to backend API
- Login/Register screens integrated with backend
- API service layer ready for all features

## Test the Backend

### 1. Create a Test User via API
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### 3. Get User Profile (use token from login response)
```bash
curl -X GET http://localhost:8000/api/profile/me/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Frontend Testing

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in details and complete signup
4. You should see the onboarding screen
5. Check browser console for any errors

## Database Tables Created

- auth_user (Django built-in)
- api_userprofile (XP, level, streak, avatar)
- api_reel (user photos/reels)
- api_vote (votes on reels)
- api_quest (available quests)
- api_userquest (user quest progress)
- api_subscription (subscription plans)
- api_notificationpreference (notification settings)
- authtoken_token (API tokens)

## Admin Panel

Access Django admin at: http://localhost:8000/admin

Create a superuser:
```bash
cd backend
python manage.py createsuperuser
```

## Next Steps

1. Test signup/login on frontend
2. Implement reel upload functionality
3. Add quest completion logic
4. Implement voting system
5. Add subscription management
6. Set up notifications

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL is running
- Check database credentials in backend/.env

### "CORS error" in browser
- Backend CORS is configured for localhost:5173
- If using different port, update CORS_ALLOWED_ORIGINS in backend/config/settings.py

### "No tables" in database
- Run: `python manage.py migrate` in backend folder
- Run: `python manage.py makemigrations api` if needed

## Running the Servers

**Backend (already running):**
```bash
cd backend
python manage.py runserver 8000
```

**Frontend (already running):**
```bash
npm run dev
```

Both servers are currently running in the background!
