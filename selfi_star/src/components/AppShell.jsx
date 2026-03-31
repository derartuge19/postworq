import { TikTokLayout } from "./TikTokLayout";

export function AppShell({ user, onLogout, onRequireAuth, onShowPostPage }) {
  return <TikTokLayout user={user} onLogout={onLogout} onRequireAuth={onRequireAuth} onShowPostPage={onShowPostPage} />;
}
