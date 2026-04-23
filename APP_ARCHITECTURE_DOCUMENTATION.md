# FlipStar App - Complete Architecture & Flow Documentation

## System Overview

**Architecture:**
- Frontend: React 18 + Vite (Vercel)
- Backend: Django 4.2 + DRF (Render)
- Database: PostgreSQL (Neon) / SQLite (local)
- Media Storage: Cloudinary (primary) / Local (fallback)
- Auth: Token-based (Django REST Framework)

---

## 1. Authentication Flows

### User Registration Flow
```
User fills form → Frontend (ModernRegisterScreen) → Backend API → Database → Response

STEP 1: User fills registration form
- Fields: username, email, password, first_name, last_name
- Component: ModernRegisterScreen.jsx

STEP 2: Frontend sends POST request
- API: api.register(username, email, password, firstName, lastName)
- Endpoint: POST /api/auth/register/
- Body: { username, email, password, first_name, last_name }

STEP 3: Backend processes (views.py - register())
- Validate data → Create User → Create UserProfile → Generate Token → Log to SystemLog
- Response: { user: {...}, token: "xxxxx" }

STEP 4: Frontend handles response
- Store token: localStorage.setItem('authToken', token)
- Store user: localStorage.setItem('user', JSON.stringify(user))
- Set API token: api.setAuthToken(token)
- Update state: setAuthUser(user)
- Navigate to: Home page

STEP 5: Database changes
- auth_user (new row)
- api_userprofile (new row)
- authtoken_token (new row)
```

### User Login Flow
```
User fills form → Frontend (ModernLoginScreen) → Backend API → Database → Response

STEP 1: User fills login form
- Fields: email/username, password
- Component: ModernLoginScreen.jsx

STEP 2: Frontend sends POST request
- API: api.login(username, password)
- Endpoint: POST /api/auth/login/
- Body: { username, password }

STEP 3: Backend processes (views.py - login())
- Try username → Try email → Verify password → Generate Token → Log to SystemLog
- Success: { user: {...}, token: "xxxxx" }
- Failure: { error: "Invalid credentials" } (401)

STEP 4: Frontend handles response
- Success: Store token/user → setAuthUser → Navigate home
- Failure: Show error → Stay on login screen

STEP 5: Security logging
- Log type: 'security'
- Message: "Successful login: {username}" or "Failed login attempt: {username}"
- IP address: Extracted from HTTP_X_FORWARDED_FOR
```

### User Logout Flow
```
User clicks logout → Frontend cleanup → Navigate to login

STEP 1: User clicks logout (handleLogout in App.jsx)
STEP 2: Frontend cleanup
- api.setAuthToken(null)
- localStorage.removeItem('authToken', 'adminToken', 'user')
- sessionStorage.removeItem('_nav')
- _cache.clear()
- Reset all states (authUser, showProfile, showPostPage, etc.)
- setActiveTab('home')
- setShowLogin(true)
```

---

## 2. Content Viewing Flows

### Home Page Feed Flow
```
User opens app → Check cache → Fetch from backend → Display

STEP 1: User opens app / navigates to home
- Component: App.jsx (activeTab = 'home')
- Renders: HomePage.jsx

STEP 2: Check local cache (10 min TTL)
- Cache key: 'homepage_feed_cache'
- If hit: Load from localStorage → Merge with local engagement → Display immediately
- If miss: Show loading state

STEP 3: Fetch from backend
- API: api.request('/reels/')
- Endpoint: GET /api/reels/
- Headers: Authorization: Token {token}
- Query params: ?saved=true, ?user={userId}, ?hashtags__icontains={tag}
- Cache: 60s TTL

STEP 4: Backend processes (views.py - ReelViewSet.list())
- QuerySet: Reel.objects.all()
- Annotations: comment_count_db, votes_count_db, is_liked_db, is_saved_db
- Ordering: -created_at
- Serializer: ReelSerializer

STEP 5: Database query
- Table: api_reel
- Joins: api_user, api_comment, api_vote, api_savedpost

STEP 6: Frontend processes
- setPosts(data) → writeHomeCache(data) → mergeLocalEngagement(posts) → Display

STEP 7: User interactions
- Like: POST /api/reels/{id}/vote/ → Update local state (optimistic)
- Save: POST /api/saved/toggle/ → Update local state (optimistic)
- Comment: POST /api/reels/{id}/comments/ → Refresh comments
```

### View Single Post Flow
```
User clicks post → Fetch details → Fetch comments → Build tree → Display

STEP 1: User clicks on post (VideoDetailPage.jsx)
- State: setShowVideoDetail(true), setVideoDetailId(postId)

STEP 2: Fetch post details
- API: api.request(`/reels/${postId}/`)
- Endpoint: GET /api/reels/{id}/
- Backend: ReelViewSet.retrieve()

STEP 3: Fetch comments
- API: api.getComments(postId)
- Endpoint: GET /api/reels/{id}/comments/
- Response: Flat list of comments

STEP 4: Build comment tree (buildCommentTree function)
- Create map → Identify roots → Attach replies → Return hierarchy

STEP 5: Display post
- Video player → User info → Engagement metrics → Caption → Comments → Action buttons
```

### Explorer/Trending Flow
```
User navigates to explorer → Fetch trending → Display

STEP 1: User navigates to explorer (ExplorerPage.jsx)
- Tab: 'trending' or 'hashtags'

STEP 2: Fetch trending content
- API: api.request('/explorer/trending/')
- Endpoint: GET /api/explorer/trending/
- Backend: views_reels.py - get_trending_reels()
- Logic: Filter last 7 days → Sort by (votes*2 + views) → Exclude "not interested" → Top 50

STEP 3: Fetch trending hashtags
- API: api.getTrendingHashtags()
- Endpoint: GET /api/explorer/trending-hashtags/
- Logic: Count hashtag usage (7 days) → Sort by frequency → Top 20

STEP 4: Filter by hashtag
- API: api.request(`/explorer/hashtag/?tag=${hashtag}`)
- Endpoint: GET /api/explorer/hashtag/
- Logic: Filter reels by hashtag
```

