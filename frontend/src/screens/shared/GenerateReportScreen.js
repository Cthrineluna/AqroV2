import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  PermissionsAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText 
} from '../../components/StyledComponents';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getActivityReports } from '../../services/activityService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import * as Print from 'expo-print';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Asset } from 'expo-asset';


const GenerateReportScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'admin';
  const isStaff = user?.userType === 'staff';
  const staffRestaurantId = user?.restaurantId;
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalRebateAmount, setTotalRebateAmount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Activity types
  const activityTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'registration', name: 'Registration' },
    { id: 'return', name: 'Return' },
    { id: 'rebate', name: 'Rebate' },
    { id: 'status_change', name: 'Status Change' }
  ];

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const QUARTERS = [
    { id: 1, name: 'Q1 (Jan-Mar)' },
    { id: 2, name: 'Q2 (Apr-Jun)' },
    { id: 3, name: 'Q3 (Jul-Sep)' },
    { id: 4, name: 'Q4 (Oct-Dec)' }
  ];

  // Filter states
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState(activityTypes[0]); 
  const [selectedRestaurants, setSelectedRestaurants] = useState([]); 
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedContainerTypes, setSelectedContainerTypes] = useState([]);

const [dateFilterMode, setDateFilterMode] = useState('range'); // 'range', 'month', 'year', 'quarter'
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [selectedQuarter, setSelectedQuarter] = useState(1);
  
  // Data for filters
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  
  // Search queries
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [containerTypeSearchQuery, setContainerTypeSearchQuery] = useState('');

  // Filtered data
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
  );
  
  const filteredUsers = users.filter(user => 
    (user.firstName + ' ' + user.lastName).toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );
  
  const filteredContainerTypes = containerTypes.filter(type => 
    type.name.toLowerCase().includes(containerTypeSearchQuery.toLowerCase())
  );

  const getLogoBase64 = async () => {
    try {
      // Import the logo directly in your component
      const logoAsset = require('../../../assets/images/aqro-light.png');
      
      // Load the asset
      const asset = Asset.fromModule(logoAsset);
      await asset.downloadAsync();
      
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error loading logo as base64:', error);
      return null;
    }
  };

const processRestaurantLogo = async (base64Logo) => {
  if (!base64Logo) return null;
  
  try {
    // Remove the prefix if it exists
    const imageData = base64Logo.includes('data:image')
      ? base64Logo
      : `data:image/jpeg;base64,${base64Logo}`;
      
    // Resize the image to a reasonable size for the PDF
    const manipResult = await manipulateAsync(
      imageData,
      [{ resize: { width: 100 } }],
      { base64: true }
    );
    
    return `data:image/jpeg;base64,${manipResult.base64}`;
  } catch (error) {
    console.error('Error processing coffee shop logo:', error);
    return null;
  }
};

// Function to get restaurant initials (fallback if no logo)
const getRestaurantInitials = (name) => {
  if (!name) return "AR"; // Default for "All Restaurants"
  
  const words = name.split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};


