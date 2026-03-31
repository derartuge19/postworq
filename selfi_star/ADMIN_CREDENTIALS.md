# 🔐 Selfie Star Admin Panel - Access Credentials

## Admin Login Details

**URL:** http://localhost:8000/admin/

**Username:** `admin`  
**Password:** `admin123`

---

## 🎯 Admin Panel Features

### 📊 Analytics Dashboard
Access comprehensive platform analytics at: http://localhost:8000/admin/analytics/

**Metrics Available:**
- Total Users & Active Users (30 days)
- Total Reels, Votes, Comments, Follows
- Average Engagement Rates
- Subscription Distribution
- Top Creators Leaderboard
- Recent Activity Feed

### 👥 User Management
**Location:** Users → Users

**Features:**
- View user profiles with XP, Level, Followers, and Reels count
- Inline profile editing (bio, avatar, gamification stats)
- Bulk actions:
  - Activate/Deactivate users
  - Upgrade to Pro/Premium subscriptions
  - Reset user streaks
- Advanced filtering by activity, staff status, join date
- Search by username, email, name

### 📸 Content Moderation (Reels)
**Location:** Api → Reels

**Features:**
- Visual thumbnail previews
- Engagement statistics (votes, comments, saves, engagement rate)
- Bulk actions:
  - Feature reels
  - Delete with moderation
  - Boost votes (+10)
- Filter by creation date
- Search by username, caption, hashtags

### 💬 Comment Management
**Location:** Api → Comments

**Features:**
- View comments with likes and replies count
- Bulk actions:
  - Delete spam comments
  - Approve comments
- Filter by date
- Search by username and text

### 🎮 Gamification System

#### User Profiles
**Location:** Api → User Profiles

**Bulk Actions:**
- Add 100 XP / Add 500 XP
- Level up users (+1)
- Reset all stats

#### Quests
**Location:** Api → Quests

**Features:**
- Create/Edit quests with XP rewards
- View completion statistics
- Bulk actions:
  - Activate/Deactivate quests
  - Duplicate quests
- Track user quest progress

### 💎 Subscription Management
**Location:** Api → Subscriptions

**Features:**
- View all user subscriptions (Free, Pro, Premium)
- Check active/expired status
- Bulk actions:
  - Upgrade to Pro (30 days)
  - Upgrade to Premium (30 days)
  - Extend subscription by 30 days

### 🏆 Competition Management
**Location:** Api → Competitions

**Features:**
- Create/manage competitions with prizes
- Set start/end dates
- Track participants and winners
- Bulk activate/deactivate
- Announce winners

### 🔔 Notification Settings
**Location:** Api → Notification Preferences

**Features:**
- Manage user notification preferences
- Email, Push, SMS settings
- Filter by notification type

### 📈 Social Features

#### Follows
**Location:** Api → Follows
- Track follower/following relationships
- Filter by date

#### Saved Posts
**Location:** Api → Saved Posts
- View user-saved content
- Track popular content

#### Comment Likes & Replies
- Manage comment engagement
- Track conversation threads

---

## 🎨 Custom Branding

The admin panel features:
- **Purple gradient theme** matching the Selfie Star brand
- **Modern card-based layout** with smooth animations
- **Responsive design** for all screen sizes
- **Enhanced typography** for better readability
- **Color-coded statistics** for quick insights
- **Hover effects** and smooth transitions

---

## 🚀 Quick Actions from Dashboard

1. **View Analytics** - Comprehensive platform metrics
2. **Manage Users** - User administration and moderation
3. **Manage Reels** - Content moderation and curation
4. **Manage Competitions** - Create and run contests
5. **Manage Quests** - Gamification system
6. **Manage Subscriptions** - Revenue and premium features

---

## 💡 Admin Best Practices

### Content Moderation
1. Regularly check recent reels for inappropriate content
2. Use bulk delete for spam/violation content
3. Feature high-quality content to encourage creators

### User Management
1. Monitor active users (30-day metric)
2. Reward top creators with XP boosts or upgrades
3. Deactivate accounts violating terms of service

### Engagement Optimization
1. Create weekly/monthly quests to drive engagement
2. Run competitions to boost content creation
3. Monitor engagement rates and adjust strategies

### Revenue Management
1. Track subscription distribution
2. Offer promotional upgrades to active users
3. Monitor subscription expiration dates

---

## 🔧 Technical Details

### Database Models Managed
- **User & UserProfile** - User accounts and profiles
- **Reel** - Content posts
- **Comment, CommentLike, CommentReply** - Engagement
- **Vote** - Content voting
- **Follow** - Social connections
- **Quest & UserQuest** - Gamification
- **Competition & Winner** - Contests
- **Subscription** - Premium features
- **NotificationPreference** - User settings
- **SavedPost** - Bookmarked content

### Custom Admin Actions
- **User Actions:** Activate, Deactivate, Upgrade, Reset Streak
- **Profile Actions:** Add XP, Level Up, Reset Stats
- **Reel Actions:** Feature, Delete, Boost Votes
- **Quest Actions:** Activate, Deactivate, Duplicate
- **Subscription Actions:** Upgrade Plans, Extend Duration
- **Competition Actions:** Activate, Deactivate, Announce Winners

---

## 📞 Support

For admin panel issues or feature requests, contact the development team.

**Last Updated:** March 28, 2026
