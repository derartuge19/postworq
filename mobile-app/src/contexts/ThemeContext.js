import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await SecureStore.getItemAsync('isDarkMode');
      if (saved) setIsDarkMode(saved === 'true');
    } catch (e) {}
  };

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await SecureStore.setItemAsync('isDarkMode', String(next));
  };

  const colors = {
    bg: isDarkMode ? '#0A0A0A' : '#F5F5F4',
    card: isDarkMode ? '#171717' : '#FFFFFF',
    text: isDarkMode ? '#F5F5F5' : '#1C1917',
    sub: isDarkMode ? '#A1A1AA' : '#78716C',
    border: isDarkMode ? '#262626' : '#E7E5E4',
    pri: '#DA9B2A',
    danger: '#EF4444',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
