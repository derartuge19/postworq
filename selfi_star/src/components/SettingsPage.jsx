import { useState, useEffect } from "react";
import { X, User, Bell, Lock, Globe, HelpCircle, LogOut, ChevronRight, Moon, Sun } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function SettingsPage({ user, onClose, onLogout }) {
  const { darkMode, toggleDarkMode, colors: T } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState("account");
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : {
      likes: true,
      comments: true,
      follows: true,
      messages: true,
    };
  });
  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem('privacy');
    return saved ? JSON.parse(saved) : {
      privateAccount: false,
      showActivity: true,
      allowMessages: true,
    };
  });
  const [saving, setSaving] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacy', JSON.stringify(privacy));
  }, [privacy]);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Settings saved successfully!',
        type: 'success',
        onConfirm: null
      });
    }, 500);
  };

  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  const sections = [
    { id: "account", icon: User, label: t('account') },
    { id: "notifications", icon: Bell, label: t('notificationsSettings') },
    { id: "privacy", icon: Lock, label: t('privacy') },
    { id: "appearance", icon: darkMode ? Moon : Sun, label: t('appearance') },
    { id: "language", icon: Globe, label: t('language') },
    { id: "help", icon: HelpCircle, label: t('help') },
  ];

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'New passwords do not match!',
        type: 'error',
        onConfirm: null
      });
      return;
    }
    if (password.new.length < 8) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Password must be at least 8 characters!',
        type: 'error',
        onConfirm: null
      });
      return;
    }
    try {
      // API call would go here
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Password changed successfully!',
        type: 'success',
        onConfirm: null
      });
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to change password',
        type: 'error',
        onConfirm: null
      });
    }
  };

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone!',
      type: 'warning',
      onConfirm: () => {
        setModal({
          isOpen: true,
          title: 'Final Confirmation',
          message: 'This will permanently delete all your data. Are you absolutely sure?',
          type: 'warning',
          onConfirm: () => {
            // API call would go here
            setModal({
              isOpen: true,
              title: 'Account Deleted',
              message: 'Account deletion initiated. You will be logged out.',
              type: 'info',
              onConfirm: () => onLogout()
            });
          }
        });
      }
    });
  };

  const handleDownloadData = () => {
    setModal({
      isOpen: true,
      title: 'Download Initiated',
      message: 'Your data download has been initiated. You will receive an email with a download link.',
      type: 'info',
      onConfirm: null
    });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 4000,
    }}
    onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 20,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div style={{
          width: 280,
          background: T.bg,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            padding: "20px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.txt }}>Settings</div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                color: T.txt,
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    border: "none",
                    background: isActive ? "#fff" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: isActive ? T.pri : T.txt,
                    fontWeight: isActive ? 600 : 500,
                    borderLeft: isActive ? `3px solid ${T.pri}` : "3px solid transparent",
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
                  <ChevronRight size={16} style={{ opacity: 0.5 }} />
                </button>
              );
            })}
          </div>

          <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#EF4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {activeSection === "account" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Account Settings</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Manage your account information</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Basic Info */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>Basic Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8, display: "block" }}>
                        Username
                      </label>
                      <input
                        type="text"
                        value={user?.username || ""}
                        disabled
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: `1px solid ${T.border}`,
                          borderRadius: 8,
                          fontSize: 14,
                          background: T.bg,
                          color: T.sub,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8, display: "block" }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: `1px solid ${T.border}`,
                          borderRadius: 8,
                          fontSize: 14,
                          background: T.bg,
                          color: T.sub,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Change */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>Change Password</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={password.current}
                      onChange={(e) => setPassword({...password, current: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <input
                      type="password"
                      placeholder="New Password (min 8 characters)"
                      value={password.new}
                      onChange={(e) => setPassword({...password, new: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={password.confirm}
                      onChange={(e) => setPassword({...password, confirm: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                    />
                    <button
                      onClick={handlePasswordChange}
                      style={{
                        padding: "12px 24px",
                        background: T.pri,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>Data Management</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button
                      onClick={handleDownloadData}
                      style={{
                        padding: "12px 20px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        color: T.txt,
                      }}
                    >
                      📥 Download Your Data
                    </button>
                    <p style={{ fontSize: 12, color: T.sub, marginTop: -8 }}>
                      Download a copy of all your posts, comments, and profile data
                    </p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div style={{
                  padding: 20,
                  background: "#FEE2E2",
                  borderRadius: 12,
                  border: "2px solid #EF4444",
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#DC2626", marginBottom: 8 }}>Danger Zone</h3>
                  <p style={{ fontSize: 13, color: "#991B1B", marginBottom: 16 }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: "12px 24px",
                      background: "#DC2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Notifications</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Manage your notification preferences</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                      <div style={{ fontSize: 13, color: T.sub }}>
                        Receive notifications for {key}
                      </div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          setNotifications({ ...notifications, [key]: newValue });
                          
                          // Save to backend
                          try {
                            await api.updateNotificationSettings({ [key]: newValue });
                            
                            // Show notification when enabled
                            if (newValue) {
                              setModal({
                                isOpen: true,
                                title: 'Notification Enabled',
                                message: `You will now receive notifications for ${key}`,
                                type: 'success',
                                onConfirm: null
                              });
                            }
                          } catch (error) {
                            console.error('Failed to update notification settings:', error);
                          }
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: value ? T.pri : "#ccc",
                        borderRadius: 28,
                        transition: "0.3s",
                      }}>
                        <span style={{
                          position: "absolute",
                          content: "",
                          height: 20,
                          width: 20,
                          left: value ? 24 : 4,
                          bottom: 4,
                          background: "#fff",
                          borderRadius: "50%",
                          transition: "0.3s",
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Privacy & Security</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Control your privacy settings</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(privacy).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                      <div style={{ fontSize: 13, color: T.sub }}>
                        {key === 'privateAccount' && 'Only approved followers can see your posts'}
                        {key === 'showActivity' && 'Show your activity status to others'}
                        {key === 'allowMessages' && 'Allow others to send you messages'}
                      </div>
                    </div>
                    <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={async (e) => {
                          const newValue = e.target.checked;
                          setPrivacy({ ...privacy, [key]: newValue });
                          
                          // Save to backend
                          try {
                            await api.updatePrivacySettings({ [key]: newValue });
                            
                            // Show confirmation modal
                            setModal({
                              isOpen: true,
                              title: 'Privacy Updated',
                              message: `Privacy setting "${key.replace(/([A-Z])/g, ' $1').trim()}" has been ${newValue ? 'enabled' : 'disabled'}`,
                              type: 'success',
                              onConfirm: null
                            });
                          } catch (error) {
                            console.error('Failed to update privacy settings:', error);
                            // Revert on error
                            setPrivacy({ ...privacy, [key]: !newValue });
                          }
                        }}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: value ? T.pri : "#ccc",
                        borderRadius: 28,
                        transition: "0.3s",
                      }}>
                        <span style={{
                          position: "absolute",
                          content: "",
                          height: 20,
                          width: 20,
                          left: value ? 24 : 4,
                          bottom: 4,
                          background: "#fff",
                          borderRadius: "50%",
                          transition: "0.3s",
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Appearance</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Customize how WorqPost looks</p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, background: T.bg, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {darkMode ? <Moon size={24} color={T.pri} /> : <Sun size={24} color={T.pri} />}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                      Dark Mode
                    </div>
                    <div style={{ fontSize: 13, color: T.sub }}>
                      {darkMode ? "Dark theme enabled" : "Light theme enabled"}
                    </div>
                  </div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={toggleDarkMode}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: darkMode ? T.pri : "#ccc",
                    borderRadius: 28,
                    transition: "0.3s",
                  }}>
                    <span style={{
                      position: "absolute",
                      content: "",
                      height: 20,
                      width: 20,
                      left: darkMode ? 24 : 4,
                      bottom: 4,
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "0.3s",
                    }} />
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeSection === "language" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Language</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Choose your preferred language</p>

              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  background: T.cardBg,
                  color: T.txt,
                  cursor: "pointer",
                }}
              >
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          )}

          {activeSection === "help" && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Help & Support</h2>
              <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Get help and support</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <button style={{
                  padding: "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Help Center</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Report a Problem</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Terms of Service</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Privacy Policy</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <div style={{ marginTop: 20, padding: 20, background: T.bg, borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 4 }}>Version</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>WorqPost 1.0.0</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Modal */}
      {modal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setModal({ ...modal, isOpen: false })}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.txt, 
              marginBottom: 12 
            }}>
              {modal.title}
            </h3>
            <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 20 }}>
              {modal.message}
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {modal.onConfirm && (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.txt,
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) {
                    modal.onConfirm();
                  }
                  setModal({ ...modal, isOpen: false });
                }}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.pri,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {modal.onConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
