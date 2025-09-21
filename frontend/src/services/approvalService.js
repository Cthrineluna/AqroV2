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
export const rejectStaff = async (staffId, reason, permanent = false, documentsToRevise = [], deadline = null) => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.post(
      `${getApiUrl()}/admin/reject-staff/${staffId}`,
      { reason, permanent, documentsToRevise, deadline },
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
      // Generate a safe filename by removing special characters and spaces
      const safeFileName = staffData.businessPermit.name
        ? staffData.businessPermit.name.replace(/[^\w.-]/g, '_')
        : 'business_permit.pdf';
      
      formData.append('businessPermit', {
        uri: staffData.businessPermit.uri,
        name: safeFileName,
        type: staffData.businessPermit.mimeType || 
              staffData.businessPermit.type || 
              'application/pdf'
      });
    }

    // Append BIR registration file
    if (staffData.birRegistration) {
      // Generate a safe filename by removing special characters and spaces
      const safeFileName = staffData.birRegistration.name
        ? staffData.birRegistration.name.replace(/[^\w.-]/g, '_')
        : 'bir_registration.pdf';
      
      formData.append('birRegistration', {
        uri: staffData.birRegistration.uri,
        name: safeFileName,
        type: staffData.birRegistration.mimeType || 
              staffData.birRegistration.type || 
              'application/pdf'
      });
    }

    // Append restaurant logo if exists
    if (staffData.restaurantLogo) {
      // Check if restaurantLogo is a base64 string
      if (typeof staffData.restaurantLogo === 'string' && 
          staffData.restaurantLogo.startsWith('data:image')) {
        formData.append('restaurantLogo', staffData.restaurantLogo);
      } 
      // Check if it's a file object with URI
      else if (staffData.restaurantLogo.uri) {
        const safeFileName = staffData.restaurantLogo.name
          ? staffData.restaurantLogo.name.replace(/[^\w.-]/g, '_')
          : 'restaurant_logo.jpg';
        
        formData.append('restaurantLogo', {
          uri: staffData.restaurantLogo.uri,
          name: safeFileName,
          type: staffData.restaurantLogo.mimeType || 
                staffData.restaurantLogo.type || 
                'image/jpeg'
        });
      }
    }

    // Log exactly what we're sending (for debugging)
    console.log('Sending form data with files:', {
      businessPermitName: staffData.businessPermit?.name,
      birRegistrationName: staffData.birRegistration?.name,
      formDataEntries: [...formData._parts].map(part => 
        part[0] === 'password' ? [part[0], '[REDACTED]'] : part[0]
      )
    });

    const response = await axios.post(`${getApiUrl()}/auth/register-staff`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      },
      // No need for custom transformRequest, let Axios handle it
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

// Get staff members who need revision
export const getStaffNeedingRevision = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/admin/staff-needing-revision`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching staff needing revision:', error);
    throw error.response?.data || { message: 'Failed to fetch staff needing revision' };
  }
};