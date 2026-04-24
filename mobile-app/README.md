# Flip Star Mobile App

React Native mobile app for Flip Star - A TikTok-style video sharing platform.

## Features

- **Authentication**: Login and register with secure token storage
- **Home Feed**: TikTok-style vertical video feed with swipe navigation
- **Discover**: Browse trending reels with search functionality
- **Create**: Upload and share video reels with captions
- **Notifications**: View and manage notifications
- **Profile**: View your profile, reels, and stats
- **Campaigns**: Browse and join active campaigns
- **Comments**: View and post comments on reels
- **Follow System**: Follow/unfollow users

## Shared Backend

This mobile app shares the same backend, database, and admin panel as the web version:
- **Backend API**: https://postworq.onrender.com/api
- **Authentication**: Same token-based auth system
- **Data**: All data is shared between web and mobile

## Tech Stack

- React Native with Expo
- React Navigation (Stack, Bottom Tabs)
- Expo Video for video playback
- Expo Image Picker for media selection
- Expo Secure Store for token storage
- Axios for API requests

## Installation

```bash
npm install
```

## Running the App

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Project Structure

```
mobile-app/
├── App.js                      # Main entry point
├── src/
│   ├── api.js                 # API integration layer
│   ├── config.js              # API configuration
│   ├── contexts/
│   │   └── AuthContext.js     # Authentication context
│   ├── navigation/
│   │   └── AppNavigator.js    # Main navigation
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js
│       │   └── RegisterScreen.js
│       ├── HomeScreen.js
│       ├── DiscoverScreen.js
│       ├── CreateScreen.js
│       ├── NotificationsScreen.js
│       ├── ProfileScreen.js
│       ├── VideoDetailScreen.js
│       ├── ProfileDetailScreen.js
│       ├── CommentsScreen.js
│       ├── CampaignsScreen.js
│       └── CampaignDetailScreen.js
└── package.json
```

## API Integration

The app uses the same API endpoints as the web version:
- `/auth/login/` - User login
- `/auth/register/` - User registration
- `/reels/` - Get all reels
- `/posts/create/` - Create new post
- `/profile/me/` - Get user profile
- And more...

See `src/api.js` for all available API methods.

## Authentication

Authentication uses token-based auth with secure storage:
- Tokens are stored using Expo Secure Store
- Auth state is managed via React Context
- Auto-login on app start if token exists

## Development Notes

- The app uses the production backend URL by default
- For local development, update `src/config.js` to use localhost
- Video uploads use XMLHttpRequest for progress tracking
- All API requests include retry logic for network errors
