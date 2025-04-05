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

// In approvalService.js
// Add this to your approvalService.js
export const getStaffDocuments = async (staffId, documentType, reason) => {
 
  const url = `${getApiUrl()}/approval/admin/staff-documents/${staffId}/${documentType}`;
  console.log("Requesting document URL:", url);
  try {
    const token = await AsyncStorage.getItem('aqro_token'); 
    const response = await axios.get(url, {
       reason ,
       headers: { Authorization: `Bearer ${token}` } 
    });
    
    console.log(`Document fetched successfully: ${documentType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${documentType}:`, error);
    console.log('Response data:', error.response?.data);
    console.log('Response status:', error.response?.status);
    
    // Return more specific error messages based on status codes
    if (error.response?.status === 404) {
      throw new Error(`Document not found: The ${documentType} document has not been uploaded or is missing.`);
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Authentication error: You may not have permission to view this document.');
    } else {
      throw new Error(error.response?.data?.message || `Could not fetch ${documentType}: ${error.message}`);
    }
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

    // Append business permit file
    if (staffData.businessPermit) {
      const uriParts = staffData.businessPermit.uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'pdf';
      
      let fileType = staffData.businessPermit.mimeType || staffData.businessPermit.type;
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
      
      formData.append('businessPermit', {
        uri: staffData.businessPermit.uri,
        name: staffData.businessPermit.name || `business_permit.${fileExtension}`,
        type: fileType
      });
    }

    // Append BIR registration file
    if (staffData.birRegistration) {
      const uriParts = staffData.birRegistration.uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'pdf';
      
      let fileType = staffData.birRegistration.mimeType || staffData.birRegistration.type;
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
      
      formData.append('birRegistration', {
        uri: staffData.birRegistration.uri,
        name: staffData.birRegistration.name || `bir_registration.${fileExtension}`,
        type: fileType
      });
    }

    // Append restaurant logo if exists
    if (staffData.restaurantLogo) {
      const uriParts = staffData.restaurantLogo.uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1] || 'jpg';
      
      let fileType = staffData.restaurantLogo.mimeType || staffData.restaurantLogo.type;
      if (!fileType) {
        if (['jpg', 'jpeg'].includes(fileExtension.toLowerCase())) {
          fileType = 'image/jpeg';
        } else if (['png'].includes(fileExtension.toLowerCase())) {
          fileType = 'image/png';
        } else {
          fileType = 'image/jpeg';
        }
      }
      
      formData.append('restaurantLogo', {
        uri: staffData.restaurantLogo.uri,
        name: staffData.restaurantLogo.name || `restaurant_logo.${fileExtension}`,
        type: fileType
      });
    }

    const response = await axios.post(`${getApiUrl()}/auth/register-staff`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      transformRequest: (data) => data,
      timeout: 15000
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