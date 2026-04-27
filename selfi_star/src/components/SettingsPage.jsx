import { useState, useEffect } from "react";
import { X, User, Bell, Lock, Globe, HelpCircle, LogOut, ChevronRight, Moon, Sun, Wallet } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function SettingsPage({ user, onClose, onLogout, onShowWallet }) {
  const { darkMode, toggleDarkMode, colors: T } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState("account");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 393);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 393);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
        title: t('success'),
        message: t('settingsSaved'),
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
    { id: "wallet", icon: Wallet, label: 'Wallet', isExternal: true },
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
        title: t('error'),
        message: t('passwordMismatch'),
        type: 'error',
        onConfirm: null
      });
      return;
    }
    if (password.new.length < 8) {
      setModal({
        isOpen: true,
        title: t('error'),
        message: t('passwordTooShort'),
        type: 'error',
        onConfirm: null
      });
      return;
    }
    try {
      // API call would go here
      setModal({
        isOpen: true,
        title: t('success'),
        message: t('passwordChanged'),
        type: 'success',
        onConfirm: null
      });
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      setModal({
        isOpen: true,
        title: t('error'),
        message: t('passwordChangeFailed'),
        type: 'error',
        onConfirm: null
      });
    }
  };

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      title: t('deleteAccount'),
      message: t('deleteConfirm'),
      type: 'warning',
      onConfirm: () => {
        setModal({
          isOpen: true,
          title: t('finalConfirm'),
          message: t('deleteWarning'),
          type: 'warning',
          onConfirm: () => {
            // API call would go here
            setModal({
              isOpen: true,
              title: t('accountDeleted'),
              message: t('accountDeleting'),
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
      title: t('downloadInitiated'),
      message: t('downloadEmail'),
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
          width: isMobile ? "100%" : "100%",
          maxWidth: isMobile ? "100%" : 900,
          height: isMobile ? "100vh" : "auto",
          maxHeight: isMobile ? "100vh" : "90vh",
          background: T.cardBg,
          borderRadius: isMobile ? 0 : 20,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div style={{
          width: isSmallMobile ? 60 : (isMobile ? 80 : 280),
          background: T.bg,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}>
          <div style={{
            padding: isSmallMobile ? "12px 4px" : (isMobile ? "16px 8px" : "20px"),
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "space-between",
          }}>
            {!isMobile && <div style={{ fontSize: 20, fontWeight: 700, color: T.txt }}>{t('settings')}</div>}
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

          <div style={{ flex: 1, overflowY: "auto", padding: isSmallMobile ? "8px 0" : "12px 0" }}>
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.isExternal && section.id === 'wallet' && onShowWallet) {
                      onShowWallet();
                      return;
                    }
                    setActiveSection(section.id);
                  }}
                  style={{
                    width: "100%",
                    padding: isSmallMobile ? "8px 4px" : (isMobile ? "12px 8px" : "14px 20px"),
                    border: "none",
                    background: isActive ? T.cardBg : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isSmallMobile ? 2 : (isMobile ? 4 : 12),
                    color: isActive ? T.pri : T.txt,
                    fontWeight: isActive ? 600 : 500,
                    borderLeft: isActive ? `3px solid ${T.pri}` : "3px solid transparent",
                  }}
                >
                  <Icon size={isSmallMobile ? 18 : (isMobile ? 22 : 20)} />
                  {!isMobile && <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>}
                  {isMobile && <span style={{ fontSize: isSmallMobile ? 8 : 10, textAlign: "center", lineHeight: 1.2 }}>{section.label}</span>}
                  {!isMobile && <ChevronRight size={16} style={{ opacity: 0.5 }} />}
                </button>
              );
            })}
          </div>

          <div style={{ padding: isSmallMobile ? 6 : (isMobile ? 8 : 20), borderTop: `1px solid ${T.border}`, paddingBottom: isSmallMobile ? 12 : (isMobile ? 16 : 20) }}>
            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: isSmallMobile ? "8px 4px" : (isMobile ? "10px 8px" : "12px 16px"),
                background: "#EF4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: isSmallMobile ? 2 : (isMobile ? 4 : 8),
                fontSize: isSmallMobile ? 8 : (isMobile ? 10 : 14),
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              <LogOut size={isSmallMobile ? 14 : 18} />
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: isSmallMobile ? 16 : (isMobile ? 24 : 32) }}>
          {activeSection === "account" && (
            <div>
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('accountSettings')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('manageAccount')}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Basic Info */}
                <div>
                  <h3 style={{ fontSize: isSmallMobile ? 14 : 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>{t('basicInfo')}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: isSmallMobile ? 12 : 14, fontWeight: 600, color: T.txt, marginBottom: 8, display: "block" }}>
                        {t('username')}
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
                      <label style={{ fontSize: isSmallMobile ? 12 : 14, fontWeight: 600, color: T.txt, marginBottom: 8, display: "block" }}>
                        {t('email')}
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
                  <h3 style={{ fontSize: isSmallMobile ? 14 : 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>{t('changePassword')}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                      type="password"
                      placeholder={t('currentPassword')}
                      value={password.current}
                      onChange={(e) => setPassword({...password, current: e.target.value})}
                      style={{
                        width: "100%",
                        padding: isSmallMobile ? "10px 12px" : "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: isSmallMobile ? 12 : 14,
                      }}
                    />
                    <input
                      type="password"
                      placeholder={t('newPassword')}
                      value={password.new}
                      onChange={(e) => setPassword({...password, new: e.target.value})}
                      style={{
                        width: "100%",
                        padding: isSmallMobile ? "10px 12px" : "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: isSmallMobile ? 12 : 14,
                      }}
                    />
                    <input
                      type="password"
                      placeholder={t('confirmPassword')}
                      value={password.confirm}
                      onChange={(e) => setPassword({...password, confirm: e.target.value})}
                      style={{
                        width: "100%",
                        padding: isSmallMobile ? "10px 12px" : "12px 16px",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: isSmallMobile ? 12 : 14,
                      }}
                    />
                    <button
                      onClick={handlePasswordChange}
                      style={{
                        padding: isSmallMobile ? "10px 16px" : "12px 24px",
                        background: T.pri,
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontSize: isSmallMobile ? 12 : 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      {t('updatePassword')}
                    </button>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 style={{ fontSize: isSmallMobile ? 14 : 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>{t('dataManagement')}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <button
                      onClick={handleDownloadData}
                      style={{
                        padding: isSmallMobile ? "10px 16px" : "12px 20px",
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        fontSize: isSmallMobile ? 12 : 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        color: T.txt,
                      }}
                    >
                      📥 {t('downloadData')}
                    </button>
                    <p style={{ fontSize: isSmallMobile ? 10 : 12, color: T.sub, marginTop: -8 }}>
                      {t('downloadDataDesc')}
                    </p>
                  </div>
                </div>

                {/* Danger Zone */}
                <div style={{
                  padding: isSmallMobile ? 16 : 20,
                  background: "#FEE2E2",
                  borderRadius: 12,
                  border: "2px solid #EF4444",
                }}>
                  <h3 style={{ fontSize: isSmallMobile ? 14 : 16, fontWeight: 600, color: "#DC2626", marginBottom: 8 }}>{t('dangerZone')}</h3>
                  <p style={{ fontSize: isSmallMobile ? 11 : 13, color: "#991B1B", marginBottom: 16 }}>
                    {t('deleteWarning')}
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    style={{
                      padding: isSmallMobile ? "10px 16px" : "12px 24px",
                      background: "#DC2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: isSmallMobile ? 12 : 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {t('deleteAccount')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('notificationsSettings')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('manageNotifications')}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                        {t(key) || key.charAt(0).toUpperCase() + key.slice(1)}
                      </div>
                      <div style={{ fontSize: isSmallMobile ? 11 : 13, color: T.sub }}>
                        {t('receiveNotifications')} {t(key) || key}
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
                                title: t('notificationEnabled'),
                                message: `${t('willReceive')} ${t(key) || key}`,
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
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('privacy')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('controlPrivacy')}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {Object.entries(privacy).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                      <div style={{ fontSize: isSmallMobile ? 11 : 13, color: T.sub }}>
                        {key === 'privateAccount' && t('privateAccountDesc')}
                        {key === 'showActivity' && t('showActivityDesc')}
                        {key === 'allowMessages' && t('allowMessagesDesc')}
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
                              title: t('privacyUpdated'),
                              message: `${t('privacySettingChanged')} "${key.replace(/([A-Z])/g, ' $1').trim()}" ${t(newValue ? 'enabled' : 'disabled')}`,
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
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('appearance')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('customizeAppearance')}</p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, background: T.bg, borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {darkMode ? <Moon size={24} color={T.pri} /> : <Sun size={24} color={T.pri} />}
                  <div>
                    <div style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                      {t('darkMode')}
                    </div>
                    <div style={{ fontSize: isSmallMobile ? 11 : 13, color: T.sub }}>
                      {darkMode ? t('darkEnabled') : t('lightEnabled')}
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
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('language')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('chooseLanguage')}</p>

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
              <h2 style={{ fontSize: isSmallMobile ? 18 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>{t('help')}</h2>
              <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.sub, marginBottom: isSmallMobile ? 20 : 32 }}>{t('getHelp')}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <button style={{
                  padding: isSmallMobile ? "12px 16px" : "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt }}>{t('helpCenter')}</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: isSmallMobile ? "12px 16px" : "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt }}>{t('reportProblem')}</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: isSmallMobile ? "12px 16px" : "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt }}>{t('termsOfService')}</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <button style={{
                  padding: isSmallMobile ? "12px 16px" : "16px 20px",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt }}>{t('privacyPolicy')}</span>
                  <ChevronRight size={20} color={T.sub} />
                </button>

                <div style={{ marginTop: 20, padding: isSmallMobile ? 16 : 20, background: T.bg, borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: isSmallMobile ? 11 : 13, color: T.sub, marginBottom: 4 }}>{t('version')}</div>
                  <div style={{ fontSize: isSmallMobile ? 13 : 15, fontWeight: 600, color: T.txt }}>FlipStar 1.0.0</div>
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
              background: T.cardBg,
              borderRadius: 16,
              padding: isSmallMobile ? 16 : "24px",
              maxWidth: isSmallMobile ? 320 : 400,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: isSmallMobile ? 16 : 20, 
              fontWeight: 700, 
              color: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.txt, 
              marginBottom: 12 
            }}>
              {modal.title}
            </h3>
            <p style={{ fontSize: isSmallMobile ? 12 : 14, color: T.txt, lineHeight: 1.6, marginBottom: 20 }}>
              {modal.message}
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {modal.onConfirm && (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  style={{
                    padding: isSmallMobile ? "8px 16px" : "10px 20px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    background: T.cardBg,
                    cursor: "pointer",
                    fontSize: isSmallMobile ? 12 : 14,
                    fontWeight: 600,
                    color: T.txt,
                  }}
                >
                  {t('cancel')}
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
                  padding: isSmallMobile ? "8px 16px" : "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.pri,
                  cursor: "pointer",
                  fontSize: isSmallMobile ? 12 : 14,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {modal.onConfirm ? t('confirm') : t('ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