// Function to generate PDF report
const generatePdfReport = async () => {
  try {
    setLoading(true);

    const logoBase64 = await getLogoBase64();
    
    // Determine report type title based on filters
    let reportType = "Activity";
    if (selectedActivityType?.id !== 'all') {
      reportType = selectedActivityType.name;
    }
    let reportTitle = `${reportType} Report`;
    
    // Determine restaurant information
    let restaurantName = "All Coffee Shop";
    let restaurantLogo = null;
    
 if (isStaff && restaurants.length === 1) {
      restaurantName = restaurants[0].name;
      if (restaurants[0].logo) {
        restaurantLogo = await processRestaurantLogo(restaurants[0].logo);
      }
    }
    // For admins, use the selected restaurants
    else if (selectedRestaurants.length === 1) {
      restaurantName = selectedRestaurants[0].name;
      if (selectedRestaurants[0].logo) {
        restaurantLogo = await processRestaurantLogo(selectedRestaurants[0].logo);
      }
    } else if (selectedRestaurants.length > 1 && selectedRestaurants.length <= 5) {
      // Format names with commas and "and" before the last one
      const restaurantFirstNames = selectedRestaurants.map(r => r.name.split(' ')[0]);
      if (restaurantFirstNames.length === 2) {
        restaurantName = `${restaurantFirstNames[0]} and ${restaurantFirstNames[1]}`;
      } else {
        const lastItem = restaurantFirstNames.pop();
        restaurantName = `${restaurantFirstNames.join(', ')} and ${lastItem}`;
      }
    } else if (selectedRestaurants.length > 5) {
      restaurantName = `${selectedRestaurants.length} Selected Coffee Shop`;
    }
    
    
    // Format date period text
    let datePeriodText = '';
    if (dateFilterMode === 'range') {
      datePeriodText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (dateFilterMode === 'month') {
      datePeriodText = `${MONTHS[selectedMonth]} ${selectedYear}`;
    } else if (dateFilterMode === 'quarter') {
      datePeriodText = `${QUARTERS.find(q => q.id === selectedQuarter).name} ${selectedYear}`;
    } else if (dateFilterMode === 'year') {
      datePeriodText = `Year ${selectedYear}`;
    }
    
    // Format current date for filename
    const dateForFilename = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const currentDate = new Date().toLocaleString();
    
    // Format filename to include report type and restaurant
    let restaurantForFilename = "";
    if (selectedRestaurants.length === 1) {
      // Use single restaurant name
      restaurantForFilename = `_${selectedRestaurants[0].name.replace(/\s+/g, '_')}`;
    } else if (selectedRestaurants.length > 1 && selectedRestaurants.length <= 3) {
      // Use first names of up to 3 restaurants
      restaurantForFilename = `_${selectedRestaurants.slice(0, 3).map(r => r.name.split(' ')[0]).join('_')}`;
    } else if (selectedRestaurants.length > 3) {
      // Use count for more than 3 restaurants
      restaurantForFilename = `_${selectedRestaurants.length}Restaurants`;
    }
    
    const fileName = `AQRO_${reportType}_Report${restaurantForFilename}_${dateForFilename}.pdf`;
    
    // Build the HTML for the PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AQRO ${reportType} Report</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              color: #333;
              margin: 0;
              padding: 20px;
              padding-bottom: 60px; /* Space for footer */
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 10px;
              border-bottom: 2px solid #ddd;
            }
            .logo {
              width: 70px;
              height: auto;
            }
            .logo-placeholder {
              width: 50px;
              height: 50px;
              background-color: #f0f0f0;
              color: #666;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 18px;
            }
            .header-center {
              text-align: center;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              margin: 5px 0;
            }
            .restaurant-name {
              font-size: 18px;
              margin: 5px 0;
            }
            .report-period {
              font-size: 14px;
              color: #666;
            }
            .summary {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              display: flex;
              justify-content: space-around;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
            }
            .summary-value {
              font-size: 22px;
              font-weight: bold;
              color: #333;
            }
            .rebate-value {
              color: #FF9800;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f2f2f2;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              font-size: 12px;
              border-bottom: 2px solid #ddd;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #eee;
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .activity-badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 12px;
              color: white;
              font-size: 10px;
              text-align: center;
            }
            .registration {
              background-color: #4CAF50;
            }
            .return {
              background-color: #2196F3;
            }
            .rebate {
              background-color: #FF9800;
            }
            .status_change {
              background-color: #9C27B0;
            }
            .footer {
              position: running(footer);
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #666;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              background-color: white;
              width: 100%;
            }
            
            @page {
              @bottom-center {
                content: element(footer);
              }
              margin: 10mm;
              margin-bottom: 20mm;
            }
            .empty-state {
              text-align: center;
              padding: 40px 0;
              color: #666;
            }
            /* Make table headers repeat on each page */
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            /* Add space for footer to prevent content overlap */
            .footer-spacer {
              height: 20px;
              width: 100%;
            }
            
            /* Control where page breaks happen */
            .avoid-break {
              page-break-inside: avoid;
            }
            
            /* Use these to debug page breaks if needed */
            .pagebreak { 
              page-break-before: always; 
            }
            
            /* Ensure tables flow continuously across pages */
            tbody {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
    `;

    // Create header HTML
    const headerHTML = `
      <div class="header avoid-break">
        <div>
          ${logoBase64 ? 
            `<img src="${logoBase64}" class="logo" alt="AQRO Logo" />` : 
            `<div class="logo-placeholder">AQ</div>`
          }
        </div>
        <div class="header-center">
          <div class="report-title">${reportTitle}</div>
          <div class="restaurant-name">${restaurantName}</div>
          <div class="report-period">${datePeriodText}</div>
        </div>
        <div>
          ${restaurantLogo ? 
            `<img src="${restaurantLogo}" class="logo" alt="Restaurant Logo" />` : 
            `<div class="logo-placeholder">${getRestaurantInitials(restaurantName)}</div>`
          }
        </div>
      </div>
    `;

    // Create summary HTML
    const summaryHTML = `
      <div class="summary avoid-break">
        <div class="summary-item">
          <div class="summary-label">Total Transactions</div>
          <div class="summary-value">${totalTransactions}</div>
        </div>
        
        ${(selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) ? `
          <div class="summary-item">
            <div class="summary-label">Total Rebate</div>
            <div class="summary-value rebate-value">₱${totalRebateAmount.toFixed(2)}</div>
          </div>
        ` : ''}
      </div>
    `;

    // Create table headers
    const tableHeadersHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Customer</th>
          ${isAdmin ? '<th>Restaurant</th>' : ''}
          <th>Container</th>
          <th>Activity</th>
          ${(selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) ? 
            '<th>Amount</th>' : ''}
        </tr>
      </thead>
    `;
    
    // Create footer HTML with page numbers - will be dynamically inserted by CSS
    const footerHTML = `
      <div class="footer">
        <div>AQRO &copy; 2025</div>
        <div id="pageNumber"></div>
        <div>Generated on: ${currentDate}</div>
      </div>
    `;

    // If no activities found, show empty state
    if (activities.length === 0) {
      htmlContent += `
        ${headerHTML}
        ${summaryHTML}
        
        <div class="empty-state">
          <p>No activities found for the selected filters</p>
        </div>
        
        <div class="footer-spacer"></div>
        ${footerHTML}
      `;
    } else {
      // Add header and summary
      htmlContent += headerHTML + summaryHTML;
      
      // Create continuous table - no need to paginate manually
      htmlContent += `
        <table>
          ${tableHeadersHTML}
          <tbody>
      `;
      
      // Add all table rows
      activities.forEach(activity => {
        const customerName = `${activity.userId?.firstName || ''} ${activity.userId?.lastName || ''}`;
        const containerTypeName = activity.containerTypeId?.name || activity.containerId?.containerTypeId?.name || 'N/A';
        const date = new Date(activity.createdAt).toISOString().split('T')[0];
        const restaurant = activity.restaurantId?.name || 'N/A';
        
        htmlContent += `
          <tr>
            <td>${date}</td>
            <td>${customerName}</td>
            ${isAdmin ? `<td>${restaurant}</td>` : ''}
            <td>${containerTypeName}</td>
            <td>
              <div class="activity-badge ${activity.type}">
                ${formatActivityType(activity.type)}
              </div>
            </td>
            ${(selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) ? 
              `<td>${activity.type === 'rebate' ? `₱${activity.amount?.toFixed(2) || '0.00'}` : '-'}</td>` : 
              ''}
          </tr>
        `;
      });
      
      // Close table
      htmlContent += `
          </tbody>
        </table>
        
        <div class="footer-spacer"></div>
        ${footerHTML}
      `;
    }
    
    htmlContent += `
        </body>
      </html>
    `;
    
    // Generate PDF with custom filename that includes report type
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      fileName,
      directory: 'Documents'
    });
    
    // For Android, save to Downloads folder
    if (Platform.OS === 'android') {
      try {
        // First check if we have permission
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          // Get the Downloads directory
          const destinationUri = permissions.directoryUri;
          
          // Copy the file to Downloads
          await FileSystem.StorageAccessFramework.createFileAsync(
            destinationUri, 
            fileName, 
            'application/pdf'
          ).then(async (fileUri) => {
            const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            await FileSystem.writeAsStringAsync(fileUri, pdfData, { encoding: FileSystem.EncodingType.Base64 });
            
            Alert.alert(
              'Export Complete',
              `${reportType} Report saved to Downloads as ${fileName}`,
              [{ text: 'OK' }]
            );
          });
        } else {
          // Fall back to sharing if permission denied
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Save or Share ${reportType} Report`,
              UTI: 'com.adobe.pdf'
            });
          }
        }
      } catch (err) {
        console.error('Error saving to downloads:', err);
        
        // Fall back to sharing if error occurs
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Save or Share ${reportType} Report`,
            UTI: 'com.adobe.pdf'
          });
        }
      }
    } else {
      // For iOS and other platforms, use sharing
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Save or Share ${reportType} Report`,
          UTI: 'com.adobe.pdf'
        });
      }
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    Alert.alert('Export Failed', 'Failed to generate PDF report. Please try again.');
  } finally {
    setLoading(false);
  }
};

const requestStoragePermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      ]);
      
      return (
        granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.error('Failed to request permissions:', err);
      return false;
    }
  }
  return true; // On iOS we don't need these permissions
};

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReportData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    loadInitialData();
  }, []);

const loadInitialData = async () => {
  setLoading(true);
  try {
    // Load filter data
    if (isAdmin) {
      await fetchRestaurants();
      await fetchUsers();
    } else if (isStaff && staffRestaurantId) {
      // For staff, fetch only their restaurant
      await fetchStaffRestaurant();
    }
    
    await fetchContainerTypes();
    
    // Set default filters before loading data
    setSelectedActivityType(activityTypes[0]); // "All Types"
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());
    
    // Load report data with default filters
    await fetchReportData();
  } catch (error) {
    console.error('Error loading initial data:', error);
    Alert.alert('Error', 'Failed to load initial data. Please try again.');
  } finally {
    setLoading(false);
  }
};

const fetchStaffRestaurant = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    
    // Fetch the specific restaurant for this staff member
    const response = await axios.get(getApiUrl(`/restaurants/${staffRestaurantId}`), {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data) {
      // Set the restaurant in the restaurants state
      setRestaurants([response.data]);
      // Also automatically select it
      setSelectedRestaurants([response.data]);
    }
  } catch (error) {
    console.error('Error fetching staff coffee shop:', error);
  }
};

  useEffect(() => {
    // Don't fetch on initial render (loadInitialData handles that)
    if (startDate && endDate) {
      const timer = setTimeout(() => {
        fetchReportData();
      }, 500); // Debounce to avoid rapid requests
      
      return () => clearTimeout(timer);
    }
  }, [
    startDate, 
    endDate, 
    selectedActivityType, 
    selectedRestaurants, 
    selectedCustomers, 
    selectedContainerTypes
  ]);
  const fetchRestaurants = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      const response = await axios.get(getApiUrl('/restaurants'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setRestaurants(response.data);
      }
    } catch (error) {
      console.error('Error fetching coffee shop:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(getApiUrl('/admin/users'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load users. Please try again.'
      );
    }
  };
  
  const fetchContainerTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      const response = await axios.get(
        getApiUrl('/container-types'), 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data) {
        setContainerTypes(response.data);
      }
    } catch (error) {
      console.error('Error fetching cup types:', error);
      Alert.alert('Error', 'Failed to load cup types. Please try again.');
    }
  };
  
const fetchReportData = async () => {
  setLoading(true);
  try {
    // Create UTC date objects to match MongoDB storage format
    const startUTC = new Date(Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0, 0, 0, 0
    ));
    
    const endUTC = new Date(Date.UTC(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23, 59, 59, 999
    ));

    const params = new URLSearchParams();
    params.append('startDate', startUTC.toISOString());
    params.append('endDate', endUTC.toISOString());
    
    console.log('Date range in UTC:', {
      start: startUTC.toISOString(),
      end: endUTC.toISOString(),
      startOriginal: startDate.toISOString(),
      endOriginal: endDate.toISOString()
    });
    
    // Rest of your parameters...
    if (selectedActivityType && selectedActivityType.id !== 'all') {
      params.append('type', selectedActivityType.id);
    }
    
    // For staff users, always use their restaurant ID regardless of selections
    if (isStaff && staffRestaurantId) {
      params.append('restaurantIds[]', staffRestaurantId);
    } 
    // For admins, use selected restaurants
    else if (selectedRestaurants.length > 0) {
      selectedRestaurants.forEach(restaurant => {
        params.append('restaurantIds[]', restaurant._id);
      });
    }
    
    if (selectedCustomers.length > 0) {
      selectedCustomers.forEach(customer => {
        params.append('userIds[]', customer._id);
      });
    }
    
    if (selectedContainerTypes.length > 0) {
      selectedContainerTypes.forEach(type => {
        params.append('containerTypeIds[]', type._id);
      });
    }
    
    // API call
    const token = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(
      getApiUrl('/activities/reports/filtered') + '?' + params.toString(),
      { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      }
    );
    
    setActivities(response.data.activities);
    setTotalTransactions(response.data.totalActivities);
    
    if (selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) {
      const rebateTotal = response.data.activities
        .filter(activity => activity.type === 'rebate')
        .reduce((sum, activity) => sum + (activity.amount || 0), 0);
      setTotalRebateAmount(rebateTotal);
    } else {
      setTotalRebateAmount(0);
    }
  } catch (error) {
    console.error('Error fetching report data:', error);
    Alert.alert('Error', 'Failed to load report data. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleDateChange = (event, selectedDate, dateType) => {
    if (Platform.OS === 'android') {
      if (dateType === 'start') {
        setShowStartDatePicker(false);
      } else {
        setShowEndDatePicker(false);
      }
    }
    
    if (selectedDate) {
      if (dateType === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const applyFilters = () => {
    // Calculate dates based on selected mode
    if (dateFilterMode === 'month') {
      const firstDay = new Date(selectedYear, selectedMonth, 1);
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (dateFilterMode === 'quarter') {
      const quarterStartMonth = (selectedQuarter - 1) * 3;
      const firstDay = new Date(selectedYear, quarterStartMonth, 1);
      const lastDay = new Date(selectedYear, quarterStartMonth + 3, 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (dateFilterMode === 'year') {
      const firstDay = new Date(selectedYear, 0, 1);
      const lastDay = new Date(selectedYear, 11, 31);
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
    
    setFilterModalVisible(false);
    fetchReportData();
  };

  const removeActivityTypeFilter = () => {
    setSelectedActivityType(activityTypes[0]); // Reset to 'All Types'
  };
  
  const removeRestaurantFilter = (restaurantId) => {
    setSelectedRestaurants(selectedRestaurants.filter(r => r._id !== restaurantId));
  };
  
  const removeCustomerFilter = (customerId) => {
    setSelectedCustomers(selectedCustomers.filter(c => c._id !== customerId));
  };
  
  const removeContainerTypeFilter = (typeId) => {
    setSelectedContainerTypes(selectedContainerTypes.filter(t => t._id !== typeId));
  };

  const resetFilters = () => {
    setDateFilterMode('range');
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setSelectedQuarter(Math.floor(new Date().getMonth() / 3) + 1);
    setSelectedActivityType(activityTypes[0]);
    setSelectedRestaurants([]);
    setSelectedCustomers([]);
    setSelectedContainerTypes([]);
  };
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      
      // Create CSV header
      let csvContent = "\"TransactionID\",\"Date\",\"Customer\",";
      
      if (isAdmin) {
        csvContent += "\"Restaurant\",";
      }
      
      csvContent += "\"Container Type\",\"Activity Type\"";
      
      if (selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) {
        csvContent += ",\"Rebate Amount\"";
      }
      
      csvContent += "\n";
      
      // Add data rows
      activities.forEach(activity => {
        const customerName = `${activity.userId?.firstName || ''} ${activity.userId?.lastName || ''}`;
        const containerTypeName = activity.containerTypeId?.name || activity.containerId?.containerTypeId?.name || 'N/A';
        const date = new Date(activity.createdAt).toLocaleString();
        
        let row = `\"${activity._id}\",\"${date}\",\"${customerName}\",`;
        
        if (isAdmin) {
          row += `\"${activity.restaurantId?.name || 'N/A'}\",`;
        }
        
        row += `\"${containerTypeName}\",\"${activity.type}\"`;
        
        if (selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) {
          row += `,\"${activity.type === 'rebate' ? activity.amount?.toFixed(2) || '0.00' : '0.00'}\"`;
        }
        
        row += "\n";
        csvContent += row;
      });
      
      // Add totals row
      let totalsRow = `\"Total\",\"\",\"\",`;
      
      if (isAdmin) {
        totalsRow += `\"\",`;
      }
      
      totalsRow += `\"\",\"${totalTransactions} transactions\"`;
      
      if (selectedActivityType?.id === 'rebate' || selectedActivityType?.id === 'all' || !selectedActivityType) {
        totalsRow += `,\"${totalRebateAmount.toFixed(2)}\"`;
      }
      
      csvContent += totalsRow;
      
      // Determine report type title based on filters
      let reportType = "Activity";
      if (selectedActivityType?.id !== 'all') {
        reportType = selectedActivityType.name;
      }
      
      // Determine restaurant information for filename
      let restaurantForFilename = "";
      if (selectedRestaurants.length === 1) {
        restaurantForFilename = `_${selectedRestaurants[0].name.replace(/\s+/g, '_')}`;
      } else if (selectedRestaurants.length > 1 && selectedRestaurants.length <= 3) {
        const restaurantFirstNames = selectedRestaurants.slice(0, 3).map(r => r.name.split(' ')[0]);
        restaurantForFilename = `_${restaurantFirstNames.join('_')}`;
      } else if (selectedRestaurants.length > 3) {
        restaurantForFilename = `_${selectedRestaurants.length}Restaurants`;
      }
      
      // Format date for filename
      const dateForFilename = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `AQRO_${reportType}_Report${restaurantForFilename}_${dateForFilename}.csv`;
      
      // For Android, save to Downloads folder
      if (Platform.OS === 'android') {
        try {
          // First check if we have permission
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          
          if (permissions.granted) {
            // Get the Downloads directory
            const destinationUri = permissions.directoryUri;
            
            // Create the file
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              destinationUri, 
              fileName, 
              'text/csv'
            );
            
            // Write the content
            await FileSystem.writeAsStringAsync(fileUri, csvContent);
            
            Alert.alert(
              'Export Complete',
              `${reportType} Report saved to Downloads as ${fileName}`,
              [{ text: 'OK' }]
            );
          } else {
            // Fall back to sharing if permission denied
            const tempFileUri = FileSystem.documentDirectory + fileName;
            await FileSystem.writeAsStringAsync(tempFileUri, csvContent);
            
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(tempFileUri, {
                mimeType: 'text/csv',
                dialogTitle: `Save or Share ${reportType} Report`,
                UTI: 'public.comma-separated-values-text'
              });
            }
          }
        } catch (err) {
          console.error('Error saving to downloads:', err);
          
          // Fall back to sharing if error occurs
          const tempFileUri = FileSystem.documentDirectory + fileName;
          await FileSystem.writeAsStringAsync(tempFileUri, csvContent);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(tempFileUri, {
              mimeType: 'text/csv',
              dialogTitle: `Save or Share ${reportType} Report`,
              UTI: 'public.comma-separated-values-text'
            });
          }
        }
      } else {
        // For iOS and other platforms, use sharing
        const tempFileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(tempFileUri, csvContent);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempFileUri, {
            mimeType: 'text/csv',
            dialogTitle: `Save or Share ${reportType} Report`,
            UTI: 'public.comma-separated-values-text'
          });
        }
      }
      
      setExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Export Failed', 'Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

