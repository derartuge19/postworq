import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync('isDarkMode_v2');
      if (saved) setIsDarkMode(saved === 'true');
    } catch (e) {}
  };

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await SecureStore.setItemAsync('isDarkMode_v2', String(next));
  };

  const colors = {
    bg: isDarkMode ? '#0D0D0D' : '#FAFAFA',
    card: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#1A1A1A',
    sub: isDarkMode ? '#C2994B' : '#78716C',
    border: isDarkMode ? '#262626' : '#E5E5E5',
    pri: '#E2B355',
    priGradient: 'linear-gradient(to bottom, #D4AF37 0%, #F9E08B 50%, #B8860B 100%)',
    danger: '#EF4444',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

