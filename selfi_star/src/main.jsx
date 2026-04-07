import React from 'react'
import ReactDOM from 'react-dom/client'
import WerqRoot from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

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

// Remove the inline skeleton overlay after React has painted its first frame.
// Using requestAnimationFrame × 2 ensures the browser has committed the paint
// before we fade out the skeleton — preventing any flash of unstyled content.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const skeleton = document.getElementById('app-skeleton');
    if (skeleton) {
      skeleton.style.transition = 'opacity 0.2s ease';
      skeleton.style.opacity = '0';
      setTimeout(() => skeleton.remove(), 220);
    }
  });
});
