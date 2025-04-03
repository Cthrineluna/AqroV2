import axios from 'axios';
import { getApiUrl } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Staff Approval Service
 * Handles all staff approval-related API calls
 */

// Get pending staff registrations (for admin)
export const getPendingStaff = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/admin/pending-staff`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending staff:', error);
    throw error.response?.data || { message: 'Failed to fetch pending staff' };
  }
};
  
  export const approveStaff = async (staffId) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.post(
        `${getApiUrl()}/admin/approve-staff/${staffId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error approving staff:', error);
      throw error.response?.data || { message: 'Failed to approve staff' };
    }
  };

// Reject a staff member (for admin)
export const rejectStaff = async (staffId, reason) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.post(
      `${getApiUrl()}/admin/reject-staff/${staffId}`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting staff:', error);
    throw error.response?.data || { message: 'Failed to reject staff' };
  }
};

// Staff registration with restaurant details
export const registerStaff = async (staffData) => {
    try {
      const formData = new FormData();
      
      // Append all text fields
      const textFields = [
        'firstName', 'lastName', 'email', 'password',
        'restaurantName', 'address', 'city', 'contactNumber'
      ];
      
      textFields.forEach(field => {
        if (staffData[field]) {
          formData.append(field, staffData[field]);
        }
      });
  
      // Append business license file with proper structure
      if (staffData.businessLicense) {
        // Get file extension from URI or use default
        const uriParts = staffData.businessLicense.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1] || 'pdf';
        
        // Determine MIME type based on extension or use provided type
        let fileType = staffData.businessLicense.mimeType || staffData.businessLicense.type;
        if (!fileType) {
          if (['pdf'].includes(fileExtension.toLowerCase())) {
            fileType = 'application/pdf';
          } else if (['jpg', 'jpeg'].includes(fileExtension.toLowerCase())) {
            fileType = 'image/jpeg';
          } else if (['png'].includes(fileExtension.toLowerCase())) {
            fileType = 'image/png';
          } else {
            fileType = 'application/octet-stream';
          }
        }
        
        formData.append('businessLicense', {
          uri: staffData.businessLicense.uri,
          name: staffData.businessLicense.name || `business_license.${fileExtension}`,
          type: fileType
        });
        
        // Log file details for debugging
        console.log('Business License Details:', {
          uri: staffData.businessLicense.uri,
          name: staffData.businessLicense.name || `business_license.${fileExtension}`,
          type: fileType
        });
      }
  
      // Append restaurant logo with proper structure
      if (staffData.restaurantLogo) {
        // Get file extension from URI or use default
        const uriParts = staffData.restaurantLogo.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
        
        // Determine MIME type based on extension or use provided type
        let fileType = staffData.restaurantLogo.mimeType || staffData.restaurantLogo.type;
        if (!fileType) {
          if (['jpg', 'jpeg'].includes(fileExtension.toLowerCase())) {
            fileType = 'image/jpeg';
          } else if (['png'].includes(fileExtension.toLowerCase())) {
            fileType = 'image/png';
          } else {
            fileType = 'image/jpeg'; // Default for images
          }
        }
        
        formData.append('restaurantLogo', {
          uri: staffData.restaurantLogo.uri,
          name: staffData.restaurantLogo.name || `restaurant_logo.${fileExtension}`,
          type: fileType
        });
        
        // Log file details for debugging
        console.log('Restaurant Logo Details:', {
          uri: staffData.restaurantLogo.uri,
          name: staffData.restaurantLogo.name || `restaurant_logo.${fileExtension}`,
          type: fileType
        });
      }
  
      // Log the entire form data for debugging
      console.log('Sending registration data with form fields:', 
        Object.fromEntries(textFields.map(field => [field, staffData[field]])));
  
      const response = await axios.post(`${getApiUrl()}/auth/register-staff`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        transformRequest: (data) => data, // Don't transform the FormData
        timeout: 15000 // Increased timeout for file uploads
      });
      
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error.response?.data || error.message);
      
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || error.response.statusText || 'Server returned an error';
        console.error('Server response:', error.response.status, error.response.data);
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'No response from server. Check your network connection.';
        console.error('No response received:', error.request);
      } else {
        // Error in setting up the request
        console.error('Request setup error:', error.message);
      }
      
      throw new Error(errorMessage);
    }
  };

// Check approval status (for staff)
export const checkApprovalStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/staff/approval-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking approval status:', error);
    throw error.response?.data || { message: 'Failed to check approval status' };
  }
};