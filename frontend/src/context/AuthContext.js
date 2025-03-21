import React, { createContext, useState, useEffect, useContext } from 'react';
import { isAuthenticated, getCurrentUser, logout as authLogout } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiUrl } from '../services/apiConfig';

const AuthContext = createContext(null);

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
    clearStorageOnStart();
    checkAuthState();
  }, []);

  // Function to check and update authentication state
  const checkAuthState = async () => {
    setIsLoading(true);
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // First, try to get the user from AsyncStorage for immediate UI update
        const storedUserData = await AsyncStorage.getItem('aqro_user');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUser(parsedUserData);
          setUserType(parsedUserData?.userType || 'customer');
          setUserToken('token-exists');
        }
        
        // Then, fetch fresh data from the server including the profile picture
        try {
          const token = await AsyncStorage.getItem('aqro_token');
          const response = await axios.get(
            `${getApiUrl('/users/profile')}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data) {
            // Update the user data with the fresh data from the server
            setUser(response.data);
            setUserType(response.data?.userType || 'customer');
            // Save the fresh data to AsyncStorage
            await AsyncStorage.setItem('aqro_user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('Error fetching fresh user data:', error);
        }
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

  const updateUserInfo = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('aqro_user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to update user info:', e);
    }
  };

  // Log out function
  const logout = async () => {
    try {
      await authLogout();
      // Clear local storage
      await AsyncStorage.removeItem('aqro_user');
      await AsyncStorage.removeItem('aqro_token');
      
      // Reset state
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
        updateUserInfo,
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