---

## 3. Content Upload Flows

### Create Post Flow (Video/Image)
```
User opens create page → Select media → Add details → Upload → Cloudinary → Database → Response

STEP 1: User opens create page (EnhancedPostPage.jsx)
- Stage: 'capture' → Modes: 'upload' or 'camera'

STEP 2: Select media source
- Upload: Select file → Validate size → Generate preview
- Camera: Request permissions → Record → Apply filters → Add text → Add sound → Save to Blob

STEP 3: Add post details
- Stage: 'details'
- Inputs: Caption, Hashtags, Campaign (optional), Visibility

STEP 4: Upload to backend
- API: api.createPost(formData, { onProgress })
- Endpoint: POST /api/posts/create/
- Method: XMLHttpRequest (for progress)
- Headers: Authorization: Token {token}
- Body: FormData (file, caption, hashtags, campaign_id)
- Timeout: 5 minutes

STEP 5: Backend processes (views.py - create_post())
- Validate file → Detect content type
- Step 1: Upload to Cloudinary (resource_type: video/image, folder: reels)
- Step 2: Create Reel record (user, caption, hashtags)
- Step 3: Attach media via raw SQL UPDATE (avoid Django re-upload)
- Step 4: Award XP (+25 to user)
- Response: ReelSerializer data

STEP 6: Frontend handles
- On progress: Update progress bar (0-100%)
- On success: Invalidate cache → Show success → Navigate to post
- On error: Show error → Stay on create page

STEP 7: Database changes
- api_reel (new row: user, caption, hashtags, media, image)
- UserProfile.xp += 25
- Cloudinary: New media file
```

### Edit Post Flow
```
User opens edit menu → Load data → Make changes → Save → Update

STEP 1: User opens edit menu (ProfilePage.jsx or VideoDetailPage.jsx)
- Click "..." → Select "Edit" → setEditingPost(post)

STEP 2: Load post data
- Pre-fill: Caption, Hashtags
- Media: Read-only

STEP 3: User makes changes
- Edit caption, hashtags
- Click "Save"

STEP 4: Send update
- API: api.updatePost(postId, data)
- Endpoint: PATCH /api/reels/{id}/
- Body: { caption, hashtags }
- Invalidate cache: invalidateCache('/reels')

STEP 5: Backend processes (views.py - ReelViewSet.update())
- Validate user is owner → Update fields → Save → Response

STEP 6: Frontend updates
- Update state → Show success → Refresh display
```

### Delete Post Flow
```
User opens delete menu → Confirm → Delete → Cleanup

STEP 1: User opens delete menu
- Click "..." → Select "Delete" → Show confirmation

STEP 2: User confirms
- setConfirmDeleteId(postId)

STEP 3: Send delete request
- API: api.deletePost(postId)
- Endpoint: DELETE /api/reels/{id}/
- Invalidate cache

STEP 4: Backend processes (views.py - ReelViewSet.destroy())
- Validate user is owner → reel.delete() (cascading: comments, votes, saved, campaign entries)

STEP 5: Frontend updates
- Remove from state → Show success → Refresh feed
```

---

## 4. Campaign & Voting Flows

### View Campaigns Flow
```
User navigates to campaigns → Fetch active → View details → View feed → View leaderboard

STEP 1: User navigates to campaigns (CampaignsPage.jsx)
- setActiveTab('campaigns')

STEP 2: Fetch active campaigns
- API: api.request('/campaigns/active/')
- Endpoint: GET /api/campaigns/active/
- Backend: views_campaign_user.py - get_active_campaigns()
- Logic: Filter status='active' → Check dates → Include campaign_type → Return list

STEP 3: View campaign details
- API: api.request(`/campaigns/${campaignId}/`)
- Endpoint: GET /api/campaigns/{id}/
- Backend: views_campaign_user.py - get_campaign_detail_extended()
- Returns: Campaign info, prize, entry count, voting status, user's entry status

STEP 4: View campaign feed
- API: api.request(`/campaigns/${campaignId}/feed/`)
- Endpoint: GET /api/campaigns/{id}/feed/
- Backend: views_campaign_user.py - get_campaign_feed()
- Logic: Filter by campaign → Sort by score/votes → Include user's vote status

STEP 5: View leaderboard
- API: api.request(`/campaigns/${campaignId}/leaderboard/`)
- Endpoint: GET /api/campaigns/{id}/leaderboard/
- Backend: views_campaign_admin.py - admin_generate_leaderboard()
- Logic: Calculate scores → Sort descending → Assign ranks → Return top 100
```

### Enter Campaign Flow
```
User creates post for campaign → Backend links to campaign → Calculate score → Database update

STEP 1: User creates post (EnhancedPostPage.jsx)
- Select campaign → Upload media → Add caption → Submit

STEP 2: Backend links to campaign
- API: POST /api/campaigns/posts/create/
- Backend: views_campaign_user.py - create_campaign_post()
- Actions: Create CampaignEntry → Link reel → Initialize score (0) → Initialize votes (0) → Update count

STEP 3: Calculate initial score
- Backend: views_campaign_user.py - update_engagement_scores()
- Logic: Calculate engagement (likes*weight + comments*weight + shares*weight + views*weight) → Store in PostScore → Update CampaignEntry

STEP 4: Database changes
- api_campaignentry (new row)
- api_postscore (new row)
- api_campaign (update entry_count)
```

### Voting Flow (Grand Campaigns)
```
User views voting phase → Votes → Backend processes → Database update → Frontend update

STEP 1: User views voting phase (CampaignFeed.jsx)
- Check: campaign_type === 'grand' AND phase === 'voting'
- Show vote buttons

STEP 2: User votes
- API: api.request(`/campaigns/${campaignId}/vote/`)
- Endpoint: POST /api/campaigns/{id}/vote/
- Body: { entry_id, reel_id }

STEP 3: Backend processes (views_campaign.py - user_campaign_vote())
- Validate: campaign in voting phase → User hasn't voted → campaign_type === 'grand'
- Actions: Create CampaignVote → Increment vote_count → Update total votes → Log

STEP 4: Database changes
- api_campaignvote (new row)
- api_campaignentry (update vote_count)
- api_campaign (update total_votes)

STEP 5: Frontend updates
- Update counter (optimistic) → Disable button → Show "Voted"
```

