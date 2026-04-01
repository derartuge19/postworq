import { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  Settings,
  Trophy,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function AppShell({
  user,
  activeTab,
  onTabChange,
  onLogout,
  onShowProfile,
  onShowPostPage,
  onShowSettings,
  onShowNotifications,
  onShowCampaigns,
  children,
}) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'home', icon: Home, label: t('home') },
    { id: 'explore', icon: Compass, label: t('explore') },
    {
      id: 'notifications',
      icon: Bell,
      label: t('notifications'),
      action: onShowNotifications,
    },
    { id: 'messages', icon: MessageCircle, label: t('messages') },
    {
      id: 'create',
      icon: PlusSquare,
      label: t('create'),
      action: onShowPostPage,
    },
    {
      id: 'campaigns',
      icon: Trophy,
      label: t('campaigns'),
      action: onShowCampaigns,
    },
    { id: 'profile', icon: User, label: t('profile'), action: onShowProfile },
    {
      id: 'settings',
      icon: Settings,
      label: t('settings'),
      action: onShowSettings,
    },
  ];

  const handleItemClick = (item) => {
    setIsDrawerOpen(false);
    if (item.action) {
      item.action();
    } else {
      onTabChange?.(item.id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100%',
        background: T.bg,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @media (max-width: 1024px) {
          .appshell-desktop-sidebar {
            display: none !important;
          }
        }
        @media (min-width: 1025px) {
          .appshell-mobile-nav {
            display: none !important;
          }
        }
        .appshell-main::-webkit-scrollbar { display: none; }
        .appshell-main { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* 1. Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="appshell-desktop-sidebar"
          style={{
            width: 260,
            borderRight: `1px solid ${T.border}`,
            background: T.cardBg,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 12px',
            zIndex: 100,
          }}
        >
          <div style={{ padding: '0 16px', marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: T.pri }}>
              WorqPost
            </div>
          </div>

          <nav
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    border: 'none',
                    background: isActive ? T.pri + '10' : 'transparent',
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: isActive ? T.pri : T.txt,
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user && (
            <div
              style={{
                marginTop: 'auto',
                padding: '16px',
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: T.txt,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={20} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </aside>
      )}


      {/* 3. Main Content Area */}
      <main
        className="appshell-main"
        style={{
          flex: 1,
          position: 'relative',
          height: isMobile ? '100dvh' : '100%',
          overflowY: 'auto',
          paddingTop: 0,
          paddingBottom: isMobile ? 70 : 0,
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            paddingBottom: 10,
          }}
        >
          {[
            menuItems[0],
            menuItems[1],
            menuItems[4],
            menuItems[3],
            menuItems[6],
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? T.pri : T.txt,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}
