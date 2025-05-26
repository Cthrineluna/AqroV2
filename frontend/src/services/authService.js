import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - change this to match your backend URL
const API_URL = 'http://192.168.100.200:5000/api/auth';

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
export const register = async (userData) => {
  try {
    const response = await axios.post(`${getApiUrl()}/register`, userData);
    
    console.log('Registration successful:', response.data);

    // Note: We don't store token anymore since we're not getting one
    // We just return the data
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
// authService.js - login function
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email, password: '****' });
    const response = await axios.post(`${getApiUrl()}/login`, { email, password });
    
    console.log('Login response:', response.status, response.data);
    
    if (response.data.token) {
      // Create userData object from response
      const userData = {
        id: response.data.user.id,
        email: response.data.user.email,
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        userType: response.data.user.userType,
        isEmailVerified: response.data.user.isEmailVerified || false,
        isApproved: response.data.user.isApproved || false,
        approvalStatus: response.data.user.approvalStatus || 'pending'
      };
      
      await AsyncStorage.setItem('aqro_token', response.data.token);
      await AsyncStorage.setItem('aqro_user', JSON.stringify(userData));
      
      return {
        token: response.data.token,
        user: userData
      };
    } else {
      console.warn('Login successful but no token received');
      throw { message: 'Authentication error: No token received' };
    }
  } catch (error) {
    console.error('Login error details:', error);
    if (error.response) {
      // Handle account locked scenario
      if (error.response.data && error.response.data.accountLocked) {
        throw { 
          message: error.response.data.message || 'Account is temporarily locked. Please try resetting your password.',
          accountLocked: true,
          email: error.response.data.email,
          lockDuration: error.response.data.lockDuration
        };
      }
      
      // Special handling for verification error
      if (error.response.data && error.response.data.needsVerification) {
        throw { 
          message: error.response.data.message || 'Please verify your email before logging in.',
          needsVerification: true,
          email: error.response.data.email
        };
      }
      
      // Handle remaining attempts info
      if (error.response.data && error.response.data.attemptsRemaining !== undefined) {
        throw {
          message: error.response.data.message,
          attemptsRemaining: error.response.data.attemptsRemaining
        };
      }
      
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.request) {
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      throw { message: error.message || 'An unexpected error occurred' };
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

export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${getApiUrl()}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error.response?.data || { message: 'Failed to request password reset' };
  }
};

// Add this function to reset password
export const resetPassword = async (email, token, newPassword) => {
  try {
    const response = await axios.post(`${getApiUrl()}/reset-password`, {
      email,
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error.response?.data || { message: 'Failed to reset password' };
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

// Verify email
export const verifyEmail = async (email, token) => {
  try {
    const response = await axios.post(`${getApiUrl()}/verify-email`, { email, token });
    
    // If verification successful and we got a token, store it
    if (response.data.token) {
      await AsyncStorage.setItem('aqro_token', response.data.token);
      
      // If we got user data, store it too
      if (response.data.user) {
        await AsyncStorage.setItem('aqro_user', JSON.stringify(response.data.user));
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.response) {
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.request) {
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      throw { message: error.message || 'An unexpected error occurred' };
    }
  }
};

// Resend verification email
export const resendVerification = async (email) => {
  try {
    const response = await axios.post(`${getApiUrl()}/resend-verification`, { email });
    return response.data;
  } catch (error) {
    console.error('Resend verification error:', error);
    if (error.response) {
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.request) {
      throw { message: 'No response from server. Please check your connection.' };
    } else {
      throw { message: error.message || 'An unexpected error occurred' };
    }
  }
};