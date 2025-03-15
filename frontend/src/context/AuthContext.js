// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { isAuthenticated, getCurrentUser, logout as authLogout } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);


//for debugging
const clearStorageOnStart = async () => {
    try {
      await AsyncStorage.removeItem('aqro_token');
      await AsyncStorage.removeItem('aqro_user');
      console.log('Local storage cleared on app start.');
    } catch (e) {
      console.error('Failed to clear local storage:', e);
    }
  };
  

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userType, setUserType] = useState(null);
  const [user, setUser] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    // clearStorageOnStart(); // Clears stored data every time the app starts
    checkAuthState();
  }, []);

  // Function to check and update authentication state
  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        const userData = await getCurrentUser();
        setUser(userData);
        setUserType(userData?.userType || 'customer');
        setUserToken('token-exists');
      } else {
        setUser(null);
        setUserType(null);
        setUserToken(null);
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      setUser(null);
      setUserType(null);
      setUserToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Log out function
  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
      setUserType(null);
      setUserToken(null);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userType,
        user,
        checkAuthState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};