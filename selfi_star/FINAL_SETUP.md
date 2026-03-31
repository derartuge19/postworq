# Selfie Star - Final Setup & Testing Guide

## ✅ Current Status

- **Frontend**: Running on http://localhost:5173
- **Backend**: Running on http://localhost:8000
- **Database**: PostgreSQL (selfi_star) - Clean and ready
- **Layout**: TikTok-like with left sidebar, center feed, right recommendations

## 🚀 Quick Start

### 1. Test Credentials (Already Created)
```
Email: demo@example.com
Password: demo12345
```

### 2. Test the App

**Option A: Login with existing account**
1. Go to http://localhost:5173
2. Click "Log In"
3. Use credentials above
4. You'll see the TikTok-like layout

**Option B: Create new account**
1. Go to http://localhost:5173
2. Click "Create Account 🚀"
3. Fill in:
   - Full Name: Your Name
   - Email: yourname@example.com (must be unique)
   - Password: testpass123 (min 8 chars)
4. Complete the 5-step registration
5. You'll be logged in automatically

## 🎯 What You'll See

### Left Sidebar (250px)
- Logo & branding
- Navigation menu (For You, Explore, Following, Inbox, Bookmarks)
- Create button
- User profile
- Logout button

### Center Feed (600px)
- Vertical scrolling video feed
- Each video shows:
  - Video placeholder (🎬)
  - Creator info overlay
  - Follow button
  - Video caption
- Action buttons on right:
  - 🤍 Like
  - 💬 Comment
  - 📤 Share
  - 🔖 Bookmark

### Right Sidebar (320px)
- Search bar
- Recommended creators list
- Follow buttons
- Footer links

## 🔧 Troubleshooting

### If you get 400 error:
1. Check browser console (F12)
2. Look for error message
3. Common issues:
   - Email already exists → Use different email
   - Invalid email format → Use format: name@example.com
   - Password too short → Use 8+ characters
   - Missing fields → Fill all fields

### If you get connection error:
1. Check both servers are running:
   - Frontend: `npm run dev`
   - Backend: `python manage.py runserver 8000`
2. Check PostgreSQL is running
3. Refresh the page

### If you want to reset database:
```bash
cd backend
python reset_db.py
```

This will:
- Delete all users
- Create demo user (demo@example.com / demo12345)
- Create auth token

## 📝 API Endpoints

### Authentication
```
POST /api/auth/register/
POST /api/auth/login/
```

### Profile
```
GET /api/profile/me/
POST /api/profile/add_xp/
POST /api/profile/daily_checkin/
```

### Reels
```
GET /api/reels/
POST /api/reels/
POST /api/reels/{id}/vote/
```

### Quests
```
GET /api/quests/
POST /api/quests/{id}/complete/
```

## 🎨 Design

### Colors
- Primary: #DA9B2A (Gold)
- Text: #1C1917 (Dark)
- Background: #FAFAF7 (Light)
- Border: #E7E5E4 (Light Gray)

### Layout
- 3-column design (left sidebar, center feed, right sidebar)
- Fixed sidebars, scrollable center
- Responsive video cards
- TikTok-inspired design

## 📱 Features Implemented

✅ User authentication (register/login)
✅ TikTok-like layout
✅ Left sidebar navigation
✅ Center video feed
✅ Right recommendations
✅ Video cards with creator info
✅ Action buttons (like, comment, share, bookmark)
✅ User profile display
✅ Logout functionality
✅ Error handling & validation
✅ Token-based authentication

## 🚧 Features to Implement

- [ ] Real video upload
- [ ] Video playback
- [ ] Like/Unlike functionality
- [ ] Comment system
- [ ] Follow/Unfollow creators
- [ ] Share videos
- [ ] Bookmark videos
- [ ] Search functionality
- [ ] Notifications
- [ ] User profile page
- [ ] Creator analytics
- [ ] Trending hashtags
- [ ] Live streaming
- [ ] Direct messaging

## 📊 Database Schema

### Users
- User (Django built-in)
- UserProfile (XP, level, streak, avatar)
- Subscription (plan info)
- NotificationPreference (notification settings)

### Content
- Reel (videos/images)
- Vote (likes on reels)

### Gamification
- Quest (available quests)
- UserQuest (user quest progress)

## 🔐 Security

- Token-based authentication
- CORS configured for localhost:5173
- Password hashing with Django
- Secure database connection
- Environment variables for sensitive data

## 📚 Documentation

- `README.md` - Project overview
- `TIKTOK_EXACT_LAYOUT.md` - Layout documentation
- `DEBUG_GUIDE.md` - Debugging guide
- `WORKING_GUIDE.md` - Complete working guide
- `FRONTEND_STRUCTURE.md` - Frontend architecture

## 🎉 Next Steps

1. **Test the app** with demo credentials
2. **Create new account** to test registration
3. **Explore the layout** - check all tabs
4. **Check browser console** for any errors
5. **Review the code** - understand the structure
6. **Implement features** - start with video upload

## 💡 Tips

- Use browser DevTools (F12) to debug
- Check Django logs for backend errors
- Use `python reset_db.py` to reset database
- Clear browser cache if having issues
- Check localStorage for auth token

## 🆘 Support

If you encounter issues:
1. Check the DEBUG_GUIDE.md
2. Look at browser console errors
3. Check Django server logs
4. Reset database with `python reset_db.py`
5. Restart both servers

---

**You're all set! Go to http://localhost:5173 and enjoy your TikTok-like app! 🚀**
