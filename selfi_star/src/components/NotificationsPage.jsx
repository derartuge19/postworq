import { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, Trophy, Bell, ArrowLeft } from "lucide-react";
import api from "../api";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ModernSidebar } from "./ModernSidebar";

export function NotificationsPage({ user, onUserClick, onBack, onShowPostPage, onLogout, onShowProfile, onShowSettings, onShowCampaigns }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getUserNotifications();
      
      // Transform backend data to match component structure
      const transformedNotifications = data.map(notif => ({
        id: notif.id,
        type: notif.type || 'campaign',
        message: notif.message,
        notification_type: notif.notification_type,
        read: notif.read,
        timestamp: new Date(notif.timestamp),
        campaign_id: notif.campaign_id,
      }));
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={20} color="#ED4956" fill="#ED4956" />;
      case "comment":
        return <MessageCircle size={20} color={T.pri} />;
      case "follow":
        return <UserPlus size={20} color={T.pri} />;
      case "campaign":
        return <Trophy size={20} color="#FFD700" />;
      default:
        return <Bell size={20} color={T.pri} />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === "all") return true;
    return notif.type === activeFilter;
  });

  const handleTabChange = (tab) => {
    // Navigate to different pages based on tab
    if (tab === 'home' || tab === 'foryou') {
      onBack(); // Go back to home feed
    } else if (tab === 'search') {
      onBack(); // Will need to handle search separately
    } else if (tab === 'profile') {
      onShowProfile();
    } else if (tab === 'settings') {
      onShowSettings();
    } else if (tab === 'campaigns') {
      onShowCampaigns();
    } else if (tab === 'post') {
      onShowPostPage();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg }}>
      {/* Sidebar */}
      <ModernSidebar
        user={user}
        activeTab="notifications"
        onTabChange={handleTabChange}
        onShowPostPage={onShowPostPage}
        onLogout={onLogout}
        onShowProfile={onShowProfile}
        onShowSettings={onShowSettings}
        onShowCampaigns={onShowCampaigns}
        onShowNotifications={() => {}}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: 600,
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            marginBottom: 24,
          }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: T.txt,
              marginBottom: 8,
            }}>
              {t('notifications')}
            </h1>
            <p style={{
              fontSize: 14,
              color: T.sub,
            }}>
              Stay updated with your activity
            </p>
          </div>

          {/* Filters */}
          <div style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 8,
          }}>
            {[
              { id: "all", label: "All", icon: Bell },
              { id: "like", label: "Likes", icon: Heart },
              { id: "comment", label: "Comments", icon: MessageCircle },
              { id: "follow", label: "Follows", icon: UserPlus },
              { id: "campaign", label: "Campaigns", icon: Trophy },
            ].map(filter => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  style={{
                    padding: "8px 16px",
                    border: `1px solid ${isActive ? T.pri : T.border}`,
                    background: isActive ? T.pri + "20" : "transparent",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? T.pri : T.txt,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px', background: i < 2 ? '#fefbf3' : '#fff',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ width: `${70 - i * 8}%`, height: 13, background: '#f0f0f0', borderRadius: 6 }} />
                    <div style={{ width: '40%', height: 10, background: '#f5f5f5', borderRadius: 5 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
            }}>
              <Bell size={48} color={T.sub} style={{ marginBottom: 16 }} />
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                No notifications yet
              </div>
              <div style={{
                fontSize: 14,
                color: T.sub,
              }}>
                When you get notifications, they'll show up here
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}>
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                onClick={() => {
                  if (notif.user && onUserClick) {
                    onUserClick(notif.user.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 16,
                  background: notif.read ? "transparent" : T.cardBg,
                  borderRadius: 12,
                  cursor: notif.user ? "pointer" : "default",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (notif.user) {
                    e.currentTarget.style.background = T.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notif.read ? "transparent" : T.cardBg;
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                {notif.user ? (
                  notif.user.profile_photo ? (
                    <img
                      src={notif.user.profile_photo}
                      alt={notif.user.username}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: T.pri + "30",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}>
                      👤
                    </div>
                  )
                ) : (
                  getNotificationIcon(notif.type)
                )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: T.txt,
                  marginBottom: 4,
                }}>
                  {notif.user && (
                    <span style={{ fontWeight: 700 }}>
                      {notif.user.username}
                    </span>
                  )}{" "}
                  <span style={{ color: T.sub }}>
                    {notif.message}
                  </span>
                </div>
                {notif.comment && (
                  <div style={{
                    fontSize: 13,
                    color: T.txt,
                    marginBottom: 4,
                    fontStyle: "italic",
                  }}>
                    "{notif.comment}"
                  </div>
                )}
                <div style={{
                  fontSize: 12,
                  color: T.sub,
                }}>
                  {getRelativeTime(notif.timestamp)}
                </div>
                </div>

                {/* Post Thumbnail */}
                {notif.post && (
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: T.border,
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {notif.post.thumbnail && (
                    <img
                      src={notif.post.thumbnail}
                      alt="Post"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                )}

                {/* Unread Indicator */}
                {!notif.read && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: T.pri,
                  flexShrink: 0,
                  marginTop: 6,
                }}></div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
