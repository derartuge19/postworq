import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, UserPlus, Trophy, Bell, Check, AtSign, Reply, RefreshCw } from "lucide-react";
import api from "../api";
import config from "../config.js";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${config.API_BASE_URL.replace('/api', '')}${url}`;
};

function groupNotifications(notifs) {
  const groups = [];
  const seen = {};
  for (const n of notifs) {
    const key = `${n.type}__${n.reel_id || ''}`;
    const ONE_HOUR = 60 * 60 * 1000;
    if (seen[key] && n.user && (n.timestamp - seen[key].timestamp) < ONE_HOUR) {
      seen[key].extras = (seen[key].extras || 0) + 1;
    } else {
      const entry = { ...n, extras: 0 };
      seen[key] = entry;
      groups.push(entry);
    }
  }
  return groups;
}

export function NotificationsPage({ user, onUserClick, onBack, onShowPostPage, onLogout, onShowProfile, onShowSettings, onShowCampaigns, onShowVideoDetail }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const pollingRef = useRef(null);

  const transform = (data) => data.map(notif => ({
    id: notif.id,
    type: notif.notification_type || notif.type || 'system',
    message: notif.message,
    read: notif.read !== undefined ? notif.read : (notif.is_read || false),
    timestamp: new Date(notif.timestamp || notif.created_at),
    user: notif.sender ? {
      id: notif.sender.id,
      username: notif.sender.username,
      profile_photo: notif.sender.profile_photo,
    } : null,
    post: notif.reel ? {
      id: notif.reel.id,
      thumbnail: notif.reel.image || notif.reel.media,
    } : null,
    comment: notif.comment ? (typeof notif.comment === 'string' ? notif.comment : notif.comment.text) : null,
    reel_id: notif.reel_id || notif.reel?.id,
    campaign_id: notif.campaign_id,
  }));

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    try {
      if (!silent) setLoading(true); else setRefreshing(true);
      const data = await api.getUserNotifications();
      setNotifications(transform(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchNotifications(false);
    // Auto-mark all read after 2s of viewing
    const markTimer = setTimeout(() => {
      api.markAllNotificationsRead().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, 2000);
    // Poll every 20s for new notifications
    pollingRef.current = setInterval(() => fetchNotifications(true), 20000);
    return () => {
      clearTimeout(markTimer);
      clearInterval(pollingRef.current);
    };
  }, [user, fetchNotifications]);

  const handleMarkAllRead = () => {
    api.markAllNotificationsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) {
      api.markNotificationRead(notif.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    if (notif.type === 'follow') {
      if (notif.user?.id && onUserClick) onUserClick(notif.user.id);
    } else if (notif.reel_id && onShowVideoDetail) {
      onShowVideoDetail(notif.reel_id);
    } else if (notif.campaign_id && onShowCampaigns) {
      onShowCampaigns();
    }
  };

  const getIcon = (type) => {
    const s = { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
    switch (type) {
      case 'like':    return <div style={{ ...s, background: '#FEE2E2' }}><Heart size={18} color="#EF4444" fill="#EF4444" /></div>;
      case 'comment': return <div style={{ ...s, background: '#DBEAFE' }}><MessageCircle size={18} color="#3B82F6" /></div>;
      case 'follow':  return <div style={{ ...s, background: '#D1FAE5' }}><UserPlus size={18} color="#10B981" /></div>;
      case 'mention': return <div style={{ ...s, background: '#EDE9FE' }}><AtSign size={18} color="#7C3AED" /></div>;
      case 'reply':   return <div style={{ ...s, background: '#FEF3C7' }}><Reply size={18} color="#D97706" /></div>;
      case 'campaign':return <div style={{ ...s, background: '#FEF9C3' }}><Trophy size={18} color="#CA8A04" /></div>;
      default:        return <div style={{ ...s, background: T.bg }}><Bell size={18} color={T.pri} /></div>;
    }
  };

  const FILTERS = [
    { id: 'all',      label: 'All',       Icon: Bell },
    { id: 'like',     label: 'Likes',     Icon: Heart },
    { id: 'comment',  label: 'Comments',  Icon: MessageCircle },
    { id: 'follow',   label: 'Follows',   Icon: UserPlus },
    { id: 'mention',  label: 'Mentions',  Icon: AtSign },
    { id: 'campaign', label: 'Campaigns', Icon: Trophy },
  ];

  const filtered = groupNotifications(
    notifications.filter(n => activeFilter === 'all' || n.type === activeFilter)
  );
  const hasUnread = notifications.some(n => !n.read);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg }}>
      <style>{`
        @keyframes notif-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes notif-slide-in { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .notif-item { animation: notif-slide-in 0.2s ease; }
        .notif-item:hover { background: ${T.bg} !important; }
      `}</style>

      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.cardBg || '#fff',
        borderBottom: `1px solid ${T.border}`,
        padding: '16px 20px 0',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Bell size={22} color={T.pri} strokeWidth={2.5} />
                {hasUnread && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#EF4444', border: '1.5px solid #fff',
                    animation: 'notif-pulse 2s infinite',
                  }} />
                )}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: T.txt, margin: 0 }}>
                Notifications
              </h1>
              {refreshing && <RefreshCw size={14} color={T.sub} style={{ animation: 'spin 1s linear infinite' }} />}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasUnread && (
                <button onClick={handleMarkAllRead} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', background: 'none',
                  border: `1px solid ${T.border}`, borderRadius: 20,
                  color: T.pri, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  <Check size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => fetchNotifications(false)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: 'none',
                border: `1px solid ${T.border}`, borderRadius: 20,
                color: T.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 1 }}>
            {FILTERS.map(({ id, label, Icon }) => {
              const isActive = activeFilter === id;
              const typeCount = id === 'all' ? notifications.filter(n => !n.read).length
                : notifications.filter(n => n.type === id && !n.read).length;
              return (
                <button key={id} onClick={() => setActiveFilter(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', flexShrink: 0,
                  border: 'none', borderBottom: isActive ? `2px solid ${T.pri}` : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.pri : T.sub,
                  transition: 'all 0.15s', position: 'relative',
                }}>
                  <Icon size={14} />
                  {label}
                  {typeCount > 0 && (
                    <span style={{
                      background: '#EF4444', color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 8,
                      padding: '1px 4px', lineHeight: 1.4,
                    }}>{typeCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 0 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[80, 65, 72, 58, 70].map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ width: `${w}%`, height: 13, background: '#f0f0f0', borderRadius: 6 }} />
                  <div style={{ width: '35%', height: 10, background: '#f5f5f5', borderRadius: 5 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Bell size={32} color={T.sub} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 6 }}>
              {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
            </div>
            <div style={{ fontSize: 13, color: T.sub }}>
              {activeFilter === 'all'
                ? "When someone likes, comments, or follows you, it'll show up here."
                : `Switch to All to see everything.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className="notif-item"
                onClick={() => handleNotifClick(notif)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  background: notif.read ? 'transparent' : (T.pri + '0a'),
                  borderLeft: notif.read ? '3px solid transparent' : `3px solid ${T.pri}`,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
              >
                {/* Avatar + type badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {notif.user?.profile_photo ? (
                    <img src={mediaUrl(notif.user.profile_photo)} alt={notif.user.username}
                      style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : notif.user ? (
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: T.pri + '25', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20,
                    }}>👤</div>
                  ) : (
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{getIcon(notif.type)}</div>
                  )}
                  {/* Type badge on avatar */}
                  {notif.user && (
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 20, height: 20, borderRadius: '50%',
                      border: '2px solid #fff', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {getIcon(notif.type)}
                    </div>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: T.txt, lineHeight: 1.4 }}>
                    {notif.user && (
                      <span style={{ fontWeight: 700 }}>{notif.user.username} </span>
                    )}
                    <span style={{ color: notif.read ? T.sub : T.txt }}>
                      {notif.message}
                      {notif.extras > 0 && (
                        <span style={{ color: T.sub }}> and {notif.extras} other{notif.extras > 1 ? 's' : ''}</span>
                      )}
                    </span>
                  </div>
                  {notif.comment && (
                    <div style={{
                      fontSize: 12, color: T.sub, marginTop: 3,
                      fontStyle: 'italic', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>"{notif.comment}"</div>
                  )}
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 3, fontWeight: notif.read ? 400 : 600 }}>
                    {getRelativeTime(notif.timestamp)}
                  </div>
                </div>

                {/* Right side: thumbnail + unread dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {notif.post?.thumbnail && (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: T.border }}>
                      <img src={mediaUrl(notif.post.thumbnail)} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  {!notif.read && (
                    <div style={{
                      width: 9, height: 9, borderRadius: '50%',
                      background: '#EF4444', flexShrink: 0,
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
