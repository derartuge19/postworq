import { useState, useEffect } from 'react';
import { Bell, Send, Users, CheckCircle } from 'lucide-react';
import api from '../../api';
import { AlertModal } from '../components/AlertModal';

export function NotificationsPage({ theme }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.request('/admin/notifications/');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.request(`/admin/notifications/${notificationId}/read/`, { method: 'POST' });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleSendNotification = async (title, message, userIds) => {
    try {
      await api.request('/admin/notifications/send/', {
        method: 'POST',
        body: JSON.stringify({ title, message, user_ids: userIds })
      });
      setAlertModal({ isOpen: true, title: 'Success', message: 'Notification sent successfully!', type: 'success' });
      setShowSendModal(false);
    } catch (error) {
      console.error('Failed to send notification:', error);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to send notification', type: 'error' });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return theme.red;
      case 'high': return theme.orange;
      case 'medium': return theme.blue;
      case 'low': return theme.sub;
      default: return theme.sub;
    }
  };

  return (
    <div style={{ marginLeft: 240, padding: '20px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: theme.txt,
            marginBottom: 8,
          }}>
            Notifications
          </h1>
          <p style={{
            margin: 0,
            fontSize: 16,
            color: theme.sub,
          }}>
            Manage platform notifications and alerts
          </p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          style={{
            padding: '12px 24px',
            background: theme.pri,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Send size={16} />
          Send Notification
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: theme.sub }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: theme.card,
          borderRadius: 12,
          padding: 60,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
        }}>
          <Bell size={48} color={theme.sub} style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.txt, marginBottom: 8 }}>
            No unread notifications
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: theme.sub }}>
            You're all caught up!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notifications.map(notification => {
            const priorityColor = getPriorityColor(notification.priority);
            
            return (
              <div
                key={notification.id}
                style={{
                  background: theme.card,
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid ${theme.border}`,
                  borderLeft: `4px solid ${priorityColor}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: priorityColor + '20',
                        color: priorityColor,
                      }}>
                        {notification.priority}
                      </span>
                      <span style={{ fontSize: 13, color: theme.sub }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      color: theme.txt,
                      marginBottom: 8,
                    }}>
                      {notification.title}
                    </h3>
                    
                    <p style={{
                      margin: 0,
                      fontSize: 14,
                      color: theme.sub,
                      lineHeight: 1.6,
                    }}>
                      {notification.message}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    style={{
                      padding: '8px 16px',
                      background: theme.green + '15',
                      border: 'none',
                      borderRadius: 6,
                      color: theme.green,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle size={14} />
                    Mark Read
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendModal && (
        <SendNotificationModal
          theme={theme}
          onClose={() => setShowSendModal(false)}
          onSend={handleSendNotification}
        />
      )}
    </div>
  );
}

function SendNotificationModal({ theme, onClose, onSend }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setAlertModal({ isOpen: true, title: 'Validation Error', message: 'Please enter title and message', type: 'warning' });
      return;
    }
    onSend(title, message, sendToAll ? [] : []);
  };

  return (
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
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.card,
          borderRadius: 12,
          padding: 32,
          width: '100%',
          maxWidth: 600,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.txt, marginBottom: 24 }}>
          Send Notification
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: theme.txt,
              marginBottom: 8,
            }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: theme.txt,
              marginBottom: 8,
            }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message"
              required
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
          
          <div style={{
            marginBottom: 24,
            padding: 16,
            background: theme.bg,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.txt, marginBottom: 4 }}>
                Send to all users
              </div>
              <div style={{ fontSize: 13, color: theme.sub }}>
                Notification will be sent to all active users
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSendToAll(!sendToAll)}
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                background: sendToAll ? theme.pri : theme.border,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 2,
                left: sendToAll ? 22 : 2,
                transition: 'all 0.2s',
              }} />
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: theme.txt,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: theme.pri,
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
