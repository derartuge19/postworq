import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { FeedPage } from "./FeedPage";

const T = { bg:"#FAFAF7" };

export function MainLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: T.bg,
    }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div style={{
        marginLeft: 280,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <FeedPage tab={activeTab} />
      </div>
    </div>
  );
}
