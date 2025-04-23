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
  Alert
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


const GenerateReportScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'admin';
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalRebateAmount, setTotalRebateAmount] = useState(0);

  // Filter states
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedContainerType, setSelectedContainerType] = useState(null);
  
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

  // Activity types
  const activityTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'registration', name: 'Registration' },
    { id: 'return', name: 'Return' },
    { id: 'rebate', name: 'Rebate' },
    { id: 'status_change', name: 'Status Change' }
  ];

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
      }
      
      await fetchContainerTypes();
      
      // Load report data with default filters
      await fetchReportData();
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
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
      console.error('Error fetching restaurants:', error);
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
      console.error('Error fetching container types:', error);
      Alert.alert('Error', 'Failed to load container types. Please try again.');
    }
  };
  
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      
      if (selectedActivityType && selectedActivityType.id !== 'all') {
        params.append('type', selectedActivityType.id);
      }
      
      if (selectedRestaurant) {
        params.append('restaurantId', selectedRestaurant._id);
      }
      
      if (selectedCustomer) {
        params.append('userId', selectedCustomer._id); // Changed from userId to user._id if needed
      }
      
      if (selectedContainerType) {
        params.append('containerTypeId', selectedContainerType._id);
      }
      
      // Call API
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(
        getApiUrl('/activities/reports/filtered') + '?' + params.toString(), // Changed endpoint to match backend
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      
      setActivities(response.data.activities);
      setTotalTransactions(response.data.totalActivities);
      
      // Calculate total rebate amount if applicable
      if (selectedActivityType?.id === 'rebate' || !selectedActivityType) {
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
    fetchReportData();
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)));
    setEndDate(new Date());
    setSelectedActivityType(null);
    setSelectedRestaurant(null);
    setSelectedCustomer(null);
    setSelectedContainerType(null);
  };

  const exportToCSV = async () => {
    try {
      // Create CSV header
      let csvContent = "\"TransactionID\",\"Date\",\"Customer\",";
      
      if (isAdmin) {
        csvContent += "\"Restaurant\",";
      }
      
      csvContent += "\"Container Type\",\"Activity Type\",\"Status\"";
      
      if (selectedActivityType?.id === 'rebate' || !selectedActivityType) {
        csvContent += ",\"Rebate Amount\"";
      }
      
      csvContent += "\n";
      
      // Add data rows
      activities.forEach(activity => {
        const customerName = `${activity.userId?.firstName || ''} ${activity.userId?.lastName || ''}`;
        const containerTypeName = activity.containerTypeId?.name || activity.containerId?.containerTypeId?.name || 'N/A';
        // Format date to avoid CSV splitting it
        const date = new Date(activity.createdAt).toLocaleString();
        
        let row = `\"${activity._id}\",\"${date}\",\"${customerName}\",`;
        
        if (isAdmin) {
          row += `\"${activity.restaurantId?.name || 'N/A'}\",`;
        }
        
        row += `\"${containerTypeName}\",\"${activity.type}\",\"${activity.status}\"`;
        
        if (selectedActivityType?.id === 'rebate' || !selectedActivityType) {
          row += `,\"${activity.type === 'rebate' ? activity.amount.toFixed(2) : '0.00'}\"`;
        }
        
        row += "\n";
        csvContent += row;
      });
      
      // Add totals row
      let totalsRow = `\"Total\",\"\",\"\",`;
      
      if (isAdmin) {
        totalsRow += `\"\",`;
      }
      
      totalsRow += `\"\",\"\",\"${totalTransactions} transactions\"`;
      
      if (selectedActivityType?.id === 'rebate' || !selectedActivityType) {
        totalsRow += `,\"${totalRebateAmount.toFixed(2)}\"`;
      }
      
      csvContent += totalsRow;
      
      // Generate filename with current date
      const dateString = new Date().toISOString().split('T')[0];
      const fileName = `AQRO_Report_${dateString}.csv`;
      
      // Create file
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(
          'Export Complete',
          `Report saved to ${fileUri}`,
          [{ text: 'OK' }]
        );
      }
      
      setExportModalVisible(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Export Failed', 'Failed to export report. Please try again.');
    }
  };

  const renderFilterBadges = () => {
    const badges = [];
    
    if (selectedActivityType) {
      badges.push(
        <TouchableOpacity 
          key="type" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedActivityType.name}
          </MediumText>
          <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
    }
    
    if (selectedRestaurant) {
      badges.push(
        <TouchableOpacity 
          key="restaurant" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedRestaurant.name}
          </MediumText>
          <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
    }
    
    if (selectedCustomer) {
      badges.push(
        <TouchableOpacity 
          key="customer" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedCustomer.firstName} {selectedCustomer.lastName}
          </MediumText>
          <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
    }
    
    if (selectedContainerType) {
      badges.push(
        <TouchableOpacity 
          key="containerType" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedContainerType.name}
          </MediumText>
          <Ionicons name="close-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      );
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
        <MediumText style={{ color: theme.text, marginTop: 4 }}>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        </MediumText>
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
        
        {(selectedActivityType?.id === 'rebate' || !selectedActivityType) && (
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
        <ScrollView style={styles.contentContainer}>
          {/* Table Header */}
          <View style={[styles.tableHeader, { backgroundColor: theme.cardBackground }]}>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.2, fontSize: 10 }]}>
                        Date
                    </MediumText>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10  }]}>
                        Customer
                    </MediumText>
                    {isAdmin && (
                        <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1.5, fontSize: 10  }]}>
                        Restaurant
                        </MediumText>
                    )}
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1, fontSize: 10  }]}>
                        Container
                    </MediumText>
                    <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 1, fontSize: 10  }]}>
                        Activity
                    </MediumText>
                    {(selectedActivityType?.id === 'rebate' || !selectedActivityType) && (
                        <MediumText style={[styles.tableHeaderCell, { color: theme.text, flex: 0.8 }]}>
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
               <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.2 }]}>
                {new Date(activity.createdAt).toLocaleDateString()}
                </RegularText>
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.5 }]}>
                {activity.userId?.firstName || ''} {activity.userId?.lastName || ''}
                </RegularText>
                {isAdmin && (
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1.5 }]}>
                    {activity.restaurantId?.name || 'N/A'}
                </RegularText>
                )}
                <RegularText style={[styles.tableCell, { color: theme.text, flex: 1 }]}>
                {activity.containerTypeId?.name || activity.containerId?.containerTypeId?.name || 'N/A'}
                </RegularText>
                <View style={[styles.tableCell, { flex: 1 }]}>
                  <View style={[
                    styles.activityTypeBadge, 
                    { 
                      backgroundColor: getActivityTypeColor(activity.type, theme),
                      borderRadius: 4,
                      paddingVertical: 2,
                      paddingHorizontal: 4
                    }
                  ]}>
                    <RegularText style={{ color: '#FFFFFF', fontSize: 8 }}>
                      {formatActivityType(activity.type)}
                    </RegularText>
                  </View>
                </View>
                {(selectedActivityType?.id === 'rebate' || !selectedActivityType) && (
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
                  Date Range
                </MediumText>
                
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity 
                    style={[styles.datePickerButton, { backgroundColor: theme.input }]}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={theme.text} />
                    <RegularText style={{ marginLeft: 8, color: theme.text }}>
                      {startDate.toLocaleDateString()}
                    </RegularText>
                  </TouchableOpacity>
                  
                  <RegularText style={{ marginHorizontal: 8, color: theme.text }}>to</RegularText>
                  
                  <TouchableOpacity 
                    style={[styles.datePickerButton, { backgroundColor: theme.input }]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={theme.text} />
                    <RegularText style={{ marginLeft: 8, color: theme.text }}>
                      {endDate.toLocaleDateString()}
                    </RegularText>
                  </TouchableOpacity>
                </View>
                
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
                    Filter by Restaurant
                  </MediumText>
                  
                  <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
                    <Ionicons name="search" size={20} color={theme.text} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search restaurants..."
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
                        { backgroundColor: !selectedRestaurant ? theme.primary + '20' : 'transparent' }
                      ]}
                      onPress={() => setSelectedRestaurant(null)}
                    >
                      <MediumText style={{ color: !selectedRestaurant ? theme.primary : theme.text }}>
                        All Restaurants
                      </MediumText>
                      {!selectedRestaurant && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                    
                    {filteredRestaurants.map(restaurant => (
                      <TouchableOpacity 
                        key={restaurant._id}
                        style={[
                          styles.optionItem, 
                          { 
                            backgroundColor: selectedRestaurant?._id === restaurant._id 
                              ? theme.primary + '20' 
                              : 'transparent' 
                          }
                        ]}
                        onPress={() => setSelectedRestaurant(restaurant)}
                      >
                        <MediumText style={{ 
                          color: selectedRestaurant?._id === restaurant._id 
                            ? theme.primary 
                            : theme.text 
                        }}>
                          {restaurant.name}
                        </MediumText>
                        {selectedRestaurant?._id === restaurant._id && (
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
                        { backgroundColor: !selectedCustomer ? theme.primary + '20' : 'transparent' }
                      ]}
                      onPress={() => setSelectedCustomer(null)}
                    >
                      <MediumText style={{ color: !selectedCustomer ? theme.primary : theme.text }}>
                        All Customers
                      </MediumText>
                      {!selectedCustomer && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                    
                    {filteredUsers.map(user => (
                      <TouchableOpacity 
                        key={user._id}
                        style={[
                          styles.optionItem, 
                          { 
                            backgroundColor: selectedCustomer?._id === user._id 
                              ? theme.primary + '20' 
                              : 'transparent' 
                          }
                        ]}
                        onPress={() => setSelectedCustomer(user)}
                      >
                        <MediumText style={{ 
                          color: selectedCustomer?._id === user._id 
                            ? theme.primary 
                            : theme.text 
                        }}>
                          {user.firstName} {user.lastName}
                        </MediumText>
                        {selectedCustomer?._id === user._id && (
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
                  Filter by Container Type
                </MediumText>
                
                <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
                  <Ionicons name="search" size={20} color={theme.text} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search container types..."
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
                      { backgroundColor: !selectedContainerType ? theme.primary + '20' : 'transparent' }
                    ]}
                    onPress={() => setSelectedContainerType(null)}
                  >
                    <MediumText style={{ color: !selectedContainerType ? theme.primary : theme.text }}>
                      All Container Types
                    </MediumText>
                    {!selectedContainerType && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                  
                  {filteredContainerTypes.map(type => (
                    <TouchableOpacity 
                      key={type._id}
                      style={[
                        styles.optionItem, 
                        { 
                          backgroundColor: selectedContainerType?._id === type._id 
                            ? theme.primary + '20' 
                            : 'transparent' 
                        }
                      ]}
                      onPress={() => setSelectedContainerType(type)}
                    >
                      <MediumText style={{ 
                        color: selectedContainerType?._id === type._id 
                          ? theme.primary 
                          : theme.text 
                      }}>
                        {type.name}
                      </MediumText>
                      {selectedContainerType?._id === type._id && (
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
                  Export Report to CSV
                </MediumText>
                <RegularText style={{ color: theme.text, marginTop: 8, textAlign: 'center' }}>
                  This will generate a CSV file with all the data currently shown in the report.
                </RegularText>
              </View>
              
              <View style={styles.exportDetails}>
                <View style={styles.exportDetailItem}>
                  <RegularText style={{ color: theme.text }}>
                    Date Range:
                  </RegularText>
                  <MediumText style={{ color: theme.text }}>
                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
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
            
            <TouchableOpacity 
              style={[styles.exportButton, { backgroundColor: theme.primary }]}
              onPress={exportToCSV}
            >
              <Ionicons name="download-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <MediumText style={{ color: '#FFFFFF' }}>
                Export to CSV
              </MediumText>
            </TouchableOpacity>
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
      return '#4CAF50'; // Green
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tableHeaderCell: {
    fontWeight: '600',
    fontSize: 12, // Smaller font for mobile
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tableCell: {
    paddingRight: 4, // Reduced padding for mobile
    fontSize: 11, // Smaller font for mobile
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
});

export default GenerateReportScreen;