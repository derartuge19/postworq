import { useState } from "react";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4" };

export function Sidebar({ activeTab, onTabChange, user, onLogout, onRequireAuth, onShowPostPage }) {
  const [showSettings, setShowSettings] = useState(false);

  const menuItems = [
    { id: "feed", icon: "🏠", label: "For You", desc: "Discover content" },
    { id: "following", icon: "👥", label: "Following", desc: "Your creators" },
    { id: "explore", icon: "🔍", label: "Explore", desc: "Trending now" },
    { id: "likes", icon: "❤️", label: "Likes", desc: "Your favorites" },
    { id: "bookmarks", icon: "🔖", label: "Bookmarks", desc: "Saved videos" },
  ];

  const settingsItems = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "privacy", icon: "🔒", label: "Privacy & Safety" },
    { id: "settings", icon: "⚙️", label: "Settings" },
    { id: "help", icon: "❓", label: "Help & Feedback" },
  ];

  return (
    <div style={{
      width: 280,
      background: "#fff",
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflowY: "auto",
      position: "fixed",
      left: 0,
      top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: T.pri }}>⭐</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.txt, marginTop: 4 }}>Selfie Star</div>
      </div>

      {/* Main Menu */}
      <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: activeTab === item.id ? T.pri + "15" : "transparent",
              border: "none",
              borderLeft: activeTab === item.id ? `4px solid ${T.pri}` : "4px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all .2s",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 24 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.txt }}>{item.label}</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Upload Button */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
        <button 
          onClick={() => {
            if (!user) {
              onRequireAuth();
            } else {
              onShowPostPage();
            }
          }}
          style={{
            width: "100%",
            padding: "12px",
            background: `linear-gradient(135deg, ${T.pri}, #B8821E)`,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 12,
          }}>
          📹 Post
        </button>
      </div>

      {/* User Profile */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: T.pri + "30",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.txt }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: T.sub }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Settings Menu */}
      <div style={{ padding: "12px 0", borderTop: `1px solid ${T.border}` }}>
        {settingsItems.map(item => (
          <button
            key={item.id}
            onClick={() => {}}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              color: T.txt,
              transition: "background .2s",
            }}
            onMouseEnter={(e) => e.target.style.background = T.bg}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}` }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "10px",
            background: "#FEE2E2",
            border: "none",
            borderRadius: 6,
            color: "#EF4444",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
