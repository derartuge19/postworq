import React, { useState, useEffect, useRef, lazy, Suspense, startTransition } from 'react';
import { AppShell } from './components/AppShell';
import { TikTokLayout } from './components/TikTokLayout';
import { useTheme } from './contexts/ThemeContext';
import api from './api';

// Lazy load ALL non-critical components for smaller initial bundle
const ModernLoginScreen = lazy(() => import('./components/ModernLoginScreen').then(m => ({ default: m.ModernLoginScreen })));
const ModernRegisterScreen = lazy(() => import('./components/ModernRegisterScreen').then(m => ({ default: m.ModernRegisterScreen })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const EnhancedPostPage = lazy(() => import('./components/EnhancedPostPage').then(m => ({ default: m.EnhancedPostPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./components/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const FollowersListPage = lazy(() => import('./components/FollowersListPage').then(m => ({ default: m.FollowersListPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('./components/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage').then(m => ({ default: m.CampaignDetailPage })));
const CampaignLeaderboard = lazy(() => import('./pages/CampaignLeaderboard'));
const CampaignFeed = lazy(() => import('./pages/CampaignFeed'));
const VideoDetailPage = lazy(() => import('./components/VideoDetailPage').then(m => ({ default: m.VideoDetailPage })));
const ExplorerPage = lazy(() => import('./components/ExplorerPage').then(m => ({ default: m.ExplorerPage })));
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

// Prefetch all lazy chunks after initial load so navigation is instant
const prefetchComponents = () => {
  import('./components/ProfilePage');
  import('./components/EditProfilePage');
  import('./components/SettingsPage');
  import('./components/NotificationsPage');
  import('./components/EnhancedPostPage');
  import('./components/FollowersListPage');
  import('./components/ModernLoginScreen');
  import('./components/ModernRegisterScreen');
  import('./pages/CampaignsPage');
  import('./pages/CampaignDetailPage');
  import('./pages/CampaignLeaderboard');
  import('./pages/CampaignFeed');
  import('./components/VideoDetailPage');
  import('./components/ExplorerPage');
  import('./components/HomePage');
};

// Error boundary for lazy loading failures
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#fff', gap: 16,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>Loading...</div>
          <div style={{ fontSize: 14, color: '#666' }}>Please wait while we load the page</div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Page skeleton for navigation transitions
function PageSkeleton() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#fff', display: 'flex', flexDirection: 'column',
      zIndex: 200,
    }}>
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #E7E5E4',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f0f0' }} />
        <div style={{ width: 120, height: 16, background: '#f0f0f0', borderRadius: 8 }} />
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f5f5f5' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '60%', height: 14, background: '#f0f0f0', borderRadius: 7 }} />
            <div style={{ width: '40%', height: 12, background: '#f5f5f5', borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ width: 40, height: 14, background: '#f0f0f0', borderRadius: 7, margin: '0 auto 4px' }} />
              <div style={{ width: 50, height: 10, background: '#f5f5f5', borderRadius: 5, margin: '0 auto' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, marginTop: 16 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ aspectRatio: '1', background: '#f5f5f5', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WerqRoot() {
  // Check if accessing admin panel
  if (
    window.location.pathname === '/admin' ||
    window.location.hash === '#/admin'
  ) {
    return (
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Admin...</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  const [screen, setScreen] = useState('app');
  const { applyFromSettings } = useTheme();

  // ── Restore auth synchronously so pages never receive user=null on first render
  (() => {
    try {
      const t = localStorage.getItem('authToken');
      if (t) api.setAuthToken(t);
    } catch {}
  })();
  const [authUser, setAuthUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ── Read the saved nav snapshot — ONLY restore the active tab, never overlays ──
  // On first launch (no sessionStorage), always start with 'home', ignore localStorage
  const _savedActiveTab = (() => { 
    try { 
      const navData = sessionStorage.getItem('_nav');
      if (!navData) return 'home'; // First launch → always home
      return JSON.parse(navData).activeTab || 'home';
    } catch { return 'home'; } 
  })();

  const [showPostPage, setShowPostPage] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [activeTab, setActiveTab] = useState(_savedActiveTab);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [followersListType, setFollowersListType] = useState('followers');
  const [followersListUserId, setFollowersListUserId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsReturnState = useRef(null); // tracks where to go back to when settings closes
  const prevNavState = useRef(null); // tracks nav state before any overlay page opens
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showCampaignLeaderboard, setShowCampaignLeaderboard] = useState(false);
  const [showCampaignFeed, setShowCampaignFeed] = useState(false);
  const [showVideoDetail, setShowVideoDetail] = useState(false);
  const [videoDetailId, setVideoDetailId] = useState(null);
  const [showExplorer, setShowExplorer] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Poll unread notification count every 30s when user is logged in
  useEffect(() => {
    if (!authUser) { setUnreadNotifCount(0); return; }
    const fetchCount = async () => {
      try {
        const data = await api.getUnreadNotificationCount();
        setUnreadNotifCount(data.unread_count || 0);
      } catch (_) {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [authUser]);

  // Load and apply platform typography settings
  const [typographyLoaded, setTypographyLoaded] = useState(false);
  const [typographyError, setTypographyError] = useState(null);
  const [currentFont, setCurrentFont] = useState('Inter');
  
  // Defer font loading to after initial render to reduce LCP time
  useEffect(() => {
    const loadTypographySettings = async () => {
      try {
        const settings = await api.request('/settings/public/');
        
        if (!settings || !settings.font_family_secondary) {
          setTypographyError('No settings returned from server');
          return;
        }
        
        setCurrentFont(settings.font_family_secondary);
        
        // Load Google Fonts dynamically (after LCP)
        const fonts = [
          settings.font_family_primary,
          settings.font_family_secondary,
          settings.font_family_username,
          settings.font_family_caption,
        ].filter((f, i, arr) => f && arr.indexOf(f) === i);
        
        fonts.forEach(font => {
          if (font && font !== 'Inter') {
            const fontUrl = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
            const link = document.createElement('link');
            link.href = fontUrl;
            link.rel = 'stylesheet';
            if (!document.querySelector(`link[href*="${font.replace(/ /g, '+')}"]`)) {
              document.head.appendChild(link);
            }
          }
        });
        
        // Build CSS with actual values from settings
        const fontPrimary = `"${settings.font_family_primary || 'Inter'}", sans-serif`;
        const fontSecondary = `"${settings.font_family_secondary || 'Inter'}", sans-serif`;
        const fontUsername = `"${settings.font_family_username || 'Inter'}", sans-serif`;
        const fontCaption = `"${settings.font_family_caption || 'Inter'}", sans-serif`;
        
        // Apply CSS variables
        const root = document.documentElement;
        root.style.setProperty('--font-primary', fontPrimary);
        root.style.setProperty('--font-secondary', fontSecondary);
        root.style.setProperty('--font-username', fontUsername);
        root.style.setProperty('--font-caption', fontCaption);
        root.style.setProperty('--font-size-base', `${settings.font_size_base || 16}px`);
        root.style.setProperty('--font-weight-headings', settings.font_weight_headings || '700');
        root.style.setProperty('--font-weight-body', settings.font_weight_body || '400');
        root.style.setProperty('--letter-spacing', settings.letter_spacing || 'normal');
        root.style.setProperty('--line-height', settings.line_height || '1.5');
        root.style.setProperty('--color-primary', settings.primary_color || '#8B5CF6');
        root.style.setProperty('--color-secondary', settings.secondary_color || '#F97316');
        
        // Apply to body
        document.body.style.fontFamily = fontSecondary;
        document.body.style.fontSize = `${settings.font_size_base || 16}px`;
        document.body.style.lineHeight = settings.line_height || '1.5';
        document.body.style.letterSpacing = settings.letter_spacing || 'normal';
        
        // Inject comprehensive global CSS with !important
        let styleEl = document.getElementById('platform-typography');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'platform-typography';
          document.head.appendChild(styleEl);
        }
        
        const css = `
          :root {
            --font-primary: ${fontPrimary};
            --font-secondary: ${fontSecondary};
            --font-username: ${fontUsername};
            --font-caption: ${fontCaption};
            --color-primary: ${settings.primary_color || '#8B5CF6'};
            --color-secondary: ${settings.secondary_color || '#F97316'};
          }
          
          /* Force font on ALL elements */
          *, *::before, *::after {
            font-family: ${fontSecondary} !important;
          }
          
          /* Headings use primary font */
          h1, h2, h3, h4, h5, h6,
          h1 *, h2 *, h3 *, h4 *, h5 *, h6 * {
            font-family: ${fontPrimary} !important;
            font-weight: ${settings.font_weight_headings || '700'} !important;
          }
          
          /* Specific overrides for username */
          .username, .username *,
          [class*="username"], [class*="username"] *,
          .user-name, .user-name *,
          .handle, .handle * {
            font-family: ${fontUsername} !important;
          }
          
          /* Buttons and inputs */
          button, input, textarea, select {
            font-family: ${fontSecondary} !important;
          }
          
          /* Captions */
          .caption, .caption *,
          .description, .description * {
            font-family: ${fontCaption} !important;
          }
        `;
        
        styleEl.textContent = css;
        
        console.log('[Typography] Styles applied successfully');
        console.log('[Typography] Current font:', fontSecondary);
        applyFromSettings(settings);
        setTypographyLoaded(true);
        setTypographyError(null);
      } catch (error) {
        console.error('[Typography] Error loading settings:', error);
        setTypographyError(error.message || 'Failed to load settings');
      }
    };
    
    loadTypographySettings();
  }, []);

  // Browser history support
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state || {};
      // Restore state from history
      setShowLogin(state.showLogin || false);
      setShowRegister(state.showRegister || false);
      setShowPostPage(state.showPostPage || false);
      setShowProfile(state.showProfile || false);
      setProfileUserId(state.profileUserId || null);
      setActiveTab(state.activeTab || 'home');
      setShowEditProfile(state.showEditProfile || false);
      setShowFollowersList(state.showFollowersList || false);
      setFollowersListType(state.followersListType || 'followers');
      setFollowersListUserId(state.followersListUserId || null);
      setShowSettings(state.showSettings || false);
      setShowNotifications(state.showNotifications || false);
      setShowCampaigns(state.showCampaigns || false);
      setShowCampaignLeaderboard(state.showCampaignLeaderboard || false);
      setShowCampaignFeed(state.showCampaignFeed || false);
      setShowVideoDetail(state.showVideoDetail || false);
      setVideoDetailId(state.videoDetailId || null);
      setShowExplorer(state.showExplorer || false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push state to history whenever navigation state changes
  const pushHistoryState = (newState) => {
    const state = {
      showLogin: newState.showLogin !== undefined ? newState.showLogin : showLogin,
      showRegister: newState.showRegister !== undefined ? newState.showRegister : showRegister,
      showPostPage: newState.showPostPage !== undefined ? newState.showPostPage : showPostPage,
      showProfile: newState.showProfile !== undefined ? newState.showProfile : showProfile,
      profileUserId: newState.profileUserId !== undefined ? newState.profileUserId : profileUserId,
      activeTab: newState.activeTab !== undefined ? newState.activeTab : activeTab,
      showEditProfile: newState.showEditProfile !== undefined ? newState.showEditProfile : showEditProfile,
      showFollowersList: newState.showFollowersList !== undefined ? newState.showFollowersList : showFollowersList,
      followersListType: newState.followersListType !== undefined ? newState.followersListType : followersListType,
      followersListUserId: newState.followersListUserId !== undefined ? newState.followersListUserId : followersListUserId,
      showSettings: newState.showSettings !== undefined ? newState.showSettings : showSettings,
      showNotifications: newState.showNotifications !== undefined ? newState.showNotifications : showNotifications,
      showCampaigns: newState.showCampaigns !== undefined ? newState.showCampaigns : showCampaigns,
      showCampaignLeaderboard: newState.showCampaignLeaderboard !== undefined ? newState.showCampaignLeaderboard : showCampaignLeaderboard,
      showCampaignFeed: newState.showCampaignFeed !== undefined ? newState.showCampaignFeed : showCampaignFeed,
      showVideoDetail: newState.showVideoDetail !== undefined ? newState.showVideoDetail : showVideoDetail,
      videoDetailId: newState.videoDetailId !== undefined ? newState.videoDetailId : videoDetailId,
      showExplorer: newState.showExplorer !== undefined ? newState.showExplorer : showExplorer,
    };
    window.history.pushState(state, '');
  };
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [campaignId, setCampaignId] = useState(null);

  // Function to reset all special page states
  const resetAllPages = () => {
    setShowPostPage(false);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowSettings(false);
    setShowNotifications(false);
    setShowCampaigns(false);
    setShowCampaignDetail(false);
    setShowCampaignLeaderboard(false);
    setShowCampaignFeed(false);
    setShowVideoDetail(false);
    setShowExplorer(false);
};

  // ── Save nav snapshot to sessionStorage on every relevant state change ──
  const saveNav = (patch = {}) => {
    const next = {
      activeTab,
      showPostPage,
      showProfile,
      profileUserId,
      showSettings,
      showNotifications,
      showCampaigns,
      showExplorer,
      ...patch,
    };
    try { sessionStorage.setItem('_nav', JSON.stringify(next)); } catch {}
    if (next.activeTab) { try { localStorage.setItem('_activeTab', next.activeTab); } catch {} }
  };

  // Persist whenever any of these state vars change
  useEffect(() => {
    saveNav();
  }, [activeTab, showPostPage, showProfile, profileUserId, showSettings, showNotifications, showCampaigns, showExplorer]); // eslint-disable-line

  // Load user from localStorage on mount + prefetch lazy components
  useEffect(() => {
    // Auth is already restored synchronously above.
    // This effect just prefetches lazy chunks.
    // Prefetch lazy components after app is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchComponents);
    } else {
      setTimeout(prefetchComponents, 2000);
    }

    // Handle shared post links: /post/:id or ?post=:id
    const handleSharedLink = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      let postId = null;

      // Check /post/:id format
      const postMatch = path.match(/^\/post\/(\d+)/);
      if (postMatch) {
        postId = postMatch[1];
      } else if (params.has('post')) {
        // Check ?post=:id format
        postId = params.get('post');
      }

      if (postId) {
        console.log('📤 Opening shared post:', postId);
        setVideoDetailId(parseInt(postId));
        setShowVideoDetail(true);
        setActiveTab('home');
        // Clean URL without reload
        window.history.replaceState({}, '', '/');
      }
    };

    handleSharedLink();
  }, []);

  // Refresh user profile from backend on startup to sync across devices
  useEffect(() => {
    const refreshUserProfile = async () => {
      if (!authUser || !api.hasToken()) return;
      
      try {
        // Fetch fresh profile data from backend
        const profileData = await api.request('/profile/me/');
        if (profileData) {
          // /profile/me/ returns { user: {...}, profile_photo, bio, ... }
          const userData = profileData.user || {};
          const updatedUser = {
            id: userData.id || authUser.id,
            username: userData.username || authUser.username,
            email: userData.email || authUser.email,
            first_name: userData.first_name || authUser.first_name || "",
            last_name: userData.last_name || authUser.last_name || "",
            name: userData.first_name || userData.username || authUser.name,
            profile_photo: profileData.profile_photo || userData.profile_photo || null,
            bio: profileData.bio || userData.bio || "",
            followers_count: userData.followers_count || authUser.followers_count || 0,
            following_count: userData.following_count || authUser.following_count || 0,
            is_staff: userData.is_staff || authUser.is_staff || false,
          };
          // Only update if there are actual changes
          if (JSON.stringify(updatedUser) !== JSON.stringify(authUser)) {
            setAuthUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('👤 Profile synced from backend');
          }
        }
      } catch (e) {
        console.log('Could not refresh profile:', e.message);
      }
    };
    
    // Small delay to not block initial render
    const timer = setTimeout(refreshUserProfile, 1000);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Listen for navigate to create post event from campaign modal
  useEffect(() => {
    const handleNavigateToCreatePost = () => {
      setShowPostPage(true);
      setShowProfile(false);
      setShowEditProfile(false);
      setShowFollowersList(false);
      setShowCampaigns(false);
      setShowCampaignDetail(false);
      setShowCampaignLeaderboard(false);
      setShowCampaignFeed(false);
    };
    window.addEventListener('navigateToCreatePost', handleNavigateToCreatePost);

    return () => {
      window.removeEventListener(
        'navigateToCreatePost',
        handleNavigateToCreatePost,
      );
    };
  }, []);

  const handleLogout = () => {
    api.setAuthToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthUser(null);
    setShowProfile(false);
    setShowPostPage(false);
    setShowSettings(false);
    setShowNotifications(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowCampaigns(false);
    setShowCampaignDetail(false);
    setShowCampaignLeaderboard(false);
    setShowCampaignFeed(false);
    setActiveTab('home');
    try { sessionStorage.removeItem('_nav'); localStorage.setItem('_activeTab', 'home'); } catch {}
    setShowLogin(true);
  };

  const handleShowProfile = (userId = null) => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    if (!userId) setActiveTab('profile');
    setProfileUserId(userId);
    setShowProfile(true);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    pushHistoryState({ showProfile: true, profileUserId: userId, showPostPage: false, showEditProfile: false, showFollowersList: false });
  };

  const handleShowPostPage = () => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    prevNavState.current = { activeTab, showProfile, profileUserId };
    setActiveTab('create');
    setShowPostPage(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    pushHistoryState({ showPostPage: true, showProfile: false, showEditProfile: false, showFollowersList: false });
  };

  const handleClosePostPage = () => {
    setShowPostPage(false);
    const ret = prevNavState.current;
    if (ret) {
      setActiveTab(ret.activeTab || 'home');
      if (ret.showProfile) { setShowProfile(true); setProfileUserId(ret.profileUserId || null); }
      prevNavState.current = null;
    } else {
      setActiveTab('home');
    }
  };

  const handleShowEditProfile = () => {
    setShowEditProfile(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowFollowersList(false);
    setShowSettings(false);
    pushHistoryState({ showEditProfile: true, showProfile: false, showPostPage: false, showFollowersList: false, showSettings: false });
  };

  const handleShowFollowers = (userId, type = 'followers') => {
    setFollowersListUserId(userId);
    setFollowersListType(type);
    setShowFollowersList(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowSettings(false);
    pushHistoryState({ showFollowersList: true, followersListUserId: userId, followersListType: type, showProfile: false, showPostPage: false, showEditProfile: false, showSettings: false });
  };

  const handleShowSettings = () => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    // Save current state so X button restores it
    settingsReturnState.current = {
      activeTab,
      showProfile,
      profileUserId,
    };
    setActiveTab('settings');
    setShowSettings(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowNotifications(false);
    setShowCampaigns(false);
    setShowCampaignDetail(false);
    setShowCampaignLeaderboard(false);
    setShowCampaignFeed(false);
    pushHistoryState({ showSettings: true, showProfile: false, showPostPage: false, showEditProfile: false, showFollowersList: false, showNotifications: false, showCampaigns: false, showCampaignDetail: false, showCampaignLeaderboard: false, showCampaignFeed: false });
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    const ret = settingsReturnState.current;
    if (ret) {
      setActiveTab(ret.activeTab || 'home');
      if (ret.showProfile) {
        setShowProfile(true);
        setProfileUserId(ret.profileUserId || null);
      }
      settingsReturnState.current = null;
    } else {
      setActiveTab('home');
    }
  };

  const handleShowCampaigns = () => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    prevNavState.current = { activeTab, showProfile, profileUserId };
    setActiveTab('campaigns');
    setShowCampaigns(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowSettings(false);
    setShowNotifications(false);
    setShowCampaignDetail(false);
    setShowCampaignLeaderboard(false);
    setShowCampaignFeed(false);
    pushHistoryState({ showCampaigns: true, showProfile: false, showPostPage: false, showEditProfile: false, showFollowersList: false, showSettings: false, showNotifications: false, showCampaignDetail: false, showCampaignLeaderboard: false, showCampaignFeed: false });
  };

  const handleShowNotifications = () => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
    prevNavState.current = { activeTab, showProfile, profileUserId };
    setActiveTab('notifications');
    setShowNotifications(true);
    setUnreadNotifCount(0);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowSettings(false);
    setShowCampaigns(false);
    setShowCampaignDetail(false);
    setShowCampaignLeaderboard(false);
    setShowCampaignFeed(false);
    pushHistoryState({ showNotifications: true, showProfile: false, showPostPage: false, showEditProfile: false, showFollowersList: false, showSettings: false, showCampaigns: false, showCampaignDetail: false, showCampaignLeaderboard: false, showCampaignFeed: false });
  };

  const handleShowVideoDetail = (reelId) => {
    resetAllPages();
    startTransition(() => {
      setActiveTab('reels');
      // Store the reel ID to scroll to it in TikTokLayout
      setVideoDetailId(reelId);
      pushHistoryState({ activeTab: 'reels', videoDetailId: reelId });
    });
  };

  const handleShowExplorer = () => {
    resetAllPages();
    startTransition(() => {
      setActiveTab('explore');
      setShowExplorer(true);
      pushHistoryState({ showExplorer: true });
    });
  };

  const handleProfileSaved = (updatedUser) => {
    setAuthUser(updatedUser);
  };

  const handleRequireAuth = () => {
    setShowLogin(true);
  };

  return (
    <div className="App">
      <AppShell
        user={authUser}
        activeTab={activeTab}
        onTabChange={(tab) => {
          // For tabs that are pure feed views, collapse any open overlay pages.
          // Action-based tabs (campaigns, settings, etc.) manage their own page
          // state via their dedicated handlers — just update the indicator here.
          const feedTabs = ['home', 'reels', 'messages', 'following', 'bookmarks', 'search'];
          if (feedTabs.includes(tab)) resetAllPages();
          // Use startTransition to defer non-urgent updates for better INP
          startTransition(() => {
            setActiveTab(tab);
            saveNav({ activeTab: tab });
          });
        }}
        onLogout={handleLogout}
        onShowProfile={() => handleShowProfile(null)}
        onShowPostPage={handleShowPostPage}
        onShowSettings={handleShowSettings}
        onShowNotifications={handleShowNotifications}
        onShowCampaigns={handleShowCampaigns}
        onShowExplorer={handleShowExplorer}
        unreadNotifCount={unreadNotifCount}
      >
        {/* Each lazy page gets its own Suspense so only one loads at a time */}
        {showSettings && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <SettingsPage
                user={authUser}
                onClose={handleCloseSettings}
                onLogout={handleLogout}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showNotifications && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <NotificationsPage
                user={authUser}
                onUserClick={(userId) => {
                  setShowNotifications(false);
                  handleShowProfile(userId);
                }}
                onBack={() => {
                  setShowNotifications(false);
                  const ret = prevNavState.current;
                  if (ret) { setActiveTab(ret.activeTab || 'home'); if (ret.showProfile) { setShowProfile(true); setProfileUserId(ret.profileUserId || null); } prevNavState.current = null; } else { setActiveTab('home'); }
                }}
                onShowPostPage={handleShowPostPage}
                onLogout={handleLogout}
                onShowProfile={() => handleShowProfile(null)}
                onShowSettings={handleShowSettings}
                onShowCampaigns={handleShowCampaigns}
                onShowVideoDetail={(reelId) => {
                  setShowNotifications(false);
                  handleShowVideoDetail(reelId);
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showEditProfile && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <EditProfilePage
                user={authUser}
                onBack={() => {
                  setShowEditProfile(false);
                  setShowProfile(true);
                }}
                onSave={handleProfileSaved}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showFollowersList && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <FollowersListPage
                user={authUser}
                userId={followersListUserId}
                type={followersListType}
                onBack={() => {
                  setShowFollowersList(false);
                  setShowProfile(true);
                }}
                onUserClick={(userId) => {
                  const id = typeof userId === 'object' ? userId.id : userId;
                  setShowFollowersList(false);
                  handleShowProfile(id);
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showProfile && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <ProfilePage
                user={authUser}
                userId={profileUserId}
                onBack={() => setShowProfile(false)}
                onEditProfile={handleShowEditProfile}
                onShowSettings={handleShowSettings}
                onShowFollowers={(userId) =>
                  handleShowFollowers(userId, 'followers')
                }
                onShowFollowing={(userId) =>
                  handleShowFollowers(userId, 'following')
                }
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showCampaignDetail && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <CampaignDetailPage
                theme={{
                  pri: '#DA9B2A',
                  txt: '#1C1917',
                  sub: '#78716C',
                  bg: '#FAFAF9',
                  card: '#FFFFFF',
                  border: '#E7E5E4',
                  blue: '#3B82F6',
                  green: '#10B981',
                  red: '#EF4444',
                  orange: '#F59E0B',
                  purple: '#8B5CF6',
                }}
                campaignId={campaignId}
                onBack={() => {
                  setShowCampaignDetail(false);
                  setShowCampaigns(true);
                }}
                onShowLeaderboard={() => {
                  setShowCampaignDetail(false);
                  setShowCampaignLeaderboard(true);
                }}
                onShowFeed={() => {
                  setShowCampaignDetail(false);
                  setShowCampaignFeed(true);
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showCampaignLeaderboard && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <CampaignLeaderboard
                campaignId={campaignId}
                onBack={() => {
                  setShowCampaignLeaderboard(false);
                  setShowCampaignDetail(true);
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showCampaignFeed && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <CampaignFeed
                campaignId={campaignId}
                onBack={() => {
                  setShowCampaignFeed(false);
                  setShowCampaignDetail(true);
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showCampaigns && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <CampaignsPage
                theme={{
                  pri: '#DA9B2A',
                  txt: '#1C1917',
                  sub: '#78716C',
                  bg: '#FAFAF9',
                  card: '#FFFFFF',
                  border: '#E7E5E4',
                  blue: '#3B82F6',
                  green: '#10B981',
                  red: '#EF4444',
                  orange: '#F59E0B',
                  purple: '#8B5CF6',
                }}
                onCampaignClick={(id) => {
                  setCampaignId(id);
                  setShowCampaigns(false);
                  setShowCampaignDetail(true);
                }}
                onBack={() => {
                  setShowCampaigns(false);
                  const ret = prevNavState.current;
                  if (ret) { setActiveTab(ret.activeTab || 'home'); if (ret.showProfile) { setShowProfile(true); setProfileUserId(ret.profileUserId || null); } prevNavState.current = null; } else { setActiveTab('home'); }
                }}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showPostPage && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <EnhancedPostPage
                user={authUser}
                onBack={handleClosePostPage}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showVideoDetail && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <VideoDetailPage
                reelId={videoDetailId}
                user={authUser}
                onBack={() => setShowVideoDetail(false)}
                onShowProfile={handleShowProfile}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showExplorer && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <ExplorerPage
                user={authUser}
                onBack={() => setShowExplorer(false)}
                onShowProfile={handleShowProfile}
                onShowVideoDetail={handleShowVideoDetail}
                onRequireAuth={handleRequireAuth}
                onShowPostPage={handleShowPostPage}
                onShowSettings={handleShowSettings}
                onShowNotifications={handleShowNotifications}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {screen === 'landing' && !showSettings && !showNotifications && !showEditProfile && !showFollowersList && !showProfile && !showCampaignDetail && !showCampaigns && !showPostPage && !showVideoDetail && !showExplorer && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <LandingPage
                onLogin={() => setShowLogin(true)}
                onRegister={() => setShowRegister(true)}
                onShowCampaigns={handleShowCampaigns}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {screen !== 'landing' && !showSettings && !showNotifications && !showEditProfile && !showFollowersList && !showProfile && !showCampaignDetail && !showCampaigns && !showPostPage && !showVideoDetail && !showExplorer && activeTab === 'home' && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <HomePage
                user={authUser}
                onShowProfile={handleShowProfile}
                onShowPostPage={handleShowPostPage}
                onRequireAuth={handleRequireAuth}
                onShowExplorer={handleShowExplorer}
                onShowVideoDetail={handleShowVideoDetail}
                onShowCampaigns={handleShowCampaigns}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {screen !== 'landing' && !showSettings && !showNotifications && !showEditProfile && !showFollowersList && !showProfile && !showCampaignDetail && !showCampaigns && !showPostPage && !showVideoDetail && !showExplorer && activeTab !== 'home' && (
          <TikTokLayout
            user={authUser}
            activeTab={activeTab}
            videosOnly={activeTab === 'reels'}
            initialVideoId={videoDetailId}
            onLogout={handleLogout}
            onRequireAuth={handleRequireAuth}
            onShowPostPage={handleShowPostPage}
            onShowProfile={handleShowProfile}
            onShowSettings={handleShowSettings}
            onShowNotifications={handleShowNotifications}
            onShowVideoDetail={handleShowVideoDetail}
            onShowExplorer={handleShowExplorer}
            unreadNotifCount={unreadNotifCount}
          />
        )}
      </AppShell>
      {showLogin && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            overflow: 'auto',
          }}
          onClick={() => setShowLogin(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 480, margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <LazyLoadErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <ModernLoginScreen
                  onSuccess={(u) => {
                    setAuthUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                    setShowLogin(false);
                  }}
                  onRegister={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  onBack={() => setShowLogin(false)}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </div>
        </div>
      )}

      {showRegister && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            overflow: 'auto',
          }}
          onClick={() => setShowRegister(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 480, margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <LazyLoadErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <ModernRegisterScreen
                  onSuccess={(u) => {
                    setAuthUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                    setShowRegister(false);
                  }}
                  onLogin={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                  onBack={() => setShowRegister(false)}
                />
              </Suspense>
            </LazyLoadErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
