# Architecture Deep Dive: SelfiStar/Postworq Project

## HIGH-LEVEL ARCHITECTURE

### System Overview

**Three-tier architecture with microservices pattern:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├──────────────────────┬──────────────────────────────────────┤
│  Web Frontend        │  Mobile App                          │
│  (React + Vite)      │  (React Native + Expo)               │
│  Hosted: Vercel      │  Not deployed yet                     │
│  URL: postworqq...   │                                      │
└──────────┬───────────┴──────────────┬───────────────────────┘
           │                          │
           │ HTTPS/REST API           │ HTTPS/REST API
           │                          │
           ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                        │
│                  Django REST Framework                       │
│                   Hosted: Render                             │
│                   URL: postworq.onrender.com                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ SQL (PostgreSQL)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│                  Neon PostgreSQL                             │
│              (Managed database service)                     │
└─────────────────────────────────────────────────────────────┘

External Services:
├─ Cloudinary (Media storage - videos, images)
└─ Neon (Database hosting)
```

### Deployment Architecture

**Platform-Native Deployment:**

- **Backend (Render):**
  - Runtime: Python 3.14
  - Web server: Gunicorn
  - Config: `render.yaml` (service definition, env vars)
  - Startup: `migrate_and_start.sh` (migrations + collectstatic + start)
  - Health check: `/api/` endpoint

- **Frontend (Vercel):**
  - Build: Vite
  - Config: `vercel.json` (build settings, routing rules)
  - Output: Static files in `dist/`
  - CDN: Vercel's edge network

- **Database (Neon):**
  - Managed PostgreSQL
  - Connection: SSL required
  - Credentials: Stored in Render env vars
  - Fallback: SQLite for local dev

### Communication Patterns

**REST API Architecture:**
- Protocol: HTTPS
- Authentication: Token-based (Django REST Framework Token)
- Data format: JSON
- CORS: Configured for cross-origin requests (Vercel ↔ Render)

**Caching Strategy:**
- Frontend: localStorage (10-30 min TTL)
- API layer: In-memory cache (60s TTL) with deduplication
- Cache invalidation: After mutations (POST/PUT/DELETE)

---

## LOW-LEVEL ARCHITECTURE

### Backend Architecture (Django)

**File Structure:**
```
backend/
├── config/
│   ├── settings.py          # Main Django settings (DB, CORS, middleware)
│   ├── production_settings.py  # Production overrides
│   ├── urls.py              # Root URL config
│   └── wsgi.py              # WSGI application entry point
├── api/
│   ├── models.py            # Core models (UserProfile, Reel, Comment, etc.)
│   ├── models_campaign.py   # Campaign models (Campaign, CampaignEntry, etc.)
│   ├── models_messaging.py  # Messaging models (Conversation, Message)
│   ├── models_gift.py       # Gift system models
│   ├── models_campaign_extended.py  # Scoring, leaderboards, badges
│   ├── views.py             # Core views (auth, posts, profile)
│   ├── views_campaign.py    # Campaign views
│   ├── views_messaging.py   # Messaging views
│   ├── views_admin.py       # Admin panel views
│   ├── serializers.py      # DRF serializers
│   ├── urls.py              # API URL routing
│   ├── middleware.py        # Custom middleware (CORS, video streaming)
│   ├── admin.py             # Django admin configuration
│   └── migrations/         # Database migrations
├── manage.py                # Django management script
└── requirements.txt        # Python dependencies
```

**Model Architecture:**

**Core Models (`models.py`):**
- `UserProfile` - Extended user data (XP, coins, gamification stats)
- `Reel` - Posts/reels (media, caption, hashtags, campaign links)
- `Comment` - Comments on posts
- `Vote` - Likes on posts
- `Follow` - User following relationships
- `Notification` - User notifications

**Campaign System (`models_campaign.py`):**
- `Campaign` - Campaign definitions (daily, weekly, monthly, grand)
- `CampaignEntry` - User entries into campaigns
- `CampaignVote` - Votes for grand campaigns
- `CampaignWinner` - Campaign winners
- `CampaignNotification` - Campaign-specific notifications

**Extended Campaign (`models_campaign_extended.py`):**
- `CampaignScoringConfig` - Scoring weights and rules
- `PostScore` - Engagement scores per post
- `UserCampaignStats` - User campaign statistics
- `Leaderboard` - Leaderboard snapshots
- `CampaignBadge` - Achievement badges

**Messaging (`models_messaging.py`):**
- `Conversation` - DM conversations
- `Message` - Individual messages
- `MessageRead` - Read receipts

**View Architecture:**

**ViewSet Pattern (DRF):**
- `UserProfileViewSet` - Profile CRUD operations
- `ReelViewSet` - Post CRUD operations
- `FollowViewSet` - Follow/unfollow operations
- `SubscriptionViewSet` - Subscription management

**Function-Based Views:**
- `register()` - User registration
- `login()` - User authentication
- `create_post()` - Post creation with Cloudinary upload
- `get_trending_reels()` - Trending content algorithm
- `health_check()` - Liveness probe (no DB)
- `health_check_deep()` - Full diagnostics with DB

**Custom Views by Domain:**
- `views_campaign.py` - Campaign CRUD, voting, scoring
- `views_messaging.py` - DM conversations, messages
- `views_admin.py` - Admin dashboard, user management
- `views_gamification.py` - XP, coins, daily spin
- `views_gift.py` - Gift system

**Middleware Stack:**
```
1. CorsMiddleware (django-cors-headers) - CORS handling
2. CustomCorsMiddleware - Custom Vercel-specific CORS
3. SecurityMiddleware - Security headers
4. SessionMiddleware - Session management
5. CommonMiddleware - Common utilities
6. CsrfViewMiddleware - CSRF protection
7. AuthenticationMiddleware - User authentication
8. MessageMiddleware - Django messages
9. XFrameOptionsMiddleware - Clickjacking protection
10. VideoStreamingMiddleware - Video streaming optimization
```

**Database Configuration:**
- **Production:** Neon PostgreSQL (SSL required, no connection pooling)
- **Local:** SQLite
- **Auto-detection:** Based on `RENDER` environment variable
- **Fallback:** SQLite if Neon connection fails

**Authentication:**
- Method: Token-based (DRF TokenAuthentication)
- Storage: Frontend localStorage / Mobile SecureStore
- Header: `Authorization: Token {token}`
- Token generation: On login/registration

---

### Frontend Architecture (React)

**File Structure:**
```
src/
├── App.jsx                 # Root component (routing, state)
├── api.js                  # API client (fetch, caching, auth)
├── config.js               # Configuration (API URLs)
├── main.jsx                # React entry point
├── components/
│   ├── AppShell.jsx        # Main layout shell
│   ├── TikTokLayout.jsx    # TikTok-style feed layout
│   ├── HomePage.jsx        # Home feed
│   ├── ProfilePage.jsx     # User profile
│   ├── EnhancedPostPage.jsx  # Post creation
│   ├── MessagesPage.jsx    # Messaging
│   ├── CampaignsPage.jsx   # Campaign listing
│   ├── ExplorerPage.jsx    # Trending/explore
│   ├── GamificationBar.jsx  # Gamification UI
│   └── ... (40+ components)
├── pages/
│   ├── CampaignsPage.jsx
│   ├── CampaignDetailPage.jsx
│   ├── CampaignLeaderboard.jsx
│   └── CampaignFeed.jsx
├── admin/
│   └── AdminApp.jsx        # Admin panel
├── contexts/
│   └── ThemeContext.jsx    # Theme management
└── services/
    └── ... (business logic)
