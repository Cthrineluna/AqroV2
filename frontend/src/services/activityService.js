// frontend/src/services/activityService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from './apiConfig';

export const getRecentActivities = async (limit = 5) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    
const response = await axios.get(
  `${getApiUrl('/activities/recent')}?limit=${limit}`, 
  {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000 // 10 seconds
  }
);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

// Add to activityService.js
export const markContainerStatus = async (containerId, status) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await axios.post(
      `${getApiUrl('/containers/mark-status')}`,
      { containerId, status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error marking container status:', error);
    throw error;
  }
};

export const getAllActivities = async (page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await axios.get(
      `${getApiUrl('/activities')}?page=${page}&limit=${limit}`, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all activities:', error);
    throw error;
  }
};

export const getAllActivitiesAdmin = async (page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await axios.get(
      getApiUrl(`/activities/admin?page=${page}&limit=${limit}`), // Updated endpoint
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    throw error;
  }
};

export const getRestaurantActivities = async (page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await axios.get(
      `${getApiUrl('/activities/restaurant')}?page=${page}&limit=${limit}`, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching restaurant activities:', error);
    throw error;
  }
};
// Update getActivityReports in activityService.js
export const getActivityReports = async (queryParams) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(
      `${getApiUrl('/activities/reports/filtered')}?${queryParams}`, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching activity reports:', error);
    throw error;
  }
};