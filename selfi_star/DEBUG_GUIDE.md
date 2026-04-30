# Debugging Guide - 400 Bad Request Error

## What's Happening

The 400 error typically means the API is rejecting the request data. This can happen for several reasons:

## How to Debug

### 1. Check Browser Console
1. Open your browser (Chrome/Firefox)
2. Press `F12` to open Developer Tools
3. Go to the "Console" tab
4. Look for error messages with details about what went wrong
5. Check the "Network" tab to see the actual request/response

### 2. Check Backend Logs
The Django server logs show what's happening:
```
Bad Request: /api/auth/register/
[25/Mar/2026 15:38:33] "POST /api/auth/register/ HTTP/1.1" 400 42
```

### 3. Common Issues

#### Issue 1: Invalid Email Format
- Make sure email is valid (e.g., test@example.com)
- Don't use spaces or special characters

#### Issue 2: Duplicate Username/Email
- If you've registered before, the username/email already exists
- Use a different email address
- Or clear the database: `python manage.py shell -c "from django.contrib.auth.models import User; User.objects.all().delete()"`

#### Issue 3: Missing Required Fields
- All fields must be filled:
  - Full Name (required)
  - Email (required)
  - Password (required, min 8 chars)

#### Issue 4: Token Not Set
- After successful login/register, token should be stored
- Check localStorage in browser DevTools:
  1. Open DevTools (F12)
  2. Go to "Application" tab
  3. Click "Local Storage"
  4. Look for "authToken" key

### 4. Testing the API Directly

Test registration:
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

Test login:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### 5. Check Database

View all users:
```bash
cd backend
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all().values('username', 'email')
```

Delete all users:
```bash
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.all().delete(); print('All users deleted')"
```

### 6. Restart Services

If something is stuck:

**Stop frontend:**
- Press Ctrl+C in the npm terminal

**Stop backend:**
- Press Ctrl+C in the Django terminal

**Restart frontend:**
```bash
npm run dev
```

**Restart backend:**
```bash
cd backend
python manage.py runserver 8000
```

## Step-by-Step Testing

### Fresh Start
1. Delete all users: `python manage.py shell -c "from django.contrib.auth.models import User; User.objects.all().delete()"`
2. Restart Django: `python manage.py runserver 8000`
3. Restart frontend: `npm run dev`
4. Go to http://localhost:5173
5. Try signing up with:
   - Name: John Doe
   - Email: john@example.com
   - Password: testpass123
6. Check browser console for errors
7. Check Django logs for errors

### If Still Getting 400

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register
4. Click on the failed request
5. Go to "Response" tab
6. Copy the error message
7. Check what field is causing the issue

## Common Error Messages

### "duplicate key value violates unique constraint"
- User already exists
- Delete the user or use a different email

### "This field may not be blank"
- A required field is empty
- Make sure all fields are filled

### "Invalid email format"
- Email is not valid
- Use format: name@example.com

### "Password too short"
- Password must be at least 8 characters
- Use a longer password

## Logs to Check

### Frontend Logs (Browser Console)
```
API Request: POST /auth/register/
API Error: 400 Object
```

### Backend Logs (Django Terminal)
```
Bad Request: /api/auth/register/
[25/Mar/2026 15:38:33] "POST /api/auth/register/ HTTP/1.1" 400 42
```

## Quick Fixes

### Fix 1: Clear Browser Cache
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cookies and other site data"
4. Click "Clear data"
5. Refresh page

### Fix 2: Clear LocalStorage
In browser console:
```javascript
localStorage.clear();
location.reload();
```

### Fix 3: Reset Database
```bash
cd backend
python manage.py shell -c "from django.contrib.auth.models import User; User.objects.all().delete(); print('Database reset')"
```

### Fix 4: Check Token
In browser console:
```javascript
console.log(localStorage.getItem('authToken'));
```

Should show a long string like: `a47cc4774a062c4e0bfa59c89324a5fcb6e8a361`

## Still Having Issues?

1. Check all three components are running:
   - Frontend: http://localhost:5173 (should load)
   - Backend: http://localhost:8000/api/auth/register/ (should show API page)
   - Database: PostgreSQL should be running

2. Check logs:
   - Browser console (F12)
   - Django terminal
   - Network tab in DevTools

3. Try fresh registration with new email

4. Restart all services

## Success Indicators

✅ Registration successful:
- Page redirects to onboarding
- Browser console shows "Registration successful"
- Token is stored in localStorage

✅ Login successful:
- Page redirects to main app
- Browser console shows "Login successful"
- Token is stored in localStorage

✅ App loads:
- TikTok-like layout appears
- Left sidebar visible
- Center feed visible
- Right sidebar visible
