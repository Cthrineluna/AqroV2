import axios from 'axios';
import { getApiUrl } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const uploadDocuments = async (formData) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Uploading documents with form data:', {
        businessPermit: formData.get('businessPermit') ? 'Present' : 'Missing',
        birRegistration: formData.get('birRegistration') ? 'Present' : 'Missing'
      });

      const response = await axios.post(`${getApiUrl()}/documents/staff/resubmit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000, // Increased timeout to 60 seconds
        maxContentLength: 10 * 1024 * 1024, // 10MB max content length
        maxBodyLength: 10 * 1024 * 1024, // 10MB max body length
      });

      console.log('Document upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Document upload attempt ${retryCount + 1} failed:`, error);
      
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying upload (${retryCount}/${maxRetries})...`);
          // Wait for 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 413) {
        throw new Error('File size too large. Maximum size is 5MB.');
      } else if (error.response?.status === 415) {
        throw new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to upload documents.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request. Please check your input.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please check your internet connection and try again.');
      } else if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw new Error('Failed to upload documents. Please try again.');
      }
    }
  }
};

export const getRevisionDetails = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/documents/staff/revision-details`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Revision details response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching revision details:', error);
    throw error.response?.data || { message: 'Failed to fetch revision details' };
  }
}; 