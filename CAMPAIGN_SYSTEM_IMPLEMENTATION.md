# Campaign System Implementation Guide

## Overview
This document outlines the comprehensive campaign system implementation with themes, scoring, leaderboards, and winner selection.

## ✅ COMPLETED - Backend Infrastructure

### 1. Database Models Created

#### Core Models (`models_campaign_extended.py`)
- **CampaignTheme**: Weekly themes for campaigns
- **PostScore**: Scoring system for campaign posts (5 components)
- **UserCampaignStats**: Aggregated user statistics per campaign
- **Leaderboard**: Time-period based leaderboards (daily/weekly/monthly/overall)
- **LeaderboardEntry**: Individual user entries in leaderboards
- **WinnerSelection**: Winner selection process tracking
- **SelectedWinner**: Individual winners from selection
- **CampaignBadge**: Achievement badges for users

#### Extended Reel Model
- Added `campaign` (ForeignKey)
- Added `theme` (ForeignKey)
- Added `is_campaign_post` (Boolean)

### 2. Scoring System (100 Points Total)

| Component | Max Points | Description |
|-----------|------------|-------------|
| Creativity | 30 | Manual admin scoring or community voting |
| Engagement | 25 | Likes, comments, shares (organic only) |
| Consistency | 20 | Posting frequency and streaks |
| Quality | 15 | Video clarity, resolution checks |
| Theme Relevance | 10 | Match with current theme |

### 3. API Endpoints Created

#### Admin Endpoints (`views_campaign_admin.py`)
```
POST   /api/admin/campaigns/<id>/themes/                    - Create theme
GET    /api/admin/campaigns/<id>/themes/                    - List themes
PUT    /api/admin/campaigns/themes/<id>/                    - Update theme
DELETE /api/admin/campaigns/themes/<id>/                    - Delete theme
POST   /api/admin/campaigns/themes/<id>/activate/           - Activate theme
GET    /api/admin/campaigns/<id>/posts/pending/             - Get pending posts
POST   /api/admin/campaigns/posts/<id>/moderate/            - Approve/reject post
POST   /api/admin/campaigns/posts/<id>/scores/              - Update scores
POST   /api/admin/campaigns/<id>/leaderboard/generate/      - Generate leaderboard
POST   /api/admin/campaigns/<id>/winners/select/            - Select winners
GET    /api/admin/campaigns/<id>/analytics/                 - Get analytics
```

#### User Endpoints (`views_campaign_user.py`)
```
GET    /api/campaigns/active/                               - Get active campaigns
GET    /api/campaigns/<id>/extended/                        - Detailed campaign info
POST   /api/campaigns/posts/create/                         - Create campaign post
GET    /api/campaigns/<id>/feed/                            - Campaign feed (trending/top/latest)
GET    /api/campaigns/<id>/leaderboard/                     - View leaderboard
GET    /api/campaigns/<id>/winners/                         - View winners
GET    /api/campaigns/profile/                              - User campaign stats
GET    /api/campaigns/notifications/                        - Campaign notifications
POST   /api/campaigns/<id>/engagement/update/               - Update engagement scores
POST   /api/campaigns/<id>/consistency/update/              - Update consistency scores
```

### 4. Moderation Workflow

```
User creates post → PostScore (pending) → Admin moderates → Approved/Rejected
                                                ↓
                                         Scores calculated
                                                ↓
                                         User stats updated
                                                ↓
                                         Leaderboard updated
```

### 5. Winner Selection Logic

#### Daily Winners
- 70% from top scorers
- 30% random active participants

#### Weekly Winners
- Top scorers based on weekly total

#### Monthly Winners
- Top 3 users
- Weekly winners get bonus points

#### Grand Finale
- Only top monthly winners qualify
- 70% admin/judge scoring
- 30% community voting

## 🔧 NEXT STEPS - Frontend Implementation

### 1. Admin Panel Components Needed

#### Theme Management UI
```jsx
// Location: src/admin/pages/CampaignThemeManager.jsx
- List all themes for a campaign
- Create new theme (week number, title, description, dates)
- Edit existing themes
- Activate/deactivate themes
- View theme statistics
```

#### Post Moderation UI
```jsx
// Location: src/admin/pages/CampaignModeration.jsx
- List pending campaign posts
- View post details (media, caption, hashtags, user info)
- Approve/reject with reason
- Assign creativity, quality, theme relevance scores
- Bulk moderation actions
```

#### Leaderboard Management
```jsx
// Location: src/admin/pages/LeaderboardManager.jsx
- Generate leaderboards (daily/weekly/monthly/overall)
- View current leaderboards
- Finalize leaderboards
- Export leaderboard data
```

#### Winner Selection UI
```jsx
// Location: src/admin/pages/WinnerSelection.jsx
- Select winners for different periods
- Configure selection criteria (top % vs random %)
- View selected winners
- Manage prize distribution
```

#### Analytics Dashboard
```jsx
// Location: src/admin/pages/CampaignAnalytics.jsx
- Participation metrics
- Score statistics
- Theme performance
- Top performers
- Engagement trends
```

### 2. User-Facing Components Needed

