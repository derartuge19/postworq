import ReactDOM from 'react-dom/client'
import WerqRoot from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

// Remove skeleton immediately to prevent infinite loading
const skeleton = document.getElementById('app-skeleton');
if (skeleton) {
  skeleton.style.display = 'none';
}

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
  <ThemeProvider>
    <LanguageProvider>
      <WerqRoot />
    </LanguageProvider>
  </ThemeProvider>,
);
