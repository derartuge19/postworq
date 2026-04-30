import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await api.getAuthToken();
      if (token) {
        // Fetch user profile data
        const userData = await api.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      const data = await api.login(identifier, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // Support both object form and legacy separate params
      const payload = typeof userData === 'object' ? userData : { username: userData };
      const { fullName, phone, password, first_name, last_name } = payload;
      
      // Use phone-based registration
      const data = await api.request('/auth/register-with-phone/', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          username: (fullName || '').toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
          password,
          first_name: first_name || (fullName || '').split(' ')[0],
          last_name: last_name || (fullName || '').split(' ').slice(1).join(' '),
          email: '',
          skip_otp: true,
        }),
      });
      if (data.token) await api.setAuthToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