### Campaign Scoring Flow (Daily/Weekly/Monthly)
```
Backend process → Calculate engagement → Calculate consistency → Calculate final → Generate leaderboard → Select winners

STEP 1: Calculate engagement scores (views_campaign_user.py - update_engagement_scores)
- For each entry: Get metrics → Apply weights → Calculate score → Update PostScore

STEP 2: Calculate consistency scores (views_campaign_user.py - update_consistency_scores)
- For each user: Count posts → Check frequency → Calculate consistency → Update UserCampaignStats

STEP 3: Calculate final scores (views_scoring.py - admin_calculate_scores)
- final_score = (engagement * weight) + (consistency * weight) + (quality * weight)
- Update CampaignEntry.final_score → Sort by score

STEP 4: Generate leaderboard (views_campaign_admin.py - admin_generate_leaderboard())
- Sort by final_score → Assign ranks → Handle ties → Return leaderboard

STEP 5: Select winners (views_campaign_admin.py - admin_select_winners())
- Daily: Top X + random selection (split %) + one-win-per-cycle limit
- Weekly/Monthly: Top X (pure scoring) + one-win-per-cycle limit
- Grand: Top X (votes + judge scores) + no limit
- Create CampaignWinner records

STEP 6: Announce winners (views_campaign.py - admin_announce_winners())
- Update winners_announced = True → Send notifications → Log
```

---

## 5. Messaging Flow

### View Conversations Flow
```
User navigates to messages → Fetch conversations → Display list

STEP 1: User navigates to messages (MessagesPage.jsx)
- setActiveTab('messages')

STEP 2: Fetch conversations
- API: api.request('/messages/conversations/')
- Endpoint: GET /api/messages/conversations/
- Backend: views_messaging.py - list_or_create_conversations()
- Logic: Annotate last message details → Annotate unread count (correlated subquery) → Order by last_message_at

STEP 3: Display conversations
- For each: Participant info, last message preview, timestamp, unread count, online status
```

### Create Conversation Flow
```
User searches → Selects user → Backend creates/conversation → Navigate to chat

STEP 1: User searches for user
- Click "New Message" → Type username

STEP 2: Search users
- API: api.request('/messages/users/search/?q={query}')
- Endpoint: GET /api/messages/users/search/
- Logic: Search username/email → Exclude current → Exclude blocked → Top 10

STEP 3: User selects user
- API: POST /api/messages/conversations/
- Body: { user_id }
- Backend: Check if exists → Return existing OR Create new with both participants

STEP 4: Navigate to conversation
- Set active conversation → Load messages → Show chat
```

### Send Message Flow
```
User types message → Prepare data → Send to backend → Cloudinary → Database → Response

STEP 1: User types message (MessagesPage.jsx)
- Input: Text or media (image/video/audio)
- Click "Send"

STEP 2: Prepare data
- If text: body = { text }
- If media: Upload to Cloudinary first → body = { media, media_type }

STEP 3: Send to backend
- API: POST /api/messages/conversations/{id}/messages/
- Body: FormData or JSON

STEP 4: Backend processes (views_messaging.py - conversation_messages POST)
- Validate user is participant
- If media: Upload to Cloudinary (folder: messages) → Get URL
- Create Message (conversation, sender, text, media, media_type)
- Update conversation (last_message_at)
- Create notification for recipient

STEP 5: Database changes
- api_message (new row)
- api_conversation (update)
- api_notification (new row)

STEP 6: Frontend updates
- Add to state (optimistic) → Scroll to bottom → Update preview
```

### Edit/Delete Message Flow
```
User opens menu → Edit or Delete → Backend processes → Update

STEP 1: User opens message menu (MessagesPage.jsx)
- Long-press → Show menu (Edit, Delete)

STEP 2: Edit message
- Click "Edit" → Modify text → Click "Save"
- API: PATCH /api/messages/{id}/
- Body: { text }
- Validation: User is sender + within 15 minutes + not deleted
- Update: message.text → Add edited_at

STEP 3: Delete message
- Click "Delete" → Confirm
- API: DELETE /api/messages/{id}/
- Validation: User is sender
- Soft delete: message.is_deleted = True (show placeholder)

STEP 4: Frontend updates
- Edit: Update text in UI
- Delete: Show "Message deleted" placeholder
```

### Mark Conversation Read Flow
```
User opens conversation → Send read receipt → Update database → Clear badge

STEP 1: User opens conversation (MessagesPage.jsx)
- Load messages → Mark as read automatically

STEP 2: Send read receipt
- API: POST /api/messages/conversations/{id}/read/
- Backend: views_messaging.py - mark_conversation_read()
- Actions: Create/update MessageRead (last_read_at=now) → Clear unread count

STEP 3: Database changes
- api_messageread (update or create)
- api_conversation (update unread count)

STEP 4: Frontend updates
- Remove unread badge → Update conversation list
```

---

## 6. Profile Management Flow

### View Profile Flow
```
User navigates to profile → Check cache → Fetch data → Display

STEP 1: User navigates to profile (ProfilePage.jsx)
- setShowProfile(true) → Target: userId or null (own)

STEP 2: Check cache (30 min TTL)
- Cache key: `profile_cache_${userId}`
- If hit: Load → Display immediately
- If miss: Show loading

STEP 3: Fetch profile data
- API: api.request(`/profile/${userId}/`)
- Endpoint: GET /api/profile/{id}/
- Returns: User info, profile info, stats, XP, is_following

STEP 4: Fetch user's posts
- API: api.getUserPosts(userId)
- Endpoint: GET /api/reels/?user={userId}

STEP 5: Fetch follow status
- API: api.request(`/follows/?following=${userId}`)
- Endpoint: GET /api/follows/?following={userId}

STEP 6: Write to cache (30 min)
- writeProfileCache(userId, data)
- writeFollowCache(userId, data)

STEP 7: Display profile
- Header: Photo, username, bio, stats, XP bar, action buttons
- Tabs: Posts, Saved, Campaign stats
- Interactions: Follow, view post, edit profile, view followers
```

