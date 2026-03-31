import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Apply dark mode to body
    if (darkMode) {
      document.body.style.background = '#0C1A12';
      document.body.style.color = '#FAFAF7';
    } else {
      document.body.style.background = '#fff';
      document.body.style.color = '#1C1917';
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const theme = {
    darkMode,
    toggleDarkMode,
    colors: darkMode ? {
      pri: "#DA9B2A",
      txt: "#FAFAF7",
      sub: "#A8A29E",
      bg: "#1C1917",
      dark: "#0C1A12",
      border: "#292524",
      cardBg: "#292524",
    } : {
      pri: "#DA9B2A",
      txt: "#1C1917",
      sub: "#78716C",
      bg: "#FAFAF7",
      dark: "#0C1A12",
      border: "#E7E5E4",
      cardBg: "#fff",
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
