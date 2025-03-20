import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - change this to match your backend URL
const API_URL = 'http://192.168.100.203:5000/api/auth';

// For local development using Expo on a physical device, 
// use your computer's IP address instead of localhost

// Update this function if testing in different environments
const getApiUrl = () => {
  // Use environment variable if available
  if (process.env.API_URL) {
    return `${process.env.API_URL}/api/auth`;
  }
  
  // Default development URL (modify this based on your network setup)
  return API_URL;
};

// Register user
// Update the register function in authService.js
export const register = async (userData) => {
  try {
    const response = await axios.post(`${getApiUrl()}/register`, userData);
    
    console.log('Registration successful:', response.data);

    // Store the token and user data if they are returned from registration
    if (response.data.token) {
      await AsyncStorage.setItem('aqro_token', response.data.token);
      await AsyncStorage.setItem('aqro_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.response) {
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.request) {
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      throw { message: error.message || 'An unexpected error occurred' };
    }
  }
};


// Login user
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email, password: '****' });
    const response = await axios.post(`${getApiUrl()}/login`, { email, password });
    
    console.log('Login response:', response.status, response.data);
    
    if (response.data.token) {
      await AsyncStorage.setItem('aqro_token', response.data.token);
      await AsyncStorage.setItem('aqro_user', JSON.stringify(response.data.user));
    } else {
      console.warn('Login successful but no token received');
      throw { message: 'Authentication error: No token received' };
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error details:', error);
    
    if (error.response) {
      // Server responded with error
      const errorMessage = error.response.data?.message || 
                          `Server error: ${error.response.status}`;
      
      if (error.response.status === 401) {
        throw { message: 'Invalid email or password' };
      } else if (error.response.status === 404) {
        throw { message: 'User not found' };
      } else {
        throw { message: errorMessage };
      }
    } else if (error.request) {
      // No response received
      throw { message: 'Server not responding. Please check your connection.' };
    } else {
      // Other errors
      throw { message: error.message || 'Login failed. Please try again.' };
    }
  }
};

// Logout user
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('aqro_token');
    await AsyncStorage.removeItem('aqro_user');
    console.log('Logout successful - storage cleared');
  } catch (error) {
    console.error('Logout error:', error);
    throw { message: 'Failed to log out properly' };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem('aqro_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};