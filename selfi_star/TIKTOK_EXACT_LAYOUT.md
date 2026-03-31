# Selfie Star - Exact TikTok Website Layout

## Layout Structure (3-Column Design)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  LEFT SIDEBAR (250px)  │  CENTER FEED (600px)  │  RIGHT SIDEBAR (320px)
│  ─────────────────────────────────────────────────────────────  │
│                       │                       │                 │
│  ⭐ Selfie Star       │  For You              │  🔍 Search      │
│                       │  ─────────────────    │  ─────────────  │
│  🏠 For You           │                       │                 │
│  🔍 Explore           │  ┌─────────────────┐  │  Recommended    │
│  👥 Following         │  │                 │  │  Creators       │
│  💬 Inbox             │  │   🎬 VIDEO 1    │  │  ─────────────  │
│  🔖 Bookmarks         │  │                 │  │                 │
│                       │  │  Creator Info   │  │  👤 Creator 1   │
│  📹 Create            │  │  Follow Button  │  │  @handle1       │
│  ─────────────────    │  │                 │  │  1.2M followers │
│                       │  │  Actions:       │  │  [Follow]       │
│  👤 User Profile      │  │  🤍 ❤️ 1234    │  │                 │
│  [Logout]             │  │  💬 89          │  │  👤 Creator 2   │
│                       │  │  📤 45          │  │  @handle2       │
│                       │  │  🔖             │  │  2.5M followers │
│                       │  │                 │  │  [Follow]       │
│                       │  └─────────────────┘  │                 │
│                       │                       │  👤 Creator 3   │
│                       │  ┌─────────────────┐  │  @handle3       │
│                       │  │                 │  │  890K followers │
│                       │  │   🎬 VIDEO 2    │  │  [Follow]       │
│                       │  │                 │  │                 │
│                       │  │  Creator Info   │  │  ... more       │
│                       │  │  Follow Button  │  │                 │
│                       │  │                 │  │  ─────────────  │
│                       │  │  Actions:       │  │  About Newsroom │
│                       │  │  🤍 5678        │  │  Contact Terms  │
│                       │  │  💬 234         │  │  © 2026         │
│                       │  │  📤 123         │  │                 │
│                       │  │  🔖             │  │                 │
│                       │  │                 │  │                 │
│                       │  └─────────────────┘  │                 │
│                       │                       │                 │
│                       │  (Scroll for more)    │                 │
│                       │                       │                 │
└─────────────────────────────────────────────────────────────────┘
```

## Left Sidebar (250px - Fixed)

### Navigation Menu
- 🏠 For You - Trending content
- 🔍 Explore - Discover new creators
- 👥 Following - Videos from followed creators
- 💬 Inbox - Messages
- 🔖 Bookmarks - Saved videos

### Create Button
- Large button to upload new videos

### User Profile Section
- Avatar
- Username
- Email
- Logout button

## Center Feed (600px - Scrollable)

### Video Cards
- **Aspect Ratio**: 9:16 (vertical)
- **Max Height**: 600px
- **Background**: Black with gradient
- **Border Radius**: 12px

### Video Content
- Video/Image placeholder (🎬)
- Creator info overlay at bottom with gradient background
- Creator avatar, name, handle
- Follow button
- Video caption

### Action Buttons (Right Side)
- 🤍 Like with count
- 💬 Comment with count
- 📤 Share with count
- 🔖 Bookmark

### Scrolling
- Vertical scroll through videos
- One video per view (like TikTok)
- Smooth scrolling

## Right Sidebar (320px - Fixed)

### Search Bar
- Search for creators
- Rounded search input

### Recommended Creators
- Creator avatar
- Creator name
- Creator handle
- Follower count
- Follow button

### Footer Links
- About, Newsroom, Contact, Careers
- Privacy, Terms
- Copyright notice

## Color Scheme

- Primary: #DA9B2A (Gold)
- Text: #1C1917 (Dark)
- Subtitle: #78716C (Gray)
- Background: #FAFAF7 (Light)
- Border: #E7E5E4 (Light Gray)
- Video Background: #000 (Black)

## Responsive Behavior

### Desktop (1400px+)
- All three columns visible
- Left sidebar: 250px
- Center feed: 600px
- Right sidebar: 320px

### Tablet (1024px - 1399px)
- Left sidebar: 200px
- Center feed: 500px
- Right sidebar: 280px

### Mobile (< 1024px)
- Left sidebar: Hidden/Drawer
- Center feed: Full width
- Right sidebar: Hidden/Drawer

## Key Features

✅ Fixed left sidebar with navigation
✅ Scrollable center feed with videos
✅ Fixed right sidebar with recommendations
✅ Video cards with creator info overlay
✅ Action buttons on right side of video
✅ Search functionality
✅ Recommended creators list
✅ Follow buttons
✅ Responsive design

## Next Steps

1. Connect to real API for videos
2. Implement infinite scroll
3. Add video playback
4. Implement like/comment/share
5. Add follow functionality
6. Create search functionality
7. Add notifications
8. Implement user profile page
9. Add video upload
10. Create creator analytics