const renderFilterBadges = () => {
    const badges = [];
    
    if (selectedActivityType && selectedActivityType.id !== 'all') {
      badges.push(
        <TouchableOpacity 
          key="type" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedActivityType.name}
          </MediumText>
          <TouchableOpacity onPress={removeActivityTypeFilter}>
            <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    
    // Only show restaurant badges for admin users
    if (!isStaff && selectedRestaurants.length > 0) {
      selectedRestaurants.forEach((restaurant, index) => {
        badges.push(
          <TouchableOpacity 
            key={`restaurant-${index}`} 
            style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MediumText style={{ color: theme.primary, fontSize: 12 }}>
              {restaurant.name}
            </MediumText>
            <TouchableOpacity onPress={() => removeRestaurantFilter(restaurant._id)}>
              <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      });
    }
    
    if (selectedCustomers.length > 0) {
      selectedCustomers.forEach((customer, index) => {
        badges.push(
          <TouchableOpacity 
            key={`customer-${index}`} 
            style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MediumText style={{ color: theme.primary, fontSize: 12 }}>
              {customer.firstName} {customer.lastName}
            </MediumText>
            <TouchableOpacity onPress={() => removeCustomerFilter(customer._id)}>
              <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      });
    }
    
    if (selectedContainerTypes.length > 0) {
      selectedContainerTypes.forEach((type, index) => {
        badges.push(
          <TouchableOpacity 
            key={`containerType-${index}`} 
            style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <MediumText style={{ color: theme.primary, fontSize: 12 }}>
              {type.name}
            </MediumText>
            <TouchableOpacity onPress={() => removeContainerTypeFilter(type._id)}>
              <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      });
    }
    
    return badges;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <BoldText style={[styles.headerTitle, { color: theme.text }]}>
          Generate Reports
        </BoldText>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ marginRight: 16 }}>
            <Ionicons name="options-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExportModalVisible(true)}>
            <Ionicons name="download-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Range Display */}
      <View style={styles.dateRangeContainer}>
  <RegularText style={{ color: theme.text, fontSize: 12 }}>
    Report Period:
  </RegularText>
  
  <TouchableOpacity 
    style={styles.dateModeSelector}
    onPress={() => setFilterModalVisible(true)}
  >
    <MediumText style={{ color: theme.text, marginTop: 4 }}>
      {dateFilterMode === 'range' && (
        `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`
      )}
      {dateFilterMode === 'month' && (
        `${MONTHS[selectedMonth]} ${selectedYear}`
      )}
      {dateFilterMode === 'quarter' && (
        `${QUARTERS.find(q => q.id === selectedQuarter).name} ${selectedYear}`
      )}
      {dateFilterMode === 'year' && (
        `Year ${selectedYear}`
      )}
    </MediumText>
    <Ionicons 
      name="chevron-down" 
      size={16} 
      color={theme.text} 
      style={{ marginLeft: 8 }}
    />
  </TouchableOpacity>
</View>
      
      {/* Filter Badges */}
      {renderFilterBadges().length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterBadgesContainer}
          contentContainerStyle={styles.filterBadgesContent}
        >
          {renderFilterBadges()}
        </ScrollView>
      )}
      
      {/* Report Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.summaryItem}>
          <RegularText style={{ color: theme.text, fontSize: 12 }}>
            Total Transactions
          </RegularText>
          <BoldText style={{ color: theme.text, fontSize: 24 }}>
            {totalTransactions}
          </BoldText>
        </View>
        
        {(selectedActivityType?.id === 'rebate' ||  selectedActivityType?.id === 'all' || !selectedActivityType) && (
          <View style={styles.summaryItem}>
            <RegularText style={{ color: theme.text, fontSize: 12 }}>
              Total Rebate
            </RegularText>
            <BoldText style={{ color: theme.primary, fontSize: 24 }}>
            ₱{totalRebateAmount.toFixed(2)}
            </BoldText>
          </View>
        )}
      </View>
      
      {/* Report Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <MediumText style={{ color: theme.text, marginTop: 8 }}>
            Loading report data...
          </MediumText>
        </View>
      ) : (
        <ScrollView 
          style={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
              progressBackgroundColor={theme.background}
            />
          }
        >
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: theme.cardBackground }]}>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10 }]}>
                        Date
                    </MediumText>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10  }]}>
                        Customer
                    </MediumText>
                    {isAdmin && (
                        <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10  }]}>
                        Coffee Shop
                        </MediumText>
                    )}
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10 }]}>
                      Cup
                    </MediumText>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1., fontSize: 10 }]}>
                        Activity
                    </MediumText>
                    {(selectedActivityType?.id === 'rebate' ||  selectedActivityType?.id === 'all' || !selectedActivityType) && (
                       <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.2, fontSize: 10 }]}>
                       Amount
                     </MediumText>
                    )}
                    </View>
          
          {/* Table Rows */}
          {activities.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-text-outline" size={64} color={theme.text} />
              <MediumText style={{ color: theme.text, marginTop: 16 }}>
                No activities found for the selected filters
              </MediumText>
            </View>
          ) : (
            activities.map((activity, index) => (
              <View 
                key={activity._id} 
                style={[
                  styles.tableRow, 
                  { backgroundColor: index % 2 === 0 ? theme.background : theme.cardBackground }
                ]}
              >
               <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.5 }]}>
                {new Date(activity.createdAt).toISOString().split('T')[0]}
              </RegularText>
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.5 }]}>
                {activity.userId?.firstName || ''} {activity.userId?.lastName || ''}
                </RegularText>
                {isAdmin && (
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.5 }]}>
                    {activity.restaurantId?.name || 'N/A'}
                </RegularText>
                )}
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.2 }]}>
                {activity.containerTypeId?.name || activity.containerId?.containerTypeId?.name || 'N/A'}
              </RegularText>
              <View style={[styles.tableCell, { flex: 1.2 }]}> 
                <View style={[
                    styles.activityTypeBadge, 
                    { 
                        backgroundColor: getActivityTypeColor(activity.type, theme),
                        borderRadius: 4,
                        paddingVertical: 2,
                        paddingHorizontal: 4
                    }
                ]}>
                    <RegularText style={{ color: '#FFFFFF', fontSize: 6 }}> 
                        {formatActivityType(activity.type)}
                    </RegularText>
                </View>
            </View>
                {(selectedActivityType?.id === 'rebate' ||  selectedActivityType?.id === 'all' || !selectedActivityType) && (
                  <RegularText style={[styles.tableCell, { color: theme.text, flex: 0.8 }]}>
                    {activity.type === 'rebate' ? `₱${activity.amount?.toFixed(2) || '0.00'}` : '-'}
                  </RegularText>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
      
      {/* Filter Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={[styles.filterModalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.filterModalHeader}>
              <BoldText style={{ fontSize: 20, color: theme.text }}>
                Filter Reports
              </BoldText>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              {/* Date Range Section */}
              <View style={styles.filterSection}>
  <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
    Date Filter Mode
  </MediumText>
  
  <View style={styles.dateModeOptions}>
    <TouchableOpacity
      style={[
        styles.dateModeOption,
        { 
          backgroundColor: dateFilterMode === 'range' ? theme.primary + '20' : theme.input,
          borderColor: theme.primary
        }
      ]}
      onPress={() => setDateFilterMode('range')}
    >
      <MediumText style={{ color: dateFilterMode === 'range' ? theme.primary : theme.text }}>
        Range
      </MediumText>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[
        styles.dateModeOption,
        { 
          backgroundColor: dateFilterMode === 'month' ? theme.primary + '20' : theme.input,
          borderColor: theme.primary
        }
      ]}
      onPress={() => setDateFilterMode('month')}
    >
      <MediumText style={{ color: dateFilterMode === 'month' ? theme.primary : theme.text }}>
        Monthly
      </MediumText>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[
        styles.dateModeOption,
        { 
          backgroundColor: dateFilterMode === 'quarter' ? theme.primary + '20' : theme.input,
          borderColor: theme.primary
        }
      ]}
      onPress={() => setDateFilterMode('quarter')}
    >
      <MediumText style={{ color: dateFilterMode === 'quarter' ? theme.primary : theme.text }}>
        Quarterly
      </MediumText>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[
        styles.dateModeOption,
        { 
          backgroundColor: dateFilterMode === 'year' ? theme.primary + '20' : theme.input,
          borderColor: theme.primary,
        }
      ]}
      onPress={() => setDateFilterMode('year')}
    >
      <MediumText style={{ color: dateFilterMode === 'year' ? theme.primary : theme.text }}>
        Yearly
      </MediumText>
    </TouchableOpacity>
  </View>

  {dateFilterMode === 'range' && (
    <View style={styles.datePickerContainer}>
      <TouchableOpacity 
        style={[styles.datePickerButton, { backgroundColor: theme.input }]}
        onPress={() => setShowStartDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={theme.text} />
        <RegularText style={{ marginLeft: 8, color: theme.text }}>
          {startDate.toISOString().split('T')[0]}
        </RegularText>
      </TouchableOpacity>
      
      <RegularText style={{ marginHorizontal: 8, color: theme.text }}>to</RegularText>
      
      <TouchableOpacity 
        style={[styles.datePickerButton, { backgroundColor: theme.input }]}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={theme.text} />
        <RegularText style={{ marginLeft: 8, color: theme.text }}>
          {endDate.toISOString().split('T')[0]}
        </RegularText>
      </TouchableOpacity>
    </View>
  )}

  {dateFilterMode === 'month' && (
    <View>
      <MediumText style={{ color: theme.text, marginTop: 8 }}>Select Month:</MediumText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.monthScrollView}
      >
        {MONTHS.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthOption,
              { 
                backgroundColor: selectedMonth === index ? theme.primary + '20' : theme.input,
                borderColor: theme.primary
              }
            ]}
            onPress={() => setSelectedMonth(index)}
          >
            <MediumText style={{ color: selectedMonth === index ? theme.primary : theme.text }}>
              {month.substring(0, 3)}
            </MediumText>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <MediumText style={{ color: theme.text, marginTop: 8 }}>Select Year:</MediumText>
      <View style={styles.yearSelector}>
        <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <MediumText style={{ color: theme.text, marginHorizontal: 16 }}>
          {selectedYear}
        </MediumText>
        <TouchableOpacity 
          onPress={() => setSelectedYear(prev => prev + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedYear >= new Date().getFullYear() ? theme.text + '80' : theme.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  )}

  {dateFilterMode === 'quarter' && (
    <View>
      <MediumText style={{ color: theme.text, marginTop: 8 }}>Select Quarter:</MediumText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quarterScrollView}
      >
        {QUARTERS.map(quarter => (
          <TouchableOpacity
            key={quarter.id}
            style={[
              styles.quarterOption,
              { 
                backgroundColor: selectedQuarter === quarter.id ? theme.primary + '20' : theme.input,
                borderColor: theme.primary
              }
            ]}
            onPress={() => setSelectedQuarter(quarter.id)}
          >
            <MediumText style={{ color: selectedQuarter === quarter.id ? theme.primary : theme.text }}>
              {quarter.name}
            </MediumText>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <MediumText style={{ color: theme.text, marginTop: 8 }}>Select Year:</MediumText>
      <View style={styles.yearSelector}>
        <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <MediumText style={{ color: theme.text, marginHorizontal: 16 }}>
          {selectedYear}
        </MediumText>
        <TouchableOpacity 
          onPress={() => setSelectedYear(prev => prev + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedYear >= new Date().getFullYear() ? theme.text + '80' : theme.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  )}

  {dateFilterMode === 'year' && (
    <View>
      <MediumText style={{ color: theme.text, marginTop: 8 }}>Select Year:</MediumText>
      <View style={styles.yearSelector}>
        <TouchableOpacity onPress={() => setSelectedYear(prev => prev - 1)}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <MediumText style={{ color: theme.text, marginHorizontal: 16 }}>
          {selectedYear}
        </MediumText>
        <TouchableOpacity 
          onPress={() => setSelectedYear(prev => prev + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={selectedYear >= new Date().getFullYear() ? theme.text + '80' : theme.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  )}

  {showStartDatePicker && (
    <DateTimePicker
      value={startDate}
      mode="date"
      display="default"
      onChange={(event, date) => handleDateChange(event, date, 'start')}
      maximumDate={endDate}
    />
  )}
  
  {showEndDatePicker && (
    <DateTimePicker
      value={endDate}
      mode="date"
      display="default"
      onChange={(event, date) => handleDateChange(event, date, 'end')}
      minimumDate={startDate}
      maximumDate={new Date()}
    />
  )}
</View>
              
              {/* Activity Type Section */}
              <View style={styles.filterSection}>
  <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
    Activity Type
  </MediumText>
  
  <ScrollView 
    style={styles.optionsList} 
    nestedScrollEnabled={true}
    contentContainerStyle={styles.optionsContentContainer}
  >
    {activityTypes.map(type => (
      <TouchableOpacity 
        key={type.id}
        style={[
          styles.optionItem, 
          { 
            backgroundColor: selectedActivityType?.id === type.id 
              ? theme.primary + '20' 
              : 'transparent' 
          }
        ]}
        onPress={() => setSelectedActivityType(type)}
      >
        <MediumText style={{ 
          color: selectedActivityType?.id === type.id 
            ? theme.primary 
            : theme.text 
        }}>
          {type.name}
        </MediumText>
        {selectedActivityType?.id === type.id && (
          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
        )}
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
              
              {/* Restaurant Section (Admin only) */}
              {isAdmin && (
  <View style={styles.filterSection}>
    <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
      Filter by Coffee Shop
    </MediumText>
    
    <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
      <Ionicons name="search" size={20} color={theme.text} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search coffee shop..."
        placeholderTextColor={theme.text}
        value={restaurantSearchQuery}
        onChangeText={setRestaurantSearchQuery}
      />
      {restaurantSearchQuery !== '' && (
        <TouchableOpacity onPress={() => setRestaurantSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color={theme.text} />
        </TouchableOpacity>
      )}
    </View>
    
    <ScrollView style={styles.optionsList} nestedScrollEnabled={true}>
      <TouchableOpacity 
        style={[
          styles.optionItem, 
          { 
            backgroundColor: selectedRestaurants.length === 0 
              ? theme.primary + '20' 
              : 'transparent' 
          }
        ]}
        onPress={() => setSelectedRestaurants([])}
      >
        <MediumText style={{ 
          color: selectedRestaurants.length === 0 
            ? theme.primary 
            : theme.text 
        }}>
          All Coffee Shop
        </MediumText>
        {selectedRestaurants.length === 0 && (
          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
        )}
      </TouchableOpacity>
      
      {filteredRestaurants.map(restaurant => (
        <TouchableOpacity 
          key={restaurant._id}
          style={[
            styles.optionItem, 
            { 
              backgroundColor: selectedRestaurants.some(r => r._id === restaurant._id)
                ? theme.primary + '20' 
                : 'transparent' 
            }
          ]}
          onPress={() => {
            if (selectedRestaurants.some(r => r._id === restaurant._id)) {
              // Remove if already selected
              setSelectedRestaurants(selectedRestaurants.filter(r => r._id !== restaurant._id));
            } else {
              // Add to selection
              setSelectedRestaurants([...selectedRestaurants, restaurant]);
            }
          }}
        >
          <MediumText style={{ 
            color: selectedRestaurants.some(r => r._id === restaurant._id)
              ? theme.primary 
              : theme.text 
          }}>
            {restaurant.name}
          </MediumText>
          {selectedRestaurants.some(r => r._id === restaurant._id) && (
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
              
              {/* Customer Section */}
              {isAdmin && (
  <View style={styles.filterSection}>
    <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
      Filter by Customer
    </MediumText>
    
    <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
      <Ionicons name="search" size={20} color={theme.text} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Search customers..."
        placeholderTextColor={theme.text}
        value={customerSearchQuery}
        onChangeText={setCustomerSearchQuery}
      />
      {customerSearchQuery !== '' && (
        <TouchableOpacity onPress={() => setCustomerSearchQuery('')}>
          <Ionicons name="close-circle" size={20} color={theme.text} />
        </TouchableOpacity>
      )}
    </View>
    
    <ScrollView style={styles.optionsList} nestedScrollEnabled={true}>
      <TouchableOpacity 
        style={[
          styles.optionItem, 
          { 
            backgroundColor: selectedCustomers.length === 0 
              ? theme.primary + '20' 
              : 'transparent' 
          }
        ]}
        onPress={() => setSelectedCustomers([])}
      >
        <MediumText style={{ 
          color: selectedCustomers.length === 0 
            ? theme.primary 
            : theme.text 
        }}>
          All Customers
        </MediumText>
        {selectedCustomers.length === 0 && (
          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
        )}
      </TouchableOpacity>
      
      {filteredUsers.map(user => (
        <TouchableOpacity 
          key={user._id}
          style={[
            styles.optionItem, 
            { 
              backgroundColor: selectedCustomers.some(c => c._id === user._id)
                ? theme.primary + '20' 
                : 'transparent' 
            }
          ]}
          onPress={() => {
            if (selectedCustomers.some(c => c._id === user._id)) {
              // Remove if already selected
              setSelectedCustomers(selectedCustomers.filter(c => c._id !== user._id));
            } else {
              // Add to selection
              setSelectedCustomers([...selectedCustomers, user]);
            }
          }}
        >
          <MediumText style={{ 
            color: selectedCustomers.some(c => c._id === user._id)
              ? theme.primary 
              : theme.text 
          }}>
            {user.firstName} {user.lastName}
          </MediumText>
          {selectedCustomers.some(c => c._id === user._id) && (
            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
              
              {/* Container Type Section */}
              <View style={styles.filterSection}>
  <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
    Filter by Cup type
  </MediumText>
  
  <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
    <Ionicons name="search" size={20} color={theme.text} />
    <TextInput
      style={[styles.searchInput, { color: theme.text }]}
      placeholder="Search cup type..."
      placeholderTextColor={theme.text}
      value={containerTypeSearchQuery}
      onChangeText={setContainerTypeSearchQuery}
    />
    {containerTypeSearchQuery !== '' && (
      <TouchableOpacity onPress={() => setContainerTypeSearchQuery('')}>
        <Ionicons name="close-circle" size={20} color={theme.text} />
      </TouchableOpacity>
    )}
  </View>
  
  <ScrollView style={styles.optionsList} nestedScrollEnabled={true}>
    <TouchableOpacity 
      style={[
        styles.optionItem, 
        { 
          backgroundColor: selectedContainerTypes.length === 0 
            ? theme.primary + '20' 
            : 'transparent' 
        }
      ]}
      onPress={() => setSelectedContainerTypes([])}
    >
      <MediumText style={{ 
        color: selectedContainerTypes.length === 0 
          ? theme.primary 
          : theme.text 
      }}>
        All Cup type
      </MediumText>
      {selectedContainerTypes.length === 0 && (
        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
      )}
    </TouchableOpacity>
    
    {filteredContainerTypes.map(type => (
      <TouchableOpacity 
        key={type._id}
        style={[
          styles.optionItem, 
          { 
            backgroundColor: selectedContainerTypes.some(t => t._id === type._id)
              ? theme.primary + '20' 
              : 'transparent' 
          }
        ]}
        onPress={() => {
          if (selectedContainerTypes.some(t => t._id === type._id)) {
            // Remove if already selected
            setSelectedContainerTypes(selectedContainerTypes.filter(t => t._id !== type._id));
          } else {
            // Add to selection
            setSelectedContainerTypes([...selectedContainerTypes, type]);
          }
        }}
      >
        <MediumText style={{ 
          color: selectedContainerTypes.some(t => t._id === type._id)
            ? theme.primary 
            : theme.text 
        }}>
          {type.name}
        </MediumText>
        {selectedContainerTypes.some(t => t._id === type._id) && (
          <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
        )}
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
            </ScrollView>
            
            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={[styles.resetButton, { borderColor: theme.primary }]}
                onPress={resetFilters}
              >
                <MediumText style={{ color: theme.primary }}>
                  Reset Filters
                </MediumText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.applyButton, { backgroundColor: theme.primary }]}
                onPress={applyFilters}
              >
                <MediumText style={{ color: '#FFFFFF' }}>
                  Apply Filters
                </MediumText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    {/* Export Modal */}
<Modal
  transparent={true}
  animationType="slide"
  visible={exportModalVisible}
  onRequestClose={() => setExportModalVisible(false)}
>
  <View style={styles.filterModalOverlay}>
    <View style={[styles.exportModalContainer, { backgroundColor: theme.background }]}>
      <View style={styles.filterModalHeader}>
        <BoldText style={{ fontSize: 20, color: theme.text }}>
          Export Report
        </BoldText>
        <TouchableOpacity onPress={() => setExportModalVisible(false)}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.exportContent}>
        <View style={[styles.exportPreview, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="document-text-outline" size={48} color={theme.primary} />
          <MediumText style={{ color: theme.text, marginTop: 16 }}>
            Export Report
          </MediumText>
          <RegularText style={{ color: theme.text, marginTop: 8, textAlign: 'center' }}>
            Choose a format to export your report data
          </RegularText>
        </View>
        
        <View style={styles.exportDetails}>
          <View style={styles.exportDetailItem}>
            <RegularText style={{ color: theme.text }}>
              Date Range:
            </RegularText>
            <MediumText style={{ color: theme.text }}>
              {formatDate(startDate)} - {formatDate(endDate)}
            </MediumText>
          </View>
          
          <View style={styles.exportDetailItem}>
            <RegularText style={{ color: theme.text }}>
              Total Records:
            </RegularText>
            <MediumText style={{ color: theme.text }}>
              {totalTransactions}
            </MediumText>
          </View>
          
          {selectedActivityType && (
            <View style={styles.exportDetailItem}>
              <RegularText style={{ color: theme.text }}>
                Activity Type:
              </RegularText>
              <MediumText style={{ color: theme.text }}>
                {selectedActivityType.name}
              </MediumText>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.exportFormatButtons}>
        <TouchableOpacity 
          style={[styles.exportFormatButton, { backgroundColor: theme.primary }]}
          onPress={exportToCSV}
        >
          <Ionicons name="document-text-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <MediumText style={{ color: '#FFFFFF' }}>
            CSV
          </MediumText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.exportFormatButton, { backgroundColor: theme.primary }]}
          onPress={generatePdfReport}
        >
          <Ionicons name="document-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <MediumText style={{ color: '#FFFFFF' }}>
            PDF
          </MediumText>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
};

// Helper functions
const formatActivityType = (type) => {
  switch (type) {
    case 'registration':
      return 'Registration';
    case 'return':
      return 'Return';
    case 'rebate':
      return 'Rebate';
    case 'status_change':
      return 'Status Change';
    default:
      return type;
  }
};

const getActivityTypeColor = (type, theme) => {
  switch (type) {
    case 'registration':
      return theme.primary;
    case 'return':
      return '#2196F3'; // Changed to blue
    case 'rebate':
      return '#FF9800'; // Orange
    case 'status_change':
      return '#9C27B0'; // Purple
    default:
      return theme.text;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 2 : 10,
    height: Platform.OS === 'android' ? 76 : 56,
  },
  headerTitle: {
    fontSize: 20,
  },
  dateRangeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterBadgesContainer: {
    maxHeight: 40,
    paddingHorizontal: 16,
  },
  filterBadgesContent: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tableHeaderCell: {
    fontWeight: '600',
    fontSize: 10, 
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 8, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    paddingRight: 4,
    fontSize: 9,
    marginHorizontal: 2,
    paddingHorizontal: 2, // Added horizontal padding
  },
  activityTypeBadge: {
    alignSelf: 'flex-start',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterSection: {
    marginVertical: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
  },
  optionsList: {
    maxHeight: 200,
    marginTop: 8,
  },
  optionsContentContainer: {
    paddingBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportModalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
  },
  exportContent: {
    padding: 16,
  },
  exportPreview: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
  },
  exportDetails: {
    marginTop: 24,
  },
  exportDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  dateModeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  dateModeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateModeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    
  },
  monthScrollView: {
    marginTop: 8,
    marginBottom: 8
  },
  monthOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8
  },
  quarterScrollView: {
    marginTop: 8,
    marginBottom: 8
  },
  quarterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  // Add these to your styles object
exportFormatButtons: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  width: '100%',
  marginTop: 16,
},
exportFormatButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
  borderRadius: 8,
  width: '45%',
},
});

export default GenerateReportScreen;