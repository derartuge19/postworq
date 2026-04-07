import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppShell } from './components/AppShell';
import { TikTokLayout } from './components/TikTokLayout';
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
  const [authUser, setAuthUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showPostPage, setShowPostPage] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [followersListType, setFollowersListType] = useState('followers');
  const [followersListUserId, setFollowersListUserId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showCampaignLeaderboard, setShowCampaignLeaderboard] = useState(false);
  const [showCampaignFeed, setShowCampaignFeed] = useState(false);
  const [showVideoDetail, setShowVideoDetail] = useState(false);
  const [videoDetailId, setVideoDetailId] = useState(null);

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
  };

  // Load user from localStorage on mount + prefetch lazy components
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      api.setAuthToken(token);
      setAuthUser(JSON.parse(savedUser));
    }
    // Prefetch lazy components after app is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchComponents);
    } else {
      setTimeout(prefetchComponents, 2000);
    }
  }, []);

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
    setShowLogin(true);
  };

  const handleShowProfile = (userId = null) => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
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
    setShowPostPage(true);
    setShowProfile(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    pushHistoryState({ showPostPage: true, showProfile: false, showEditProfile: false, showFollowersList: false });
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

  const handleShowCampaigns = () => {
    if (!authUser) {
      setShowLogin(true);
      return;
    }
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
    setShowNotifications(true);
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
    setVideoDetailId(reelId);
    setShowVideoDetail(true);
    resetAllPages();
    pushHistoryState({ showVideoDetail: true, videoDetailId: reelId });
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
          resetAllPages();
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        onShowProfile={() => handleShowProfile(null)}
        onShowPostPage={handleShowPostPage}
        onShowSettings={handleShowSettings}
        onShowNotifications={handleShowNotifications}
        onShowCampaigns={handleShowCampaigns}
      >
        {/* Each lazy page gets its own Suspense so only one loads at a time */}
        {showSettings && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <SettingsPage
                user={authUser}
                onClose={() => setShowSettings(false)}
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
                onBack={() => setShowNotifications(false)}
                onShowPostPage={handleShowPostPage}
                onLogout={handleLogout}
                onShowProfile={() => handleShowProfile(null)}
                onShowSettings={handleShowSettings}
                onShowCampaigns={handleShowCampaigns}
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
                onBack={() => setShowCampaigns(false)}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        )}
        {showPostPage && (
          <LazyLoadErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <EnhancedPostPage
                user={authUser}
                onBack={() => setShowPostPage(false)}
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
        {screen === 'landing' && !showSettings && !showNotifications && !showEditProfile && !showFollowersList && !showProfile && !showCampaignDetail && !showCampaigns && !showPostPage && !showVideoDetail && (
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
        {screen !== 'landing' && !showSettings && !showNotifications && !showEditProfile && !showFollowersList && !showProfile && !showCampaignDetail && !showCampaigns && !showPostPage && !showVideoDetail && (
          <TikTokLayout
            user={authUser}
            activeTab={activeTab}
            onLogout={handleLogout}
            onRequireAuth={handleRequireAuth}
            onShowPostPage={handleShowPostPage}
            onShowProfile={handleShowProfile}
            onShowSettings={handleShowSettings}
            onShowNotifications={handleShowNotifications}
            onShowVideoDetail={handleShowVideoDetail}
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
