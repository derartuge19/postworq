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
  unreadDmCount = 0,
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

  // All nav items (sidebar uses full list; mobile bottom uses subset)
  const menuItems = [
    { id: 'home',          icon: Home,         label: 'Home' },
    { id: 'reels',         icon: Film,         label: 'Discover' },
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
    { id: 'messages',      icon: MessageCircle, label: t('messages') },
    {
      id: 'create',
      icon: PlusSquare,
      label: t('create'),
      action: onShowPostPage,
    },
    { id: 'profile',  icon: User,    label: t('profile'), action: onShowProfile },
    {
      id: 'settings',
      icon: Settings,
      label: t('settings'),
      action: onShowSettings,
    },
  ];

  // Mobile bottom-bar: Home | Discover | [+] | Notifications | Profile
  // Matches the React Native AppNavigator tab order exactly.
  const MOBILE_BOTTOM_TABS = [
    { item: menuItems[0], label: 'Home',          iconName: 'home' },
    { item: menuItems[1], label: 'Discover',       iconName: 'discover' },
    { item: menuItems[5], label: '',               isCreate: true },
    { item: menuItems[3], label: 'Alerts',         iconName: 'bell',    badge: unreadNotifCount },
    { item: menuItems[6], label: 'Profile',        iconName: 'profile' },
  ];

  const handleItemClick = (item) => {
    // If tapping the already-active feed tab (no special action), scroll to top + refresh
    const feedTabs = ['home', 'reels', 'messages', 'following', 'bookmarks'];
    if (item.id === activeTab && feedTabs.includes(item.id) && !item.action) {
      window.dispatchEvent(new CustomEvent('tabReselected', { detail: { tab: item.id } }));
      return;
    }
    onTabChange?.(item.id);
    if (item.action) {
      item.action();
    }
  };

  // ─── Mobile: swipe left/right to switch bottom-nav tabs (TikTok-style) ──────
  const MOBILE_TAB_ORDER = ['home', 'reels', 'notifications', 'profile'];
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
              const isMsg = item.id === 'messages';
              const badgeCount = isBell ? unreadNotifCount : (isMsg ? unreadDmCount : 0);
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
                    {(isBell || isMsg) && badgeCount > 0 && (
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
                        {badgeCount > 99 ? '99+' : badgeCount}
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

      {/* 4. Mobile Bottom Navigation — matches React Native AppNavigator exactly */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 60,
            background: T.cardBg === '#fff' || !T.cardBg
              ? 'rgba(255,255,255,0.97)'
              : T.cardBg + 'f7',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            paddingBottom: 'env(safe-area-inset-bottom, 4px)',
            boxSizing: 'border-box',
            boxShadow: '0 -2px 16px rgba(0,0,0,0.07)',
          }}
        >
          <style>{`
            .mob-nav-btn {
              transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1),opacity 0.1s;
              -webkit-tap-highlight-color: transparent;
            }
            .mob-nav-btn:active { transform: scale(0.80) !important; opacity: 0.75; }
          `}</style>

          {MOBILE_BOTTOM_TABS.map(({ item, label, isCreate, badge }) => {
            const Icon = item.icon;
            let isActive = activeTab === item.id;
            if (item.id === 'home' && ['foryou','feed','home'].includes(activeTab)) isActive = true;
            if (item.id === 'reels' && activeTab === 'reels') isActive = true;
            if (item.id === 'notifications' && activeTab === 'notifications') isActive = true;

            /* ── Center CREATE button ── */
            if (isCreate) return (
              <button
                key="create"
                id="mob-nav-create"
                className="mob-nav-btn"
                onClick={() => handleItemClick(item)}
                style={{
                  background: T.priGradient
                    ? `linear-gradient(135deg, ${T.pri}, ${T.pri}cc)`
                    : T.pri,
                  border: 'none',
                  borderRadius: 16,
                  width: 48, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px ${T.pri}55`,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <PlusSquare size={22} strokeWidth={2.4} color="#fff" />
              </button>
            );

            /* ── Regular tab button ── */
            const badgeCount = badge ?? (item.id === 'messages' ? unreadDmCount : 0);
            return (
              <button
                key={item.id}
                id={`mob-nav-${item.id}`}
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
                  gap: 2,
                  padding: '6px 12px',
                  position: 'relative',
                  minWidth: 44,
                  flex: 1,
                }}
              >
                {/* Icon */}
                <div style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    color={isActive ? (T.pri || '#DA9B2A') : (T.sub || '#999')}
                  />
                  {badgeCount > 0 && (
                    <div style={{
                      position: 'absolute', top: -4, right: -6,
                      minWidth: 15, height: 15, borderRadius: 8,
                      background: '#EF4444', color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', boxSizing: 'border-box',
                      border: '1.5px solid #fff', lineHeight: 1,
                    }}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                {label ? (
                  <span style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? (T.pri || '#DA9B2A') : (T.sub || '#999'),
                    lineHeight: 1,
                  }}>{label}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}
