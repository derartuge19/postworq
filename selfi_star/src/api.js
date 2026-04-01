import config from './config.js';

const API_BASE_URL = config.API_BASE_URL;

let authToken =
  localStorage.getItem('authToken') || localStorage.getItem('adminToken');
console.log(
  '🔑 Initial authToken loaded:',
  authToken ? authToken.substring(0, 10) + '...' : 'NONE',
);

const api = {
  setAuthToken: (token) => {
    console.log(
      '🔑 setAuthToken called with:',
      token ? token.substring(0, 10) + '...' : 'NULL',
    );
    authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('✅ Token saved to localStorage');
    } else {
      localStorage.removeItem('authToken');
      console.log('❌ Token removed from localStorage');
    }
  },

  getToken: () => {
    const currentToken = authToken || localStorage.getItem('authToken');
    console.log(
      '🔍 getToken returning:',
      currentToken ? currentToken.substring(0, 10) + '...' : 'NONE',
    );
    return currentToken;
  },

  clearToken: () => {
    console.log('🗑️ clearToken called');
    authToken = null;
    localStorage.removeItem('authToken');
  },

  async request(endpoint, options = {}) {
    const headers = {
      ...options.headers,
    };

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Only add token if it exists AND it's not an auth endpoint
    const currentToken = authToken || localStorage.getItem('authToken');
    if (currentToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Token ${currentToken}`;
      console.log(
        `🔐 Using token for request: ${currentToken.substring(0, 10)}...`,
      );
    } else {
      console.log('⚠️ No token available for request');
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`, {
      headers,
      isFormData: options.isFormData,
    });

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
      console.error('API Error:', response.status, data);
      // Log the full error object
      console.error('Full error response:', JSON.stringify(data, null, 2));
      throw new Error(JSON.stringify(data) || `API Error: ${response.status}`);
    }

    return data;
  },

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
    console.log('📤 createPost called with FormData:');
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    console.log(
      '🔑 Using token:',
      currentToken ? currentToken.substring(0, 10) + '...' : 'NONE',
    );

    if (!currentToken) {
      console.error('❌ NO TOKEN AVAILABLE FOR POST CREATION!');
      return Promise.reject({ error: 'Not authenticated' });
    }

    return fetch(`${API_BASE_URL}/posts/create/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${currentToken}`,
      },
      body: formData,
    }).then((r) => {
      console.log('API response status:', r.status);
      if (!r.ok) {
        return r.json().then((err) => {
          console.error('API error response:', err);
          return Promise.reject(err);
        });
      }
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
    }),

  postComment: (reelId, text) =>
    api.request(`/reels/${reelId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getComments: (reelId) => api.request(`/reels/${reelId}/comments/`),

  followUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  unfollowUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  deletePost: (reelId) =>
    api.request(`/reels/${reelId}/`, {
      method: 'DELETE',
    }),

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

  getFollowers: (userId) => api.request(`/follows/?following=${userId}`),

  getFollowing: (userId) => api.request(`/follows/?follower=${userId}`),

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

    return fetch(`${API_BASE_URL}/profile/update_profile/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${authToken}`,
      },
      body: formData,
    }).then((r) => r.json());
  },

  // Get user's posts
  getUserPosts: (userId) => api.request(`/reels/?user=${userId}`),

  // Get saved posts
  getSavedPosts: () => api.request('/reels/?saved=true'),
  getUserSavedPosts: () => api.request('/reels/?saved=true'),
};

export default api;
