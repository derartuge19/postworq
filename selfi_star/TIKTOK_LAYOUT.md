# Selfie Star - TikTok-Like Layout

## New Layout Structure

### Left Sidebar (280px fixed)
- **Logo & Branding** - Selfie Star logo at top
- **Main Navigation Menu**
  - 🏠 For You - Discover trending content
  - 👥 Following - Videos from creators you follow
  - 🔍 Explore - What's trending now
  - ❤️ Likes - Videos you've liked
  - 🔖 Bookmarks - Your saved videos
- **Create Button** - 📹 Create (for uploading videos)
- **User Profile Section** - Shows logged-in user info
- **Settings Menu**
  - 👤 Profile
  - 🔔 Notifications
  - 🔒 Privacy & Safety
  - ⚙️ Settings
  - ❓ Help & Feedback
- **Logout Button** - At the bottom

### Main Content Area (Responsive)
- **Header** - Shows current tab name and description
- **Video Grid** - Responsive grid of video cards
  - Each card is 300px wide (adjusts on smaller screens)
  - Maintains 9:16 aspect ratio (vertical video format)
  - Max height of 600px

### Video Card Features
- **Video/Image Display** - Shows thumbnail or video
- **Play Button Overlay** - ▶️ indicator
- **Creator Info Overlay** - At bottom with gradient background
  - Creator avatar
  - Creator name & handle
  - Follow button
  - Video caption
- **Action Sidebar** (Right side of video)
  - ❤️ Like button with count
  - 💬 Comment button with count
  - 📤 Share button with count
  - 🔖 Bookmark button
  - All actions are vertical and positioned on the right

## Component Structure

```
MainLayout
├── Sidebar
│   ├── Logo
│   ├── Menu Items
│   ├── Create Button
│   ├── User Profile
│   ├── Settings Menu
│   └── Logout Button
└── FeedPage
    ├── Header
    └── VideoCard (Grid)
        ├── Video/Image
        ├── Creator Info Overlay
        └── Action Sidebar
```

## Features Implemented

✅ Fixed left sidebar (280px)
✅ Responsive main content area
✅ Video card grid layout
✅ Creator info overlay
✅ Action buttons (like, comment, share, bookmark)
✅ Tab switching (For You, Following, Explore, Likes, Bookmarks)
✅ User profile display
✅ Settings menu
✅ Logout functionality

## Features to Implement

- [ ] Real video upload
- [ ] Video playback with controls
- [ ] Comment section
- [ ] Follow/Unfollow creators
- [ ] Like/Unlike videos
- [ ] Share videos
- [ ] Bookmark videos
- [ ] Search functionality
- [ ] Notifications
- [ ] User profile page
- [ ] Creator analytics
- [ ] Trending hashtags
- [ ] Live streaming
- [ ] Direct messaging

## Styling Details

### Colors
- Primary: #DA9B2A (Gold)
- Text: #1C1917 (Dark)
- Subtitle: #78716C (Gray)
- Background: #FAFAF7 (Light)
- Border: #E7E5E4 (Light Gray)
- Dark: #0C1A12 (Very Dark)

### Sidebar
- Fixed width: 280px
- Fixed position: left 0, top 0
- Height: 100vh
- Scrollable content
- White background with borders

### Video Cards
- Grid layout with auto-fill
- Min width: 300px
- Aspect ratio: 9/16
- Max height: 600px
- Black background
- Rounded corners: 12px

### Actions
- Positioned absolutely on right side
- Vertical layout
- Emoji icons with counts
- Hover effects

## Responsive Behavior

- Sidebar remains fixed on desktop
- Main content adjusts to available width
- Video grid adjusts column count based on screen size
- On mobile, sidebar could be hidden/drawer

## Next Steps

1. Connect to real API for videos
2. Implement video upload
3. Add comment functionality
4. Implement follow system
5. Add search
6. Create user profile page
7. Add notifications
8. Implement live streaming
