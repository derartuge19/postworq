import { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  Menu,
  X,
  Bell,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      {/* 1. Desktop Sidebar */}
      {!isMobile && (
        <aside
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

      {/* 2. Mobile Main Header */}
      {isMobile && (
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={{ background: 'transparent', border: 'none', color: T.txt }}
          >
            <Menu size={28} />
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.pri }}>
            WorqPost
          </div>
          <div style={{ width: 28 }} /> {/* Spacer */}
        </header>
      )}

      {/* 3. Main Content Area */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          marginTop: isMobile ? 60 : 0,
          paddingBottom: isMobile ? 70 : 0,
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

      {/* 5. Mobile Drawer Menu */}
      {isMobile && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1100,
              opacity: isDrawerOpen ? 1 : 0,
              visibility: isDrawerOpen ? 'visible' : 'hidden',
              transition: '0.3s',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              background: T.cardBg,
              zIndex: 1200,
              transform: `translateX(${isDrawerOpen ? '0' : '-100%'})`,
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 32,
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 900, color: T.pri }}>
                WorqPost
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none' }}
              >
                <X size={24} color={T.txt} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px',
                      border: 'none',
                      background: 'transparent',
                      color: T.txt,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {user && (
              <div
                style={{
                  marginTop: 'auto',
                  padding: '16px 0',
                  borderTop: `1px solid ${T.border}`,
                }}
              >
                <button
                  onClick={onLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: T.red || '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  <LogOut size={22} />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
