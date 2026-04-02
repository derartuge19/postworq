import { useState, useEffect, lazy, Suspense } from 'react';
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
const AdminApp = lazy(() => import('./admin/AdminApp').then(m => ({ default: m.AdminApp })));

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
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      api.setAuthToken(token);
      setAuthUser(JSON.parse(savedUser));
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
    setActiveTab('home');
  };

  const handleShowProfile = (userId = null) => {
    setProfileUserId(userId);
    setShowProfile(true);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
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
  };

  const handleShowEditProfile = () => {
    setShowEditProfile(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowFollowersList(false);
    setShowSettings(false);
  };

  const handleShowFollowers = (userId, type = 'followers') => {
    setFollowersListUserId(userId);
    setFollowersListType(type);
    setShowFollowersList(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowSettings(false);
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
  };

  const handleShowCampaigns = () => {
    setShowCampaigns(true);
    setShowProfile(false);
    setShowPostPage(false);
    setShowEditProfile(false);
    setShowFollowersList(false);
    setShowSettings(false);
    setShowNotifications(false);
    setShowCampaignDetail(false);
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
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
        {showSettings ? (
          <SettingsPage
            user={authUser}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
          />
        ) : showNotifications ? (
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
        ) : showEditProfile ? (
          <EditProfilePage
            user={authUser}
            onBack={() => {
              setShowEditProfile(false);
              setShowProfile(true);
            }}
            onSave={handleProfileSaved}
          />
        ) : showFollowersList ? (
          <FollowersListPage
            userId={followersListUserId}
            type={followersListType}
            onBack={() => {
              setShowFollowersList(false);
              setShowProfile(true);
            }}
            onUserClick={(user) => handleShowProfile(user.id)}
          />
        ) : showProfile ? (
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
        ) : showCampaignDetail ? (
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
          />
        ) : showCampaigns ? (
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
        ) : showPostPage ? (
          <EnhancedPostPage
            user={authUser}
            onBack={() => setShowPostPage(false)}
          />
        ) : screen === 'landing' ? (
          <LandingPage
            onLogin={() => setShowLogin(true)}
            onRegister={() => setShowRegister(true)}
            onShowCampaigns={handleShowCampaigns}
          />
        ) : (
          <TikTokLayout
            user={authUser}
            activeTab={activeTab}
            onLogout={handleLogout}
            onRequireAuth={handleRequireAuth}
            onShowPostPage={handleShowPostPage}
            onShowProfile={handleShowProfile}
            onShowSettings={handleShowSettings}
            onShowNotifications={handleShowNotifications}
          />
        )}
        </Suspense>
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
          </div>
        </div>
      )}
    </div>
  );
}