#### Campaign Discovery
```jsx
// Location: src/pages/CampaignsPage.jsx (enhance existing)
- Active campaigns banner
- Campaign cards with active theme
- User's participation status
- Join campaign button
```

#### Campaign Detail Page
```jsx
// Location: src/pages/CampaignDetailPage.jsx (enhance existing)
- Campaign info with current theme
- Entry requirements display ✅ (DONE)
- Leaderboard tabs (daily/weekly/monthly/overall)
- Campaign feed (trending/top/latest posts)
- User's stats and rank
```

#### Post Creation with Campaign
```jsx
// Location: src/components/CreatePost.jsx (enhance existing)
- Campaign selection dropdown
- Auto-detect active theme
- Show campaign requirements
- Hashtag validation
- Submit for moderation notice
```

#### Campaign Feed
```jsx
// Location: src/pages/CampaignFeed.jsx
- Filter by theme
- Sort by trending/top/latest
- Post cards with scores visible
- Engagement actions (like, comment)
- User rank badges
```

#### User Campaign Profile
```jsx
// Location: src/pages/UserCampaignProfile.jsx
- All campaigns participated
- Total score per campaign
- Badges earned
- Streak information
- Win history
```

#### Leaderboard View
```jsx
// Location: src/components/CampaignLeaderboard.jsx
- Period selector (daily/weekly/monthly/overall)
- Ranked user list
- Current user highlight
- Score breakdown
- Prize information
```

### 3. Integration Points

#### Existing Post System
```javascript
// When creating a post, add:
{
  campaign_id: selectedCampaignId,
  theme_id: autoDetectedThemeId,
  is_campaign_post: true
}
```

#### Notification System
- New campaign notifications
- Post approved/rejected
- Leaderboard updates
- Winner announcements

#### User Profile Extension
- Add campaign stats section
- Display badges
- Show participation history

## 📋 Migration Steps

### 1. Run Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Initial Data (Optional)
```python
# Create a test campaign with themes
python manage.py shell
from api.models_campaign import Campaign
from api.models_campaign_extended import CampaignTheme
from django.utils import timezone
from datetime import timedelta

campaign = Campaign.objects.create(
    title="90-Day Creator Contest",
    description="Compete for prizes!",
    status="active",
    start_date=timezone.now(),
    entry_deadline=timezone.now() + timedelta(days=90),
    voting_start=timezone.now() + timedelta(days=90),
    voting_end=timezone.now() + timedelta(days=97),
    prize_value=10000,
    prize_title="Grand Prize",
    winner_count=3
)

# Create weekly themes
for week in range(1, 14):
    CampaignTheme.objects.create(
        campaign=campaign,
        title=f"Week {week} Theme",
        description=f"Theme description for week {week}",
        week_number=week,
        start_date=timezone.now() + timedelta(days=(week-1)*7),
        end_date=timezone.now() + timedelta(days=week*7)
    )
```

### 3. Test API Endpoints
Use Postman or curl to test:
- Theme creation
- Post submission
- Moderation workflow
- Leaderboard generation
- Winner selection

## 🎯 Key Features Implemented

✅ Campaign with weekly themes
✅ 5-component scoring system
✅ Moderation workflow (pending → approved/rejected)
✅ Dynamic leaderboards (daily/weekly/monthly/overall)
✅ Winner selection with configurable criteria
✅ User statistics and streaks
✅ Badge system
✅ Campaign-specific feed
✅ Engagement tracking (internal only)
✅ Consistency scoring based on posting frequency
✅ Admin analytics dashboard
✅ User campaign profile

## 🔐 Security & Validation

- All campaign posts require moderation
- Spam prevention through moderation
- Fake engagement detection (internal tracking only)
- Admin-only access to moderation and analytics
- User authentication required for all actions

## 📊 Performance Considerations

- Indexed fields for fast queries
- Leaderboard snapshots to avoid recalculation
- Batch score updates
- Efficient aggregation queries
- Pagination on feeds and leaderboards

## 🚀 Deployment Checklist

- [ ] Run migrations on production
- [ ] Create initial campaign and themes
- [ ] Test moderation workflow
- [ ] Verify scoring calculations
- [ ] Test leaderboard generation
- [ ] Configure automated tasks (score updates)
- [ ] Set up notifications
- [ ] Monitor performance
- [ ] Train admins on moderation tools

## 📝 Notes

- All content is stored internally (no external links)
- Engagement is fully controlled within the platform
- Scoring is transparent and configurable
- Winner selection can be overridden by admin
- System supports multiple concurrent campaigns
- Themes can be reused across campaigns
- Badges are automatically awarded based on achievements

## 🔄 Automated Tasks (Recommended)

Set up cron jobs or Celery tasks for:
1. **Hourly**: Update engagement scores
2. **Daily**: Generate daily leaderboard, select daily winners
3. **Weekly**: Generate weekly leaderboard, select weekly winners
4. **Monthly**: Generate monthly leaderboard, select monthly winners
5. **Daily**: Update consistency scores
6. **On theme end**: Auto-activate next theme

## 📞 Support & Maintenance

- Monitor moderation queue daily
- Review flagged content
- Adjust scoring weights based on feedback
- Update themes weekly
- Announce winners promptly
- Handle prize distribution
- Respond to user queries about scores/ranks