```

**Component Architecture:**

**Root Component (`App.jsx`):**
- State management for all views
- Lazy loading with `React.lazy()` for performance
- Error boundary for lazy loading failures
- Skeleton loading states
- Admin panel routing check (`/admin` path)

**Lazy Loading Strategy:**
```javascript
// All non-critical components lazy-loaded
const ModernLoginScreen = lazy(() => import('./components/ModernLoginScreen'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
// ... 20+ lazy-loaded components
```

**State Management:**
- **Local component state** - useState for component-level state
- **Context API** - ThemeContext for theme management
- **localStorage** - Auth token, user data, cache
- **API cache** - In-memory Map with TTL (60s)

**API Client (`api.js`):**
- **Caching:** In-memory Map with TTL (60s default)
- **Deduplication:** `_inflight` Map prevents duplicate requests
- **Retry logic:** Exponential backoff for network errors
- **Token management:** Auto-includes auth token in headers
- **Cache invalidation:** Pattern-based invalidation after mutations

**Key Features:**
- Optimistic UI updates (like, save, follow)
- Cache invalidation on mutations
- Request deduplication
- Error handling with retries
- Progress tracking for uploads

**Routing:**
- Hash-based routing
- Conditional rendering based on state
- No external router library (custom implementation)

---

### Mobile App Architecture (React Native)

**File Structure:**
```
src/
├── navigation/
│   └── AppNavigator.js     # React Navigation setup
├── screens/
│   ├── HomeScreen.js       # Home feed
│   ├── ReelsScreen.js      # TikTok-style feed
│   ├── CreateScreen.js     # Post creation
│   ├── ProfileScreen.js    # User profile
│   ├── CampaignsScreen.js  # Campaign listing
│   └── ... (20 screens)
├── components/
│   └── GamificationBar.js  # Gamification UI
├── contexts/
│   └── AuthContext.js      # Authentication context
├── api.js                  # API client (same as web)
└── config.js               # Configuration
```

**Navigation Architecture:**
```
AppNavigator (Root)
├─ AuthStack (when not authenticated)
│  ├─ LoginScreen
│  └─ RegisterScreen
└─ MainStack (when authenticated)
   ├─ MainTabs (Bottom tab bar)
   │  ├─ HomeScreen
   │  ├─ ReelsScreen
   │  ├─ CreateScreen (center button)
   │  ├─ NotificationsScreen
   │  └─ ProfileScreen
   └─ Stack screens (push navigation)
      ├─ VideoDetailScreen
      ├─ ProfileDetailScreen
      └── ...
```

**Key Differences from Web:**
- **Token storage:** SecureStore (encrypted) vs localStorage
- **File handling:** expo-image-picker vs HTML file input
- **Video playback:** expo-av vs HTML5 video
- **Navigation:** React Navigation vs hash routing
- **Permissions:** Camera/photo library required

**API Client:** Nearly identical to web, but with async token operations for SecureStore.

---

## DATA FLOW & INTEGRATION PATTERNS

### Authentication Flow

**Registration:**
```
Frontend form → api.register() → POST /api/auth/register/
→ Backend: views.py register()
→ Create User → Create UserProfile → Generate Token → Log to SystemLog
→ Response: { user, token }
→ Frontend: localStorage.setItem('authToken', token) → Navigate home
```

**Login:**
```
Frontend form → api.login() → POST /api/auth/login/
→ Backend: views.py login()
→ Try username → Try email → Verify password → Generate Token
→ Response: { user, token } or 401 error
→ Frontend: Store token → Update state → Navigate
```

### Content Upload Flow

**Post Creation:**
```
Frontend: EnhancedPostPage
→ Select file → Validate size → Generate preview
→ Add caption/hashtags → Select campaign (optional)
→ api.createPost(formData, { onProgress })
→ XMLHttpRequest with progress tracking
→ Backend: views.py create_post()
→ Upload to Cloudinary (resource_type: video/image)
→ Create Reel record with Cloudinary URL
→ Raw SQL UPDATE to avoid Django re-upload
→ Award XP (+25)
→ Response: ReelSerializer data
→ Frontend: Invalidate cache → Show success → Navigate
```

### Campaign System Flow

**Campaign Types:**
- **Daily:** Split scoring + random selection + one-win-per-cycle limit
- **Weekly/Monthly:** Pure scoring + one-win-per-cycle limit
- **Grand:** Votes + judge scores + no limit

**Scoring Pipeline:**
```
1. Engagement Score Calculation
   → views_campaign_user.py update_engagement_scores()
   → Calculate: (likes*weight + comments*weight + shares*weight + views*weight)
   → Store in PostScore

2. Consistency Score Calculation
   → views_campaign_user.py update_consistency_scores()
   → Count posts → Check frequency → Calculate consistency
   → Store in UserCampaignStats

3. Final Score Calculation
   → views_scoring.py admin_calculate_scores()
   → final_score = (engagement * weight) + (consistency * weight) + (quality * weight)
   → Update CampaignEntry.final_score

4. Leaderboard Generation
   → views_campaign_admin.py admin_generate_leaderboard()
   → Sort by final_score → Assign ranks → Handle ties

5. Winner Selection
   → views_campaign_admin.py admin_select_winners()
   → Type-specific logic → Create CampaignWinner records
```

**Voting Flow (Grand Campaigns):**
```
Frontend: CampaignFeed
→ Check: campaign_type === 'grand' AND phase === 'voting'
→ Show vote buttons
→ User votes → POST /api/campaigns/{id}/vote/
→ Backend: views_campaign.py user_campaign_vote()
→ Validate: voting phase, not already voted, grand type
→ Create CampaignVote → Increment vote_count → Log
→ Frontend: Update counter (optimistic) → Disable button
```

### Messaging Flow

**Conversation List:**
```
Frontend: MessagesPage
→ GET /api/messages/conversations/
→ Backend: views_messaging.py list_or_create_conversations()
→ Annotate: last message details, unread count (correlated subquery)
→ Order by: last_message_at
→ Display: Participant info, preview, timestamp, unread count
```

**Send Message:**
```
Frontend: MessagesPage
→ User types text or selects media
→ If media: Upload to Cloudinary first → Get URL
→ POST /api/messages/conversations/{id}/messages/
→ Backend: views_messaging.py conversation_messages POST
→ Validate: User is participant
→ Create Message → Update conversation.last_message_at
→ Create notification for recipient
→ Frontend: Add to state (optimistic) → Scroll to bottom
```

### Caching Strategy

**Frontend Cache:**
```javascript
// localStorage cache with TTL
const HOMEPAGE_CACHE_KEY = 'homepage_feed_cache';
const PROFILE_CACHE_KEY = `profile_cache_${userId}`;
const TTL = {
  homepage: 10 * 60 * 1000,  // 10 min
  profile: 30 * 60 * 1000,   // 30 min
  follow: 30 * 60 * 1000,     // 30 min
};
```

**API Cache:**
```javascript
// In-memory cache with deduplication
const _cache = new Map();
const _inflight = new Map();
const CACHE_TTL = 60_000; // 60s

// Prevents duplicate requests for same endpoint
// Auto-invalidates on mutations
```

### Performance Optimizations

**Frontend:**
- Lazy loading (React.lazy + Suspense)
- Code splitting (Vite)
- Optimistic UI updates
- Request deduplication
- Skeleton loading states
- Image optimization (Cloudinary)

**Backend:**
- Database annotations (avoid N+1 queries)
- Pagination on all list endpoints
- Video streaming middleware (range requests)
- Static files via WhiteNoise
- Health check without DB (keep-alive)

**Deployment:**
- Keep-alive ping (10 min interval)
- CDN (Vercel edge network)
- SSL everywhere
- Connection pooling disabled (Neon compatibility)

---

## ARCHITECTURAL PATTERNS & DESIGN DECISIONS

### Patterns Used

1. **Repository Pattern:** ViewSets encapsulate data access
2. **Service Layer:** Separate view files for domains (campaigns, messaging, admin)
3. **DTO Pattern:** Serializers transform models to API responses
4. **Middleware Pattern:** Custom middleware for CORS, video streaming
5. **Factory Pattern:** Django's model factory for object creation
6. **Observer Pattern:** Django signals for model events
7. **Strategy Pattern:** Campaign scoring varies by type
8. **Lazy Loading:** React.lazy for code splitting
9. **Cache-Aside:** API cache with TTL
10. **Optimistic UI:** Update state before server confirmation

### Key Design Decisions

**Why Platform-Native Deployment?**
- Simpler than Docker for this stack
- Render/Vercel handle scaling automatically
- Faster development cycle
- Lower operational overhead

**Why Token Authentication?**
- Stateless (no server-side session storage)
- Easy to implement with DRF
- Works well with mobile apps
- Simple for client-side storage

**Why Separate Model Files?**
- Organized by domain (campaigns, messaging, gifts)
- Easier to maintain large codebase
- Clear separation of concerns
- Better for team collaboration

**Why In-Memory API Cache?**
- Faster than Redis for this scale
- Simple implementation
- Deduplication prevents redundant requests
- 60s TTL balances freshness vs performance

**Why Cloudinary for Media?**
- Handles video processing/transcoding
- CDN built-in
- Free tier sufficient for MVP
- Better than local storage on Render (ephemeral)

---

## SECURITY CONSIDERATIONS

**Authentication:**
- Token-based (stateless)
- Token stored in localStorage (web) / SecureStore (mobile)
- Sent in Authorization header
- Public endpoints: /auth/, /health/

**CORS:**
- Allowed origins configured
- Custom middleware for Vercel
- Fallback: CORS_ALLOW_ALL_ORIGINS=True (dev)

**Input Validation:**
- Django serializers validate all inputs
- File size limits: 50MB max
- Allowed file types: .mp4, .webm, .mov, .jpg, .png

**Logging:**
- SystemLog table for security events
- Login attempts (success/failure)
- IP address tracking
- Admin actions logged

**Rate Limiting:**
- Not yet implemented (Redis recommended)
- Can be added with Django Ratelimit

---

## DEPLOYMENT FILES REFERENCE

### Render Configuration
- **File:** `selfi_star/render.yaml`
- **Purpose:** Defines backend service on Render
- **Contains:** Build command, start command, environment variables

### Vercel Configuration
- **File:** `selfi_star/vercel.json`
- **Purpose:** Defines frontend build settings
- **Contains:** Build command, output directory, routing rules

### Startup Scripts
- **File:** `selfi_star/backend/migrate_and_start.sh`
- **Purpose:** Runs migrations and starts Django server on Render
- **Contains:** Migration commands, collectstatic, gunicorn start

### Environment Files
- **File:** `selfi_star/backend/render.env`
- **Purpose:** Render environment variables reference
- **Contains:** Database credentials, API keys, CORS settings

### Deployment Documentation
- **File:** `selfi_star/DEPLOY_RENDER_VERCEL.md`
- **Purpose:** Step-by-step deployment guide
- **Contains:** Setup instructions for Render and Vercel

---

## DATABASE SCHEMA OVERVIEW

### Core Tables
- `auth_user` - User accounts
- `api_userprofile` - User profiles (bio, photo, XP, stats)
- `api_reel` - Posts/reels (media, caption, hashtags)
- `api_comment` - Comments on posts
- `api_vote` - Likes on posts
- `api_savedpost` - Saved posts
- `api_follow` - Follow relationships
- `api_notification` - User notifications

### Campaign Tables
- `api_campaign` - Campaigns (daily, weekly, monthly, grand)
- `api_campaignentry` - Campaign entries
- `api_campaignvote` - Campaign votes
- `api_campaignwinner` - Campaign winners
- `api_postscore` - Engagement scores
- `api_usercampaignstats` - User campaign statistics
- `api_leaderboard` - Leaderboard snapshots

### Messaging Tables
- `api_conversation` - DM conversations
- `api_message` - DM messages
- `api_messageread` - Read receipts

### Gamification Tables
- `api_gift` - Gift definitions
- `api_gifttransaction` - Gift transactions
- `api_giftcombo` - Gift combinations

---

## API ENDPOINTS SUMMARY

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout

### Posts
- `GET /api/reels/` - List posts
- `POST /api/posts/create/` - Create post
- `GET /api/reels/{id}/` - Get post details
- `PATCH /api/reels/{id}/` - Update post
- `DELETE /api/reels/{id}/` - Delete post

### Campaigns
- `GET /api/campaigns/active/` - List active campaigns
- `GET /api/campaigns/{id}/` - Campaign details
- `GET /api/campaigns/{id}/feed/` - Campaign feed
- `GET /api/campaigns/{id}/leaderboard/` - Campaign leaderboard
- `POST /api/campaigns/{id}/vote/` - Vote for grand campaign

### Messaging
- `GET /api/messages/conversations/` - List conversations
- `POST /api/messages/conversations/` - Create conversation
- `GET /api/messages/conversations/{id}/messages/` - Get messages
- `POST /api/messages/conversations/{id}/messages/` - Send message

### Profile
- `GET /api/profile/{id}/` - Get profile
- `PATCH /api/profile/update_profile/` - Update profile
- `POST /api/follows/toggle/` - Follow/unfollow user

### Admin
- `GET /api/admin/dashboard/` - Admin dashboard stats
- `GET /api/admin/users/` - List users
- `GET /api/admin/campaigns/` - List campaigns
- `POST /api/admin/campaigns/create/` - Create campaign

### Health
- `GET /api/health/` - Liveness probe (no DB)
- `GET /api/health/deep/` - Full health check (with DB)

---

## CONCLUSION

This architecture provides a solid foundation for a social media platform with campaigns, messaging, and gamification, while maintaining simplicity for rapid development and deployment. The platform-native approach using Render and Vercel eliminates the complexity of containerization while providing automatic scaling and CDN capabilities. The separation of concerns across multiple model files, view files, and components makes the codebase maintainable as it grows.

---

**Document Generated:** April 24, 2026
**Project:** SelfiStar/Postworq
**Version:** 1.0