### Edit Profile Flow
```
User opens edit → Pre-fill → Make changes → Upload photo → Save → Update

STEP 1: User opens edit profile (EditProfilePage.jsx)
- Load current data

STEP 2: Pre-fill form
- First name, last name, username, email, bio, profile_photo

STEP 3: User makes changes
- Update text fields → Upload new photo (optional)

STEP 4: Send update
- API: api.updateUserProfile(data)
- Endpoint: PATCH /api/profile/update_profile/
- Body: FormData (first_name, last_name, username, email, bio, profile_photo)

STEP 5: Backend processes (views.py - UserProfileViewSet.update_profile())
- Update user fields → Update profile fields
- If photo: Upload to Cloudinary (folder: profile_photos)
- Response: Updated profile

STEP 6: Database changes
- auth_user (update)
- api_userprofile (update)
- Cloudinary: New photo (if changed)

STEP 7: Frontend updates
- Update localStorage → setAuthUser → Invalidate cache → Show success → Navigate back
```

### Follow/Unfollow Flow
```
User clicks follow → Toggle → Backend processes → Update counts → Frontend update

STEP 1: User clicks follow button (ProfilePage.jsx)
- Current: isFollowing = false → Action: Follow

STEP 2: Send follow request
- API: api.toggleFollow(userId)
- Endpoint: POST /api/follows/toggle/
- Body: { following_id }

STEP 3: Backend processes (views.py - FollowViewSet)
- Check if already following
- If exists: Delete (unfollow)
- If not: Create Follow → Update counts → Create notification

STEP 4: Database changes
- api_follow (new row or delete)
- api_userprofile (update followers/following counts for both)
- api_notification (new row - target notified)

STEP 5: Frontend updates
- setIsFollowing → Update counts → Update button → Invalidate cache → Show toast
```

### View Followers/Following Flow
```
User clicks count → Fetch list → Display → Interactions

STEP 1: User clicks followers count (ProfilePage.jsx)
- Type: 'followers' or 'following'
- setShowFollowersList(true)

STEP 2: Fetch list
- API: api.getFollowers(userId) or api.getFollowing(userId)
- Endpoint: GET /api/follows/?following={userId} or ?follower={userId}

STEP 3: Display list (FollowersListPage.jsx)
- For each: Avatar, username, follow button, "Following" indicator
- Pagination: Load more on scroll

STEP 4: Interactions
- Follow from list → View profile → Close list
```

---

## 7. Admin Panel Flows

### Admin Login Flow
```
User navigates to /admin → Login form → Verify admin status → Show dashboard

STEP 1: User navigates to admin (AdminApp.jsx)
- URL: /admin or #/admin
- Check: window.location.pathname === '/admin'

STEP 2: Admin fills login form (AdminLogin.jsx)
- Same as regular login

STEP 3: Verify admin status
- Check: user.is_staff === true
- If not: Show error → Redirect to regular app
- If yes: setAdminToken → Navigate to AdminDashboard

STEP 4: Show admin dashboard
```

### Admin Dashboard Flow
```
Admin opens dashboard → Fetch stats → Display cards/charts → Quick actions

STEP 1: Admin opens dashboard (AdminDashboard.jsx)
- Load dashboard stats

STEP 2: Fetch stats
- API: api.request('/admin/dashboard/')
- Endpoint: GET /api/admin/dashboard/
- Returns: Users count, posts count, campaigns count, reports count, revenue, recent activity

STEP 3: Display dashboard
- Stats cards: Users, Posts, Campaigns, Reports, Revenue
- Charts: User growth, Post activity, Campaign participation
- Recent activity: Signups, posts, reports
- Quick actions: Manage users, campaigns, reports, settings
```

### Campaign Management Flow (Admin)
```
Admin opens campaigns → Fetch list → Create/Edit/Delete → Moderate entries → Announce winners

STEP 1: Admin opens campaign management (CampaignManagementPage.jsx)
- Load campaigns list

STEP 2: Fetch campaigns
- API: api.request('/admin/campaigns/')
- Endpoint: GET /api/admin/campaigns/
- Query params: ?status, ?master_campaign, ?page, ?page_size
- Backend: views_campaign.py - admin_campaigns_list()
- Returns: Campaigns with live counts (entries, votes)

STEP 3: Create campaign
- Click "Create" → Fill form (title, description, type, prize, dates, image)
- API: POST /api/admin/campaigns/create/
- Backend: Create Campaign → Upload image to Cloudinary → Log
- Response: Campaign data

STEP 4: Update campaign
- Click "Edit" → Modify fields → Save
- API: PATCH /api/admin/campaigns/{id}/update/
- Backend: Update fields → Response

STEP 5: Delete campaign
- Click "Delete" → Confirm
- API: DELETE /api/admin/campaigns/{id}/delete/
- Backend: Soft delete (status='deleted') → Response

STEP 6: View entries
- Click "View Entries" → API: GET /api/admin/campaigns/{id}/entries/
- Backend: views_campaign.py - admin_campaign_entries()
- Display: Entries table with moderation options

STEP 7: Moderate entries
- Click "Moderate" → Approve/Reject/Adjust score
- API: POST /api/admin/campaigns/posts/{score_id}/moderate/
- Backend: views_campaign_admin.py - admin_moderate_post()
- Actions: Set status → Notify user → Log

STEP 8: Announce winners
- Click "Announce Winners" → Confirm
- API: POST /api/admin/campaigns/{id}/announce-winners/
- Backend: views_campaign.py - admin_announce_winners()
- Actions: Calculate scores → Select winners → Create CampaignWinner → Notify → Log
```

