import { useState, useEffect, useRef } from 'react';
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  Bell,
  Settings,
  Trophy,
  LogOut,
  Film,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import config from '../config';

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
  onShowExplorer,
  unreadNotifCount = 0,
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

  // Sidebar-only items (Explore moved to top nav bar, Campaigns kept in sidebar)
  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'reels', icon: Film, label: 'Reels' },
    {
      id: 'campaigns',
      icon: Trophy,
      label: 'Campaigns',
      action: onShowCampaigns,
    },
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
    { id: 'profile', icon: User, label: t('profile'), action: onShowProfile },
    {
      id: 'settings',
      icon: Settings,
      label: t('settings'),
      action: onShowSettings,
    },
  ];


  const handleItemClick = (item) => {
    // Always update the active-tab highlight first, then run any special action.
    onTabChange?.(item.id);
    if (item.action) {
      item.action();
    }
  };

  // ─── Mobile: swipe left/right to switch bottom-nav tabs (TikTok-style) ──────
  // Tab order follows the mobile bottom bar, skipping the center "create" action.
  const MOBILE_TAB_ORDER = ['home', 'reels', 'messages', 'profile'];
  const swipeStart = useRef({ x: 0, y: 0, t: 0, active: false });
  const handleMainTouchStart = (e) => {
    if (!isMobile) return;
    const t0 = e.touches[0];
    // Ignore swipes that start on common interactive controls so we don't hijack
    // carousels, sliders, or horizontal pickers.
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      swipeStart.current.active = false;
      return;
    }
    swipeStart.current = { x: t0.clientX, y: t0.clientY, t: Date.now(), active: true };
  };
  const handleMainTouchEnd = (e) => {
    if (!isMobile || !swipeStart.current.active) return;
    const t1 = e.changedTouches[0];
    const dx = t1.clientX - swipeStart.current.x;
    const dy = t1.clientY - swipeStart.current.y;
    const dt = Date.now() - swipeStart.current.t;
    swipeStart.current.active = false;

    // Must be a fast, clearly horizontal flick:
    //  - horizontal distance > 70px
    //  - horizontal is at least 1.8x vertical (so vertical scrolling & pull-to-refresh win)
    //  - gesture completes in under 600ms
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 70 || absX < absY * 1.8 || dt > 600) return;

    // Find where we are in the tab order. Map common aliases back onto the
    // canonical tab id used by the bottom bar.
    const aliasMap = { foryou: 'home', feed: 'home' };
    const current = aliasMap[activeTab] || activeTab;
    const idx = MOBILE_TAB_ORDER.indexOf(current);
    if (idx === -1) return; // current page isn't one of the swipeable tabs

    const nextIdx = dx < 0 ? idx + 1 : idx - 1; // swipe left = next, right = prev
    if (nextIdx < 0 || nextIdx >= MOBILE_TAB_ORDER.length) return;
    const target = menuItems.find((m) => m.id === MOBILE_TAB_ORDER[nextIdx]);
    if (target) handleItemClick(target);
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
          <div style={{ padding: '0 16px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.jpeg" alt="FlipStar" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={T.priGradient ? {
              fontSize: 16, fontWeight: 900,
              background: T.priGradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            } : {
              fontSize: 16, fontWeight: 900, color: T.pri,
            }}>FlipStar</span>
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
              const isBell = item.id === 'notifications';
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
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {isBell && unreadNotifCount > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: -5,
                        right: -6,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        boxSizing: 'border-box',
                        border: '1.5px solid #fff',
                        lineHeight: 1,
                      }}>
                        {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                      </div>
                    )}
                  </div>
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
              {/* Profile image + name */}
              <button
                onClick={onShowProfile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 10,
                  marginBottom: 8,
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {user.profile_photo ? (
                  <img
                    src={user.profile_photo.startsWith('http') ? user.profile_photo : `${config.API_BASE_URL.replace('/api', '')}${user.profile_photo}`}
                    alt={user.username}
                    style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: T.pri + '30',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    👤
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    @{user.username}
                  </div>
                </div>
              </button>
              {/* Logout */}
              <button
                onClick={onLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: T.sub,
                  cursor: 'pointer',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={18} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </aside>
      )}


      {/* 3. Main Content Area */}
      <main
        className="appshell-main"
        onTouchStart={handleMainTouchStart}
        onTouchEnd={handleMainTouchEnd}
        style={{
          flex: 1,
          position: 'relative',
          height: isMobile ? '100dvh' : '100%',
          overflowY: 'auto',
          paddingBottom: isMobile ? 70 : 0,
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch',
          // Disable browser's native pull-to-refresh so our custom one can run.
          overscrollBehaviorY: 'contain',
        }}
      >
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 68,
            background: T.cardBg === '#fff' || !T.cardBg
              ? 'rgba(255,255,255,0.92)'
              : 'rgba(30,30,30,0.92)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            paddingBottom: 4,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          }}
        >
          <style>{`
            .mob-nav-btn { transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1); }
            .mob-nav-btn:active { transform: scale(0.82) !important; }
          `}</style>
          {[
            { item: menuItems[0], label: 'Home'    },
            { item: menuItems[1], label: 'Reels'   },
            { item: menuItems[5], label: 'New',  isCreate: true },
            { item: menuItems[4], label: 'Messages'},
            { item: menuItems[6], label: 'Profile' },
          ].map(({ item, label, isCreate }) => {
            const Icon = item.icon;
            let isActive = activeTab === item.id;
            if (item.id === 'home' && (activeTab === 'foryou' || activeTab === 'feed' || activeTab === 'home')) isActive = true;
            if (item.id === 'reels' && activeTab === 'reels') isActive = true;
            const isBell = item.id === 'notifications';

            if (isCreate) return (
              <button
                key={item.id}
                className="mob-nav-btn"
                onClick={() => handleItemClick(item)}
                style={{
                  background: T.priGradient || T.pri,
                  border: 'none',
                  borderRadius: '50%',
                  width: 52, height: 52,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 20px ${T.pri}60`,
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginBottom: 8,
                }}
              >
                <Icon size={26} strokeWidth={2.2} color="#fff" />
              </button>
            );

            return (
              <button
                key={item.id}
                className="mob-nav-btn"
                onClick={() => handleItemClick(item)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  padding: '4px 10px',
                  position: 'relative',
                  minWidth: 52,
                }}
              >
                {/* Active top indicator */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: isActive ? 20 : 0,
                  height: 3,
                  borderRadius: 2,
                  background: T.priGradient || T.pri,
                  transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }} />

                {/* Icon with glow bg when active */}
                <div style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36,
                  borderRadius: 12,
                  background: isActive ? T.pri + '18' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? T.pri : T.sub}
                    fill={isActive && (item.id === 'home') ? T.pri + '40' : 'none'}
                  />
                  {isBell && unreadNotifCount > 0 && (
                    <div style={{
                      position: 'absolute', top: 2, right: 2,
                      minWidth: 14, height: 14, borderRadius: 7,
                      background: '#EF4444', color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 2px', boxSizing: 'border-box',
                      border: '1.5px solid #fff', lineHeight: 1,
                    }}>
                      {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.pri : T.sub,
                  transition: 'color 0.2s',
                  lineHeight: 1,
                }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}
