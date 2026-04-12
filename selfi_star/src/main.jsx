import React from 'react'
import ReactDOM from 'react-dom/client'
import WerqRoot from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

// When Vite deploys a new build, old chunk filenames (content-hashed) no longer exist.
// Browsers with cached HTML will try to import old chunk URLs → 404.
// Reload once to pick up the fresh HTML with new chunk references.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = '__vite_reload__';
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <WerqRoot />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// Skeleton removal is handled by TikTokLayout when content is ready.
// Fallback: remove after 12s max so it never stays forever (e.g. error paths).
setTimeout(() => {
  const skeleton = document.getElementById('app-skeleton');
  if (skeleton) {
    skeleton.style.transition = 'opacity 0.3s ease';
    skeleton.style.opacity = '0';
    setTimeout(() => skeleton.remove(), 320);
  }
}, 12000);