### User Management Flow (Admin)
```
Admin opens users → Fetch list → View details → Update/Delete → Bulk actions

STEP 1: Admin opens user management (UserManagement.jsx)
- Load users list

STEP 2: Fetch users
- API: api.request('/admin/users/')
- Endpoint: GET /api/admin/users/
- Query params: ?search, ?page, ?page_size
- Backend: views_admin.py - admin_users_list()

STEP 3: View user details
- Click user → API: GET /api/admin/users/{id}/
- Backend: views_admin.py - admin_user_detail()
- Returns: User info, profile, stats, account status, activity log

STEP 4: Update user
- Click "Edit" → Modify fields → Save
- API: PATCH /api/admin/users/{id}/update/
- Backend: views_admin.py - admin_user_update()

STEP 5: Delete user
- Click "Delete" → Confirm
- API: DELETE /api/admin/users/{id}/delete/
- Backend: views_admin.py - admin_user_delete()
- Actions: Soft delete (is_active=False) OR hard delete → Log

STEP 6: Bulk actions
- Select users → Choose action (activate/deactivate/make admin/remove admin/delete)
- API: POST /api/admin/users/bulk/
- Backend: views_settings.py - bulk_user_action()
```

### Content Moderation Flow (Admin)
```
Admin opens moderation → Fetch pending → Review → Approve/Reject

STEP 1: Admin opens content moderation (ContentModeration.jsx)
- Load pending content

STEP 2: Fetch pending
- API: GET /api/admin/campaigns/{id}/posts/pending/
- Backend: views_campaign_admin.py - admin_campaign_posts_pending()

STEP 3: Review post
- Click post → Show details (media, caption, user, flags)

STEP 4: Approve
- Click "Approve" → API: POST /api/admin/campaigns/posts/{score_id}/moderate/
- Body: { action: 'approve' }
- Backend: Set status='approved' → Include in feed → Notify user → Log

STEP 5: Reject
- Click "Reject" → Enter reason → Confirm
- API: POST /api/admin/campaigns/posts/{score_id}/moderate/
- Body: { action: 'reject', reason }
- Backend: Set status='rejected' → Exclude from feed → Notify user with reason → Log
```

---

## 8. Data Storage & External Services

### Database Schema
```
Core Tables:
- auth_user: User accounts
- api_userprofile: User profiles (bio, photo, XP, stats)
- api_reel: Posts/reels (media, caption, hashtags)
- api_comment: Comments on posts
- api_vote: Likes on posts
- api_savedpost: Saved posts
- api_follow: Follow relationships
- api_notification: User notifications
- api_campaign: Campaigns (daily, weekly, monthly, grand)
- api_campaignentry: Campaign entries
- api_campaignvote: Campaign votes
- api_campaignwinner: Campaign winners
- api_conversation: DM conversations
- api_message: DM messages
- api_messageread: Read receipts
```

### Cloudinary Integration
```
Media Storage:
- Reels: folder='reels'
- Profile photos: folder='profile_photos'
- Messages: folder='messages'
- Campaign images: folder='campaigns'

Upload Process:
1. Frontend: Select file → Send to backend
2. Backend: Upload to Cloudinary → Get secure_url
3. Database: Store URL in media field
4. Frontend: Display via https:// URL

Fallback:
- If Cloudinary fails → Save to local filesystem
- Path: /media/{folder}/{filename}
- URL: https://postworq.onrender.com/media/{path}
```

### Neon PostgreSQL
```
Production Database:
- Host: ep-rough-math-anwwqd2n-pooler.c-6.us-east-1.aws.neon.tech
- SSL: Required
- Connection pooling: Disabled (CONN_MAX_AGE=0)
- Fallback: SQLite if connection fails

Environment:
- Render: Automatically detected (RENDER env var)
- Local: SQLite (db.sqlite3)
```

---

## 9. Security & Performance

### Security
```
Authentication:
- Token-based (Django REST Framework Token)
- Token stored in localStorage
- Sent in Authorization header: "Token {token}"
- Public endpoints: /auth/, /settings/public/, /health/

CORS:
- Allowed origins: Vercel, Render, localhost
- CORS_ALLOW_ALL_ORIGINS: True (fallback)
- Custom middleware for Vercel

Rate Limiting:
- Not yet implemented (Redis recommended)
- Can be added with Django Ratelimit

Input Validation:
- Django serializers validate all inputs
- File size limits: 50MB max
- Allowed file types: .mp4, .webm, .mov, .jpg, .png

Logging:
- SystemLog table for security events
- Login attempts (success/failure)
- IP address tracking
- Admin actions logged
```

### Performance
```
Caching:
- Frontend: localStorage cache (10-30 min TTL)
- API: In-memory cache (60s TTL) with deduplication
- Cache invalidation: After mutations

Optimizations:
- Lazy loading: React components
- Code splitting: Vite
- Image optimization: Cloudinary
- Video streaming: Range requests
- Database: Annotations to avoid N+1 queries
- Pagination: All list endpoints

Keep-alive:
- Health check ping every 10 minutes (when tab focused)
- Prevents Render free-tier sleep during session
```

---

## 10. Deployment Architecture

### Frontend (Vercel)
```
Build: Vite
- Command: vite build
- Output: dist/
- Environment variables: API_BASE_URL

Deploy:
- Platform: Vercel
- URL: https://postworqq.vercel.app
- Automatic deploys on git push
```

### Backend (Render)
```
Build: Django
- Command: gunicorn config.wsgi:application
- Static files: WhiteNoise
- Database: Neon PostgreSQL
- Media: Cloudinary

Deploy:
- Platform: Render
- URL: https://postworq.onrender.com
- Automatic deploys on git push
- Health check: /health/
- Startup script: migrate_and_start.sh
```

### Environment Variables
```
Backend (Render):
- SECRET_KEY: Django secret key
- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT: Neon DB
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: Cloudinary
- ALLOWED_HOSTS: postworq.onrender.com, .onrender.com, localhost

Frontend (Vercel):
- API_BASE_URL: https://postworq.onrender.com/api
```

---

## 11. Mobile App Architecture (React Native)

### Mobile App Overview

