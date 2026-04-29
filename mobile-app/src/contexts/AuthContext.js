import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('AuthContext: Loading user...');
      const hasToken = await api.hasToken();
      console.log('AuthContext: Has token?', hasToken);
      if (hasToken) {
        // Only fetch profile if user data is not already set
        if (!user) {
          console.log('AuthContext: Fetching profile...');
          const profileData = await api.getProfile();
          console.log('AuthContext: Profile data:', profileData);
          setUser(profileData.user || profileData);
        } else {
          console.log('AuthContext: User already set, skipping profile fetch');
        }
      } else {
        console.log('AuthContext: No token found, user not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Error loading user:', error);
      console.error('AuthContext: Error details:', error.message, error.stack);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('AuthContext: Loading complete, user:', !!user, 'loading:', false);
    }
  };

  const login = async (username, password) => {
    const data = await api.login(username, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (username, email, password, firstName, lastName) => {
    const data = await api.register(username, email, password, firstName, lastName);
    if (data.token) {
      await api.setAuthToken(data.token);
      if (data.user) {
        setUser(data.user);
      }
    }
    return data;
  };

  const logout = async () => {
    await api.clearAuth();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

