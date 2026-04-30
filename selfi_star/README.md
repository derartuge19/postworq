# Selfie Star - TikTok-Like Video Sharing App

A modern video sharing platform built with React, Django, and PostgreSQL. Features a TikTok-inspired layout with a left sidebar navigation and responsive video feed.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Installation

**Backend Setup:**
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

**Frontend Setup:**
```bash
npm install
npm run dev
```

Both servers are currently running!
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

## 📱 Features

### Authentication
- ✅ User registration with email
- ✅ User login with token auth
- ✅ Secure password handling
- ✅ Auto-profile creation

### Main App (TikTok-Like Layout)
- ✅ Fixed left sidebar (280px)
- ✅ Main content area with video feed
- ✅ Responsive video grid
- ✅ Creator info overlay
- ✅ Action buttons (like, comment, share, bookmark)
- ✅ Tab navigation (For You, Following, Explore, Likes, Bookmarks)
- ✅ User profile section
- ✅ Settings menu
- ✅ Logout functionality

### Video Features (Coming Soon)
- [ ] Video upload
- [ ] Video playback
- [ ] Like/Unlike
- [ ] Comments
- [ ] Share
- [ ] Bookmark
- [ ] Follow creators

## 🏗️ Project Structure

```
selfie-star/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SplashScreen.jsx
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── RegisterScreen.jsx
│   │   │   ├── OnboardingScreen.jsx
│   │   │   ├── AppShell.jsx
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── FeedPage.jsx
│   │   │   ├── VideoCard.jsx
│   │   │   ├── Inp.jsx
│   │   │   ├── GradBtn.jsx
│   │   │   └── index.js
│   │   ├── constants/
│   │   │   └── theme.js
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── api/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── signals.py
│   │   └── apps.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
│
└── docs/
    ├── README.md (this file)
    ├── TIKTOK_LAYOUT.md
    ├── WORKING_GUIDE.md
    └── FRONTEND_STRUCTURE.md
```

## 🎨 Layout Overview

### Left Sidebar (Fixed 280px)
- Logo & branding
- Main navigation (For You, Following, Explore, Likes, Bookmarks)
- Create button
- User profile
- Settings menu
- Logout button

### Main Content Area
- Header with tab info
- Responsive video grid
- Each video card shows:
  - Video/image thumbnail
  - Creator info overlay
  - Action buttons (like, comment, share, bookmark)

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register/
POST /api/auth/login/
```

### Profile
```
GET /api/profile/me/
PATCH /api/profile/{id}/
POST /api/profile/add_xp/
POST /api/profile/daily_checkin/
```

### Reels/Videos
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

### Subscription
```
GET /api/subscription/
POST /api/subscription/upgrade/
```

### Notifications
```
GET /api/notifications/me/
PUT /api/notifications/me/
```

## 🗄️ Database Schema

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

## 🎯 How to Use

### Sign Up
1. Go to http://localhost:5173
2. Click "Create Account 🚀"
3. Fill in your details
4. Complete the 5-step registration
5. You'll be logged in automatically

### Explore Content
1. Browse the "For You" feed
2. Like videos with ❤️
3. Comment with 💬
4. Share with 📤
5. Bookmark with 🔖

### Navigate
- **For You** - Trending content
- **Following** - Videos from creators you follow
- **Explore** - Discover new content
- **Likes** - Your liked videos
- **Bookmarks** - Saved videos

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- CSS-in-JS (inline styles)
- Fetch API

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- Token Authentication

### Database
- PostgreSQL 12+

## 📝 Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DB_ENGINE=django.db.backends.postgresql
DB_NAME=selfi_star
DB_USER=postgres
DB_PASSWORD=eden111310
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or any static host
```

### Backend
```bash
# Use Gunicorn + Nginx
gunicorn config.wsgi:application
```

## 📚 Documentation

- [TIKTOK_LAYOUT.md](./TIKTOK_LAYOUT.md) - Detailed layout documentation
- [WORKING_GUIDE.md](./WORKING_GUIDE.md) - Complete working guide
- [FRONTEND_STRUCTURE.md](./FRONTEND_STRUCTURE.md) - Frontend architecture

## 🐛 Troubleshooting

### Connection Refused
- Ensure both servers are running
- Check PostgreSQL is running

### CORS Error
- Backend CORS is configured for localhost:5173
- Update CORS_ALLOWED_ORIGINS in backend/config/settings.py if needed

### Database Error
- Verify PostgreSQL credentials in backend/.env
- Run migrations: `python manage.py migrate`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎉 Next Steps

1. Implement video upload functionality
2. Add real video playback
3. Implement comment system
4. Add follow/unfollow
5. Create user profile page
6. Add search functionality
7. Implement notifications
8. Add live streaming
9. Create creator analytics
10. Add monetization features

---

**Built with ❤️ by the Selfie Star Team**