**Technology Stack:**
- Framework: React Native with Expo
- Navigation: React Navigation (Stack + Tab)
- State: React Context (AuthContext)
- Storage: Expo SecureStore (token), AsyncStorage (drafts)
- Media: expo-image-picker, expo-av (video)
- API: Same Django backend as web app

**Key Differences from Web App:**
- Token storage: SecureStore (encrypted) vs localStorage
- File handling: expo-image-picker vs HTML file input
- Video playback: expo-av vs HTML5 video
- Navigation: React Navigation vs browser routing
- Permissions: Camera/Photo library permissions required

---

### Mobile App Navigation Structure

```
AppNavigator (Root)
├─ AuthStack (when not authenticated)
│  ├─ LoginScreen
│  └─ RegisterScreen
└─ MainStack (when authenticated)
   ├─ MainTabs (Bottom tab bar)
   │  ├─ HomeScreen (Feed)
   │  ├─ ReelsScreen (TikTok-style feed)
   │  ├─ CreateScreen (Create post - center button)
   │  ├─ NotificationsScreen
   │  └─ ProfileScreen
   └─ Push Screens (Stack navigation)
      ├─ VideoDetailScreen
      ├─ ProfileDetailScreen
      ├─ EditProfileScreen
      ├─ CommentsScreen
      ├─ CampaignsScreen
      ├─ CampaignDetailScreen
      └─ SettingsScreen
```

---

### Mobile Authentication Flows

### Mobile Login Flow
```
User opens app → Check SecureStore → Show login → User fills form → API call → Store token → Navigate to MainTabs

STEP 1: App launches
- Component: AppNavigator.js
- Check: AuthContext loads user from SecureStore
- If token exists: Fetch profile → Show MainStack
- If no token: Show AuthStack (LoginScreen)

STEP 2: User fills login form (LoginScreen.js)
- Fields: username, password
- Component: TextInput with secureTextEntry for password

STEP 3: User clicks login
- Call: useAuth().login(username, password)
- Context: AuthContext.js
- API: api.login(username, password)
- Endpoint: POST /api/auth/login/

STEP 4: Backend processes (same as web)
- views.py - login()
- Returns: { user: {...}, token: "xxxxx" }

STEP 5: Mobile handles response
- Store token: api.setAuthToken(token) → SecureStore.setItemAsync('authToken', token)
- Update context: setUser(data.user)
- Navigate: RootNavigator shows MainStack
- Bottom tab bar: Home, Reels, Create (+), Notifications, Profile

STEP 6: Security
- Token stored in SecureStore (encrypted keychain)
- Not accessible to other apps
- Cleared on logout
```

### Mobile Registration Flow
```
User navigates to register → Fill form → API call → Store token → Navigate to MainTabs

STEP 1: User clicks "Register" link (LoginScreen.js)
- navigation.navigate('Register')

STEP 2: User fills registration form (RegisterScreen.js)
- Fields: username, email, password, first_name, last_name
- Validation: Required fields

STEP 3: User submits
- Call: useAuth().register(username, email, password, firstName, lastName)
- API: api.register(...)
- Endpoint: POST /api/auth/register/

STEP 4: Backend processes (same as web)
- views.py - register()
- Returns: { user: {...}, token: "xxxxx" }

STEP 5: Mobile handles response
- Store token: SecureStore.setItemAsync('authToken', token)
- Update context: setUser(data.user)
- Navigate: MainStack
```

### Mobile Logout Flow
```
User clicks logout → Clear SecureStore → Clear context → Navigate to AuthStack

STEP 1: User navigates to Settings (SettingsScreen.js)
- Click "Logout" button

STEP 2: Call logout
- useAuth().logout()
- Context: AuthContext.js
- API: api.clearAuth()
- Actions:
   ├─ SecureStore.deleteItemAsync('authToken')
   ├─ _cache.clear()
   └─ setUser(null)

STEP 3: Navigate to login
- RootNavigator detects user === null
- Shows AuthStack (LoginScreen)
```

---

### Mobile Content Viewing Flows

### Mobile Home Feed Flow
```
User opens app → HomeScreen loads → Fetch feed → Display FlatList → Scroll to load more

STEP 1: User opens app / navigates to Home
- Component: HomeScreen.js
- Tab: "For You" (default)
- Other tabs: Discover, Campaigns, Categories

STEP 2: Fetch feed
- useEffect: api.getReels()
- API: api.request('/reels/')
- Endpoint: GET /api/reels/
- Cache: 60s TTL (same as web)
- Loading: Show ActivityIndicator

STEP 3: Display feed
- Component: FlatList with renderItem
- Each item: PostCard component
- Shows: Video/image, user info, caption, engagement buttons
- Pull-to-refresh: onRefresh → refetch feed

STEP 4: Scroll to load more (pagination)
- FlatList onEndReached
- Fetch next page with offset
- Append to posts state

STEP 5: User interactions
- Like: api.voteReel(reelId) → Update local state
- Comment: navigation.navigate('Comments', { reelId })
- Share: Share.share({ url })
- Save: api.toggleSavePost(reelId)
- Profile: navigation.navigate('ProfileDetail', { userId })
- Gift: Open gift modal → api.sendGift()
```

### Mobile Reels Flow (TikTok-style)
```
User navigates to Reels → Vertical scroll → Auto-play video → Swipe to next

STEP 1: User navigates to Reels tab
- Component: ReelsScreen.js
- Tab: "Reels" in bottom nav

STEP 2: Fetch reels
- API: api.getReelsTrending()
- Endpoint: GET /api/reels/trending/
- Or: api.getReelsFollowing()

STEP 3: Display vertical feed
- Component: FlatList with pagingEnabled
- Snap to item: One reel per screen
- Auto-play: Video component with autoplay

STEP 4: Video playback
- Component: expo-av Video
- ResizeMode: Cover
- Auto-play when visible
- Pause when not visible

STEP 5: User interactions
- Like: Double-tap or heart button
- Comment: Comment button → CommentsScreen
- Share: Share button
- Save: Bookmark button
- Profile: Tap username
```

