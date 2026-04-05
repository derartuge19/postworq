import config from './config.js';

const API_BASE_URL = config.API_BASE_URL;

let authToken = localStorage.getItem('authToken');

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
    _cache.clear();
  },

  // Used by admin panel only - does NOT touch the user's authToken in localStorage
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

  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
    _cache.clear();
  },

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...options.headers };

    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Always get fresh token from localStorage to ensure it's current
    const currentToken = localStorage.getItem('authToken') || authToken;
    if (currentToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Token ${currentToken}`;
    }

    // GET request caching + deduplication
    const isGet = method === 'GET';
    const cacheKey = isGet ? endpoint : null;

    if (isGet && !options.noCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
      // Deduplicate: reuse in-flight promise for same endpoint
      if (_inflight.has(cacheKey)) return _inflight.get(cacheKey);
    }

    const fetchPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Failed to parse response' };
      }

      if (!response.ok) {
        console.error('API Error:', response.status, data);
        const error = new Error(JSON.stringify(data) || `API Error: ${response.status}`);
        error.status = response.status;  // Preserve status code
        error.response = response;
        throw error;
      }

      // Cache successful GET responses
      if (isGet && cacheKey) setCache(cacheKey, data);
      return data;
    })();

    // Track in-flight for dedup
    if (isGet && cacheKey) {
      _inflight.set(cacheKey, fetchPromise);
      fetchPromise.finally(() => _inflight.delete(cacheKey));
    }

    return fetchPromise;
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
    api.request('/notifications/', {
      method: 'GET',
    }),

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
