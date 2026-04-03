// Admin App - Complete with Campaign Management
import { useState, useEffect } from 'react';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagement } from './pages/UserManagement';
import { ContentModeration } from './pages/ContentModeration';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SubscriptionManagement } from './pages/SubscriptionManagement';
import { SettingsPage } from './pages/SettingsPage';
import { APIKeysPage } from './pages/APIKeysPage';
import { SystemLogsPage } from './pages/SystemLogsPage';
import { PerformancePage } from './pages/PerformancePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AdminManagementPage } from './pages/AdminManagementPage';
import { ContestDashboardPage } from './pages/ContestDashboardPage';
import { JudgingPortalPage } from './pages/JudgingPortalPage';
import { AntiCheatPage } from './pages/AntiCheatPage';
import { CampaignManagementPage } from './pages/CampaignManagementPage';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminLogin } from './pages/AdminLogin';
import api from '../api';

const T = {
  pri: "#DA9B2A",
  txt: "#1C1917",
  sub: "#78716C",
  bg: "#FAFAF9",
  dark: "#0C1A12",
  border: "#E7E5E4",
  card: "#FFFFFF",
  red: "#EF4444",
  green: "#10B981",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F59E0B"
};

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        api.setAuthToken(token);
        const response = await api.getProfile();
        if (response.user && response.user.is_staff) {
          setAdminUser(response.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      if (response.user && response.user.is_staff) {
        localStorage.setItem('authToken', response.token);
        api.setAuthToken(response.token);
        setAdminUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: 'Access denied. Admin privileges required.' };
      }
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    api.setAuthToken(null);
    setIsAuthenticated(false);
    setAdminUser(null);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontSize: 16,
        color: T.sub
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} theme={T} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard theme={T} />;
      case 'users':
        return <UserManagement theme={T} />;
      case 'content':
        return <ContentModeration theme={T} />;
      case 'analytics':
        return <AnalyticsPage theme={T} />;
      case 'subscriptions':
        return <SubscriptionManagement theme={T} />;
      case 'settings':
        return <SettingsPage theme={T} />;
      case 'api-keys':
        return <APIKeysPage theme={T} />;
      case 'logs':
        return <SystemLogsPage theme={T} />;
      case 'performance':
        return <PerformancePage theme={T} />;
      case 'notifications':
        return <NotificationsPage theme={T} />;
      case 'admins':
        return <AdminManagementPage theme={T} />;
      case 'campaigns':
        return <CampaignManagementPage theme={T} />;
      case 'contest':
        return <ContestDashboardPage theme={T} />;
      case 'judging':
        return <JudgingPortalPage theme={T} />;
      case 'anti-cheat':
        return <AntiCheatPage theme={T} />;
      default:
        return <AdminDashboard theme={T} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: T.bg,
      overflow: 'hidden',
    }}>
      <AdminSidebar
        theme={T}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px',
      }}>
        {renderPage()}
      </div>
    </div>
  );
}