### Mobile Video Detail Flow
```
User taps video → Navigate to VideoDetailScreen → Load details → Display full video

STEP 1: User taps on video in feed
- navigation.navigate('VideoDetail', { reelId })

STEP 2: Load video details
- API: api.request(`/reels/${reelId}/`)
- Endpoint: GET /api/reels/{id}/
- Load video, user info, comments

STEP 3: Display video
- Component: VideoDetailScreen.js
- Full-screen video player
- User info header
- Engagement buttons (like, comment, share, save)
- Caption and hashtags
- Comments section (flat list)

STEP 4: Load comments
- API: api.getComments(reelId)
- Endpoint: GET /api/reels/{id}/comments/
- Display: FlatList of comments

STEP 5: User interactions
- Like: api.voteReel()
- Comment: api.postComment()
- Reply: Navigate to CommentsScreen with parent comment
- Save: api.toggleSavePost()
- Share: Share.share()
```

---

### Mobile Content Upload Flows

### Mobile Create Post Flow
```
User taps + button → Select source → Pick media → Edit → Add details → Upload → Navigate to video

STEP 1: User taps Create button (center + in bottom nav)
- Component: CreateScreen.js
- Stage: 'pick'
- Options: Library, Camera

STEP 2: Select media source
- Library: pickFromLibrary()
  ├─ Request media library permissions
  ├─ expo-image-picker.launchImageLibraryAsync()
  ├─ mediaTypes: All (images + videos)
  ├─ allowsEditing: true
  ├─ aspect: [9, 16] (vertical)
  ├─ quality: 0.85
  └─ videoMaxDuration: 60 seconds
- Camera: pickFromCamera()
  ├─ Request camera permissions
  ├─ expo-image-picker.launchCameraAsync()
  ├─ Same options as library
  └─ Capture photo or record video

STEP 3: Media selected
- Set media state: { uri, type: 'image'|'video' }
- Stage: 'edit'

STEP 4: Edit media
- Apply filters: FILTERS array (warm, cool, sepia, bw, vibrant, golden)
- Add text overlays: Text input + color selection
- Preview with filter overlay
- Stage: 'details'

STEP 5: Add details
- Caption input (TextInput)
- Hashtags input
- Select campaign (optional)
- Stage: 'uploading'

STEP 6: Upload to backend
- Create FormData
- Append file: { uri, type, name }
- API: api.createPost(formData, { onProgress })
- XMLHttpRequest for progress tracking
- Endpoint: POST /api/posts/create/
- Timeout: 5 minutes

STEP 7: Backend processes (same as web)
- views.py - create_post()
- Upload to Cloudinary
- Create Reel record
- Attach media via raw SQL
- Award XP (+25)

STEP 8: Frontend handles response
- Update progress: onProgress(pct)
- On success: Invalidate cache → Navigate to VideoDetailScreen
- On error: Alert.alert('Error', error.message)

STEP 9: Save drafts (optional)
- Save to SecureStore: 'cp_drafts'
- Can restore later
```

---

### Mobile Campaign Flows

### Mobile View Campaigns Flow
```
User navigates to Campaigns → Fetch list → Tap campaign → View details → Enter/vote

STEP 1: User navigates to Campaigns
- Component: CampaignsScreen.js
- API: api.getCampaigns()
- Endpoint: GET /api/campaigns/
- Display: FlatList of campaign cards

STEP 2: View campaign details
- Tap on campaign
- navigation.navigate('CampaignDetail', { campaignId })
- API: api.getCampaignDetail(campaignId)
- Endpoint: GET /api/campaigns/{id}/
- Display: Campaign info, prize, dates, entry count

STEP 3: View campaign feed
- Tap "View Entries"
- API: api.request(`/campaigns/${campaignId}/feed/`)
- Display: Feed of campaign entries

STEP 4: Enter campaign
- Create post with campaign selected
- Same flow as Create Post Flow
- Backend links to campaign automatically

STEP 5: Vote (grand campaigns only)
- Check campaign_type === 'grand' AND phase === 'voting'
- Tap vote button
- API: api.request(`/campaigns/${campaignId}/vote/`)
- Body: { entry_id, reel_id }
- Update vote count (optimistic)
```

---

### Mobile Profile Flows

### Mobile View Profile Flow
```
User taps profile → Load profile data → Display posts → Interact

STEP 1: User navigates to Profile tab
- Component: ProfileScreen.js
- Tab: "Profile" in bottom nav
- Shows own profile by default

STEP 2: Load profile data
- API: api.getProfile()
- Endpoint: GET /api/profile/me/
- Load user info, stats, XP

STEP 3: Load user's posts
- API: api.getUserPosts(userId)
- Endpoint: GET /api/reels/?user={userId}
- Display: Grid of posts (FlatList with numColumns=3)

STEP 4: Display profile
- Profile photo, username, bio
- Stats: followers, following, posts
- XP bar with GamificationBar component
- Tabs: Posts, Saved (if own profile)

STEP 5: View other user's profile
- Tap username on post
- navigation.navigate('ProfileDetail', { userId })
- Load that user's profile
- Show follow/unfollow button

STEP 6: User interactions
- Follow: api.toggleFollow(userId)
- Edit profile: navigation.navigate('EditProfile')
- View followers/following: Tap count → Show modal
- Settings: navigation.navigate('Settings')
```

### Mobile Edit Profile Flow
```
User taps edit profile → Load current data → Make changes → Save → Update

STEP 1: User navigates to Edit Profile
- Component: EditProfileScreen.js
- navigation.navigate('EditProfile')

STEP 2: Load current data
- Pre-fill: username, email, first_name, last_name, bio
- Load current profile photo

STEP 3: User makes changes
- Update text fields
- Upload new photo: expo-image-picker
- Preview photo

STEP 4: Save changes
- API: api.updateUserProfile(data)
- Endpoint: PATCH /api/profile/update_profile/
- FormData with fields
- If photo: { uri, type, name }

STEP 5: Backend processes (same as web)
- views.py - UserProfileViewSet.update_profile()
- Update user fields
- Update profile fields
- Upload photo to Cloudinary

STEP 6: Frontend updates
- Update context: useAuth().updateUser(userData)
- Navigate back to Profile
- Show success Alert
```

