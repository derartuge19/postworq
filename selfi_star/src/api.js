import config from './config.js';

const API_BASE_URL = config.API_BASE_URL;

let authToken =
  localStorage.getItem('authToken') || localStorage.getItem('adminToken');

// Clear potentially stale tokens on startup
const storedToken = localStorage.getItem('authToken');
if (storedToken) {
  console.log('🔍 Found stored token, will validate on first authenticated request');
}

// --- Lightweight GET cache & request deduplication ---
const _cache = new Map();
const _inflight = new Map();
const CACHE_TTL = 30_000; // 30s default TTL

function getCached(key) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < entry.ttl) return entry.data;
  _cache.delete(key);
  return null;
}
function setCache(key, data, ttl = CACHE_TTL) {
  _cache.set(key, { data, ts: Date.now(), ttl });
}
function invalidateCache(pattern) {
  for (const key of _cache.keys()) {
    if (key.includes(pattern)) _cache.delete(key);
  }
}

const api = {
  setAuthToken: (token) => {
    authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    _cache.clear(); // Clear cache on auth change
  },

  setAdminToken: (token) => {
    authToken = token;
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
    _cache.clear();
  },

  getToken: () => {
    return authToken || localStorage.getItem('authToken');
  },

  hasToken: () => {
    return !!(authToken || localStorage.getItem('authToken'));
  },

  clearAuth: () => {
    console.log('🧹 Clearing all auth data');
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    _cache.clear();
  },

  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
    _cache.clear();
  },

  async request(endpoint, options = {}) {
    // Cache logic
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const cacheKey = isGet ? endpoint : null;
    
    // Return cached data for GET requests
    if (isGet && cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    const headers = {
      ...options.headers,
    };

    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Only add token if it exists AND it's not an auth endpoint
    const currentToken = authToken || localStorage.getItem('authToken');
    if (currentToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Token ${currentToken}`;
      console.log(`🔐 Using token for request: ${currentToken.substring(0, 10)}...`);
    } else {
      console.log('⚠️ No token available for request');
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`, { headers, isFormData: options.isFormData });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Failed to parse response' };
    }

    if (!response.ok) {
      // If 401 error on a GET request with token, retry without auth (for public endpoints like /reels/)
      // DON'T clear token for POST/PUT/DELETE requests - those require auth
      if (response.status === 401 && headers['Authorization'] && isGet) {
        console.warn('⚠️ 401 on GET with token — retrying without auth (public endpoint)');
        // Retry the same request without the Authorization header
        const retryHeaders = { ...headers };
        delete retryHeaders['Authorization'];
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
        });
        let retryData;
        try { retryData = await retryResponse.json(); } catch (e) { retryData = {}; }
        if (retryResponse.ok) {
          if (isGet && cacheKey) setCache(cacheKey, retryData);
          return retryData;
        }
        // If still failing after retry, NOW clear the token as it's likely invalid
        console.warn('⚠️ Retry also failed — clearing credentials');
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        console.error('API Error after retry:', retryResponse.status, retryData);
        throw new Error(JSON.stringify(retryData) || `API Error: ${retryResponse.status}`);
      }
      // For non-GET 401 errors, don't auto-clear - let the user know they need to login
      if (response.status === 401) {
        console.error('🔒 401 Unauthorized - authentication required');
      }
      console.error('API Error:', response.status, data);
      throw new Error(JSON.stringify(data) || `API Error: ${response.status}`);
    }

    // Cache successful GET responses
    if (isGet && cacheKey) setCache(cacheKey, data);
    return data;
  },

  // Invalidate cache for specific patterns (call after mutations)
  invalidateCache,

  // Generic HTTP methods for admin panel
  get: (endpoint) =>
    api.request(endpoint, { method: 'GET' }).then((data) => ({ data })),
  post: (endpoint, body) =>
    api
      .request(endpoint, { method: 'POST', body: JSON.stringify(body) })
      .then((data) => ({ data })),
  patch: (endpoint, body) =>
    api
      .request(endpoint, { method: 'PATCH', body: JSON.stringify(body) })
      .then((data) => ({ data })),
  delete: (endpoint) =>
    api.request(endpoint, { method: 'DELETE' }).then((data) => ({ data })),

  // Auth
  register: (username, email, password, firstName = '', lastName = '') =>
    api.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    }),

  login: (username, password) =>
    api.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Profile
  getProfile: () => api.request('/profile/me/'),

  updateProfile: (data) =>
    api.request('/profile/1/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  addXP: (xp) =>
    api.request('/profile/add_xp/', {
      method: 'POST',
      body: JSON.stringify({ xp }),
    }),

  dailyCheckIn: () =>
    api.request('/profile/daily_checkin/', {
      method: 'POST',
    }),

  // Reels
  getReels: () => api.request('/reels/'),

  createReel: (formData) =>
    fetch(`${API_BASE_URL}/reels/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${authToken}`,
      },
      body: formData,
    }).then((r) => r.json()),

  createPost: (formData) => {
    const currentToken = authToken || localStorage.getItem('authToken');
    if (!currentToken) {
      return Promise.reject({ error: 'Not authenticated' });
    }

    return fetch(`${API_BASE_URL}/posts/create/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${currentToken}`,
      },
      body: formData,
    }).then((r) => {
      if (!r.ok) {
        return r.json().then((err) => Promise.reject(err));
      }
      invalidateCache('/reels');
      return r.json();
    });
  },

  // Competitions
  getCompetitions: () => api.request('/competitions/'),

  getActiveCompetitions: () => api.request('/competitions/?is_active=true'),

  // Winners
  getWinners: () => api.request('/winners/'),

  getLatestWinners: () => api.request('/winners/latest/'),

  // Subscription upgrade
  upgradeToProPlan: () =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }),

  upgradeToPremiumPlan: () =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan: 'premium' }),
    }),

  voteReel: (reelId) =>
    api.request(`/reels/${reelId}/vote/`, {
      method: 'POST',
    }).then(r => { invalidateCache('/reels'); return r; }),

  postComment: (reelId, text) =>
    api.request(`/reels/${reelId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }).then(r => { invalidateCache(`/reels/${reelId}/comments`); return r; }),

  getComments: (reelId) => api.request(`/reels/${reelId}/comments/`),

  followUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }).then(r => { invalidateCache('/follows'); return r; }),

  unfollowUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }).then(r => { invalidateCache('/follows'); return r; }),

  deletePost: (reelId) =>
    api.request(`/reels/${reelId}/`, {
      method: 'DELETE',
    }).then(r => { invalidateCache('/reels'); return r; }),

  updatePost: (reelId, data) =>
    api.request(`/reels/${reelId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(r => { invalidateCache('/reels'); return r; }),

  updateNotificationSettings: (settings) =>
    api.request('/notifications/me/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  updatePrivacySettings: (settings) =>
    api.request('/profile/update_privacy/', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  getUserNotifications: () =>
    api.request('/notifications/', { method: 'GET' }),

  getUnreadNotificationCount: () =>
    api.request('/notifications/unread-count/', { method: 'GET' }),

  markNotificationRead: (notificationId) =>
    api.request(`/notifications/${notificationId}/read/`, { method: 'POST' }),

  markAllNotificationsRead: () =>
    api.request('/notifications/read/', { method: 'POST', body: JSON.stringify({}) }),

  // Reports
  createReport: (reportData) =>
    api.request('/reports/create/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  getAdminReports: (status = null, type = null) => {
    let url = '/admin/reports/';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (params.toString()) url += '?' + params.toString();
    return api.request(url, { method: 'GET' });
  },

  getAdminReportDetail: (reportId) =>
    api.request(`/admin/reports/${reportId}/`, {
      method: 'GET',
    }),

  updateAdminReport: (reportId, data) =>
    api.request(`/admin/reports/${reportId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAdminReportsStats: () =>
    api.request('/admin/reports/stats/', {
      method: 'GET',
    }),

  // Quests
  getQuests: () => api.request('/quests/'),

  completeQuest: (questId) =>
    api.request(`/quests/${questId}/complete/`, {
      method: 'POST',
    }),

  // Subscription
  getSubscription: () => api.request('/subscription/'),

  upgradeSubscription: (plan) =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  // Notifications
  getNotificationPrefs: () => api.request('/notifications/me/'),

  updateNotificationPrefs: (prefs) =>
    api.request('/notifications/me/', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),

  // Search by hashtag
  searchByHashtag: (hashtag) =>
    api.request(`/reels/?hashtags__icontains=${encodeURIComponent(hashtag)}`),

  // Trending hashtags
  getTrendingHashtags: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.request(`/explorer/trending-hashtags/${qs ? '?' + qs : ''}`);
  },

  // Follow/Unfollow
  toggleFollow: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  getFollowers: (userId) => api.request(`/follows/?following=${userId}`, { noCache: true }),

  getFollowing: (userId) => api.request(`/follows/?follower=${userId}`, { noCache: true }),

  getUserSuggestions: () => api.request('/follows/suggestions/'),

  // Search
  search: (query) => api.request(`/search/?q=${encodeURIComponent(query)}`),

  // Get user by ID or username
  getUser: (userId) => api.request(`/profile/${userId}/`),

  // Comments with likes and replies
  getComments: (reelId) => api.request(`/reels/${reelId}/comments/`),

  likeComment: (commentId) =>
    api.request(`/comments/${commentId}/like/`, {
      method: 'POST',
    }),

  replyToComment: (commentId, text) =>
    api.request(`/comments/${commentId}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Saved posts
  getSavedPosts: () => api.request('/saved/'),

  toggleSavePost: (reelId) =>
    api.request('/saved/toggle/', {
      method: 'POST',
      body: JSON.stringify({ reel_id: reelId }),
    }),

  // Profile photo upload
  uploadProfilePhoto: (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return fetch(`${API_BASE_URL}/profile-photo/upload/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${authToken}`,
      },
      body: formData,
    }).then((r) => r.json());
  },

  // Update profile with bio and name
  updateUserProfile: (data) => {
    const formData = new FormData();
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.bio) formData.append('bio', data.bio);
    if (data.profile_photo)
      formData.append('profile_photo', data.profile_photo);

    return api.request('/profile/update_profile/', {
      method: 'PATCH',
      body: formData,
      isFormData: true,
    });
  },

  // Get user's posts
  getUserPosts: (userId) => api.request(`/reels/?user=${userId}`),

  // Get saved posts
  getSavedPosts: () => api.request('/reels/?saved=true'),
  getUserSavedPosts: () => api.request('/reels/?saved=true'),
};

export default api;
