import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuthToken, removeAuthToken } from '../services/authService';
import { checkAuthStatus } from '../services/apiService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTelegramAuth, setHasTelegramAuth] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = getAuthToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await checkAuthStatus();
        setCurrentUser(response.data);
        setIsAuthenticated(true);
        setHasTelegramAuth(!!response.data.telegram_session);
      } catch (error) {
        console.error("Auth verification failed:", error);
        removeAuthToken();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    hasTelegramAuth,
    setHasTelegramAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 