---

### Mobile Notifications Flow

```
User taps Notifications tab → Fetch notifications → Display list → Tap to action

STEP 1: User navigates to Notifications
- Component: NotificationsScreen.js
- Tab: "Notifications" (Alerts) in bottom nav

STEP 2: Fetch notifications
- API: api.getUserNotifications()
- Endpoint: GET /api/notifications/
- Display: FlatList of notifications

STEP 3: Display notifications
- Each item: Type, message, timestamp, action
- Types: new_follower, new_like, new_comment, campaign_winner, etc.

STEP 4: Tap notification
- Mark as read: api.markNotificationRead(notificationId)
- Navigate to relevant screen:
   - new_follower: ProfileDetail
   - new_like/new_comment: VideoDetail
   - campaign_winner: CampaignDetail

STEP 5: Pull-to-refresh
- Refresh notification list
- Update unread badge
```

---

### Mobile Settings Flow

```
User navigates to Settings → Display options → Tap to change → Save

STEP 1: User navigates to Settings
- Component: SettingsScreen.js
- navigation.navigate('Settings')

STEP 2: Display settings
- Account: Edit profile, Change password, Delete account
- Privacy: Private account, Show activity, Allow messages
- Notifications: Push notification preferences
- About: App version, Terms, Privacy policy

STEP 3: Change setting
- Tap option → Show modal/input
- Update value
- Save to backend

STEP 4: Save to backend
- API: api.updatePrivacySettings(settings)
- API: api.updateNotificationSettings(settings)
- API: api.changePassword(data)

STEP 5: Delete account
- Tap "Delete account"
- Show confirmation Alert
- API: api.deleteAccount()
- Endpoint: DELETE /api/profile/delete/
- Clear auth → Navigate to login
```

---

### Mobile Gamification Flow

```
User views XP bar → Tap to spin → Daily spin → Claim bonus → Send gift

STEP 1: User views XP bar
- Component: GamificationBar.js (shown on Profile and Home)
- Displays: Level, XP progress, next level

STEP 2: Daily spin
- Tap spin button
- API: api.performSpin()
- Endpoint: POST /api/gamification/perform-spin/
- Returns: Coins won, XP gained
- Show animation/result

STEP 3: Claim login bonus
- API: api.claimLoginBonus()
- Endpoint: POST /api/gamification/login-bonus/
- Returns: Coins, XP
- Show success message

STEP 4: Send gift
- Tap gift button on post
- Open gift modal
- Select amount or custom amount
- Add message
- API: api.sendGift(username, amount, message)
- Endpoint: POST /api/gamification/gift/
- Show success Alert
```

---

### Mobile-Specific Features

### Permissions Handling
```
Camera Permission:
- Request: ImagePicker.requestCameraPermissionsAsync()
- If denied: Alert.alert('Permission Required')
- Navigate to app settings if needed

Photo Library Permission:
- Request: ImagePicker.requestMediaLibraryPermissionsAsync()
- If denied: Alert.alert('Permission Required')
- Navigate to app settings if needed
```

### File Handling
```
File Selection:
- expo-image-picker.launchImageLibraryAsync()
- Returns: { canceled, assets: [{ uri, type, width, height }] }
- File type: 'image' or 'video'
- URI format: file:// on iOS, content:// on Android

File Upload:
- FormData.append('file', { uri, type, name })
- URI handling:
  - iOS: uri.replace('file://', '')
  - Android: uri as-is
- Backend processes same as web
```

### Video Playback
```
Video Component:
- expo-av Video component
- ResizeMode: Cover (fill screen)
- Auto-play: shouldPlay prop
- Controls: Custom or built-in
- Progress: onPlaybackStatusUpdate

Streaming:
- Same backend streaming as web
- Range requests for large videos
- Buffering indicator
```

### Push Notifications (Future)
```
Not yet implemented
- Can use expo-notifications
- Backend: Django push notification service
- Types: New follower, likes, comments, campaign updates
- Permission: Request notification permission
```

### Deep Linking (Future)
```
Not yet implemented
- Linking.openURL() for external links
- Share links: postworq://post/{id}
- Campaign links: postworq://campaign/{id}
- Profile links: postworq://profile/{username}
```

---

## Summary

This documentation covers all major use case lifecycles in the FlipStar app:

### Web App (React + Vercel)
1. **Authentication**: Register, login, logout flows with security logging
2. **Content Viewing**: Home feed, single post, explorer/trending with caching
3. **Content Upload**: Create, edit, delete posts with Cloudinary integration
4. **Campaigns**: View, enter, vote, scoring, winner selection
5. **Messaging**: Conversations, send/receive, edit/delete, read receipts
6. **Profile**: View, edit, follow/unfollow, followers/following
7. **Admin**: Dashboard, campaign management, user management, moderation

### Mobile App (React Native + Expo)
8. **Mobile Authentication**: Login, register, logout with SecureStore
9. **Mobile Content Viewing**: Home feed, reels feed, video detail with FlatList
10. **Mobile Content Upload**: Create post with expo-image-picker, camera, filters
11. **Mobile Campaigns**: View campaigns, enter, vote (same backend as web)
12. **Mobile Profile**: View profile, edit profile, follow/unfollow
13. **Mobile Notifications**: View list, tap to action, mark as read
14. **Mobile Settings**: Account, privacy, notifications, delete account
15. **Mobile Gamification**: XP bar, daily spin, login bonus, send gifts
16. **Mobile-Specific**: Permissions, file handling, video playback

### Shared Infrastructure
17. **Database Schema**: Same for both web and mobile
18. **Cloudinary**: Same media storage for both
19. **Neon PostgreSQL**: Same database for both
20. **API Endpoints**: Same Django backend for both
21. **Security**: Token-based auth (localStorage vs SecureStore)

Each flow includes:
- User actions
- Frontend components (web or mobile)
- API calls (same for both)
- Backend processing (same for both)
- Database changes (same for both)
- Frontend updates (web or mobile)
- Error handling (web or mobile)
