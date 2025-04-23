import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  RegularText,
  SemiBoldText,
  BoldText,
  MediumText
} from '../../components/StyledComponents';
import { getRestaurantActivities, getAllActivities, getAllActivitiesAdmin } from '../../services/activityService';
import * as NavigationBar from 'expo-navigation-bar';
import { LineChart, BarChart } from 'react-native-chart-kit';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const ReportsScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { userType } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeReport, setActiveReport] = useState('activity');
  const [timeFrame, setTimeFrame] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [summaryData, setSummaryData] = useState({
    totalActivities: 0,
    totalRebates: 0,
    activeContainers: 0,
    returnRate: 0
  });
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
 
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedContainerType, setSelectedContainerType] = useState(null);
  
  // Data for filters
  const [restaurants, setRestaurants] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  
  // Search queries
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [containerTypeSearchQuery, setContainerTypeSearchQuery] = useState('');

  // Filtered data
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
  );
  
  const filteredContainerTypes = containerTypes.filter(type => 
    type.name.toLowerCase().includes(containerTypeSearchQuery.toLowerCase())
  );

  // Activity types
  const activityTypes = [
    { id: null, name: 'All Types' },
    { id: 'registration', name: 'Registration' },
    { id: 'return', name: 'Return' },
    { id: 'rebate', name: 'Rebate' },
    { id: 'status_change', name: 'Status Change' }
  ];

  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(theme.background);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [theme, isDark]);

  const getFilteredActivities = useCallback((activities) => {
    if (!activities) return [];
    
    return activities.filter(activity => {    
      if (selectedActivityType && activity.type !== selectedActivityType) return false;
      
      if (selectedContainerType && 
          activity.containerId?.containerTypeId?._id !== selectedContainerType._id) return false;
      
      if (selectedRestaurant && activity.restaurantId?._id !== selectedRestaurant._id) return false;
      
      return true;
    });
  }, [selectedActivityType, selectedContainerType, selectedRestaurant]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Load filter data if admin
      if (user?.userType === 'admin' && restaurants.length === 0) {
        await fetchRestaurants();
      }
      
      if (containerTypes.length === 0) {
        await fetchContainerTypes();
      }
      
      let activitiesResponse;
      if (user?.userType === 'admin') {
        activitiesResponse = await getAllActivitiesAdmin(1, 1000);
      } else if (user?.userType === 'staff') {
        activitiesResponse = await getRestaurantActivities(1, 1000);
      } else {
        activitiesResponse = await getAllActivities(1, 1000);
      }
      
      const activities = activitiesResponse?.activities || [];
      const filteredActivities = getFilteredActivities(activities);
      
      // Filter activities by time frame
      const now = new Date();
      let timeFrameFilteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        
        if (timeFrame === 'week') {
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
          return activityDate >= weekStart;
        } else if (timeFrame === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return activityDate >= monthStart;
        } else if (timeFrame === 'year') {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          return activityDate >= yearStart;
        }
        return true;
      });
      
      if (activeReport === 'activity') {
        const groupedByDay = groupActivitiesByTimeFrame(timeFrameFilteredActivities, timeFrame);
        setReportData(formatChartData(groupedByDay, 'Activity Count', timeFrame));
      } else if (activeReport === 'rebate') {
        const rebateActivities = timeFrameFilteredActivities.filter(a => a.type === 'rebate');
        const groupedRebates = groupRebatesByTimeFrame(rebateActivities, timeFrame);
        setReportData(formatChartData(groupedRebates, 'Rebate Amount (₱)', timeFrame));
      } else if (activeReport === 'container') {
        const groupedByType = groupByContainerType(timeFrameFilteredActivities);
        setReportData(formatBarChartData(groupedByType, 'Container Usage'));
      }
      
      const totalActivities = timeFrameFilteredActivities.length;
      const rebateActivities = timeFrameFilteredActivities.filter(a => a.type === 'rebate');
      const totalRebates = rebateActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0);
      const distinctContainers = new Set(timeFrameFilteredActivities.map(a => a.containerId?._id.toString()));
      const activeContainers = distinctContainers.size;
      const registrations = timeFrameFilteredActivities.filter(a => a.type === 'registration').length;
      const returns = timeFrameFilteredActivities.filter(a => a.type === 'return').length;
      const returnRate = registrations > 0 ? Math.round((returns / registrations) * 100) : 0;
      
      setSummaryData({
        totalActivities,
        totalRebates: totalRebates.toFixed(2),
        activeContainers,
        returnRate
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
      setLoading(false);
    }
  }, [activeReport, timeFrame, user, selectedActivityType, 
      selectedContainerType, selectedRestaurant, restaurants.length, containerTypes.length]);

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

  const fetchContainerTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(getApiUrl('/container-types'), {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setContainerTypes(response.data);
      }
    } catch (error) {
      console.error('Error fetching container types:', error);
    }
  };

  const groupActivitiesByTimeFrame = (activities, timeFrame) => {
    const grouped = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt);
      let key;
      
      if (timeFrame === 'week') {
        // Weekly - group by day of week (Sun-Sat)
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeFrame === 'month') {
        // Monthly - group by month name (Jan-Dec)
        key = date.toLocaleDateString('en-US', { month: 'short' });
      } else if (timeFrame === 'year') {
        // Yearly - group by full year (2020, 2021, etc.)
        key = date.getFullYear().toString();
      }
      
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      
      grouped[key] += 1;
    });
    
    return grouped;
  };
  
  const groupRebatesByTimeFrame = (activities, timeFrame) => {
    const grouped = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt);
      let key;
      
      if (timeFrame === 'week') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (timeFrame === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short' });
      } else if (timeFrame === 'year') {
        key = date.getFullYear().toString();
      }
      
      if (!grouped[key]) {
        grouped[key] = 0;
      }
      
      grouped[key] += (activity.amount || 0);
    });
    
    return grouped;
  };
  
  const groupByContainerType = (activities) => {
    const grouped = {};
    
    if (!activities || !Array.isArray(activities)) {
      console.warn('Invalid activities data in groupByContainerType', activities);
      return {};
    }
    
    activities.forEach(activity => {
      if (!activity || !activity.containerId) return;
      
      const containerType = activity.containerId?.containerTypeId?.name || 'Unknown';
      
      if (!grouped[containerType]) {
        grouped[containerType] = 0;
      }
      
      grouped[containerType] += 1;
    });
    
    return grouped;
  };

  const formatChartData = (groupedData, legend, timeFrame) => {
    let labels = [];
    let data = [];
    
    if (timeFrame === 'week') {
      // Weekly - show all days of week in order
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        labels.push(day);
        data.push(groupedData[day] || 0);
      });
    } else if (timeFrame === 'month') {
      // Monthly - show all months in order
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        labels.push(month);
        data.push(groupedData[month] || 0);
      });
    } else if (timeFrame === 'year') {
      // Yearly - show years in ascending order
      const years = Object.keys(groupedData)
        .map(year => parseInt(year))
        .sort((a, b) => a - b);
      
      years.forEach(year => {
        labels.push(year.toString());
        data.push(groupedData[year.toString()]);
      });
    }
    
    return {
      labels,
      datasets: [{
        data,
        color: () => theme.primary,
      }],
      legend: [legend]
    };
  };
  
  const formatBarChartData = (groupedData, legend) => {
    const labels = Object.keys(groupedData);
    const data = labels.map(label => groupedData[label]);
    
    return {
      labels,
      datasets: [
        {
          data,
          color: () => theme.primary,
        }
      ],
      legend: [legend]
    };
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportData().then(() => setRefreshing(false));
  }, [fetchReportData]);



  const resetFilters = () => {
    setSelectedActivityType(null);
    setSelectedRestaurant(null);
    setSelectedContainerType(null);
  };

  const applyFilters = () => {
    fetchReportData();
    setShowFilters(false);
  };

  const renderFilterBadges = () => {
    const badges = [];
    
    if (selectedActivityType) {
      badges.push(
        <TouchableOpacity 
          key="type" 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
          onPress={() => setShowFilters(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {activityTypes.find(t => t.id === selectedActivityType)?.name}
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
          onPress={() => setShowFilters(true)}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {selectedRestaurant.name}
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
          onPress={() => setShowFilters(true)}
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

  const chartConfig = {
    backgroundGradientFrom: theme.background,
    backgroundGradientTo: theme.background,
    decimalPlaces: 0,
    color: () => theme.text,
    labelColor: () => theme.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
  };

  const renderChart = () => {
    if (!reportData) return null;
    const chartWidth = screenWidth - 32;
    if (activeReport === 'container') {
      return (
        <BarChart
          data={reportData}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          verticalLabelRotation={0}
          fromZero
          showValuesOnTopOfBars
        />
      );
    }
    
    return (
      <LineChart
        data={reportData}
        width={chartWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  const ReportFilter = ({ title, active, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        active && { backgroundColor: theme.primary },
      ]}
      onPress={onPress}
    >
      <RegularText
        style={[
          styles.filterText,
          active && { color: '#FFFFFF' },
          !active && { color: theme.text },
        ]}
      >
        {title}
      </RegularText>
    </TouchableOpacity>
  );

  const TimeFrameFilter = ({ title, active, onPress }) => (
    <TouchableOpacity
      style={[
        styles.timeFrameButton,
        active && { backgroundColor: theme.primary },
        !active && { borderColor: theme.border },
      ]}
      onPress={onPress}
    >
      <RegularText
        style={[
          styles.timeFrameText,
          active && { color: '#FFFFFF' },
          !active && { color: theme.text },
        ]}
      >
        {title}
      </RegularText>
    </TouchableOpacity>
  );

  const SummaryCard = ({ title, value, icon }) => (
    <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
      <View style={styles.cardIcon}>
        <Ionicons name={icon} size={28} color={theme.primary} />
      </View>
      <View style={styles.cardContent}>
        <RegularText style={styles.cardTitle}>{title}</RegularText>
        <BoldText style={styles.cardValue}>{value}</BoldText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <BoldText style={[styles.headerTitle, { color: theme.text }]}>Reports</BoldText>
        
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setShowFilters(true)} style={{ marginRight: 16 }}>
            <Ionicons name="options-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('GenerateReport')}>
            <Ionicons name="calendar-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
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

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00df82']}
            tintColor={isDark ? '#00df82' : '#2e7d32'}
          />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.filterContainer}>
          <ReportFilter
            title="Activity"
            active={activeReport === 'activity'}
            onPress={() => setActiveReport('activity')}
          />
          <ReportFilter
            title="Rebates"
            active={activeReport === 'rebate'}
            onPress={() => setActiveReport('rebate')}
          />
          <ReportFilter
            title="Containers"
            active={activeReport === 'container'}
            onPress={() => setActiveReport('container')}
          />
        </View>
        
        <View style={styles.timeFrameContainer}>
          <TimeFrameFilter
            title="Weekly"
            active={timeFrame === 'week'}
            onPress={() => setTimeFrame('week')}
          />
          <TimeFrameFilter
            title="Monthly"
            active={timeFrame === 'month'}
            onPress={() => setTimeFrame('month')}
          />
          <TimeFrameFilter
            title="Yearly"
            active={timeFrame === 'year'}
            onPress={() => setTimeFrame('year')}
          />
        </View>
        
        <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
          <SemiBoldText style={[styles.chartTitle, { color: theme.text }]}>
            {activeReport === 'activity' && 'Container Activity Trend'}
            {activeReport === 'rebate' && 'Rebate Distribution'}
            {activeReport === 'container' && 'Container Usage by Type'}
          </SemiBoldText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={32} color={theme.text} />
              <RegularText style={{ color: theme.text, marginTop: 8 }}>{error}</RegularText>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={fetchReportData}
              >
                <RegularText style={{ color: '#FFFFFF' }}>Retry</RegularText>
              </TouchableOpacity>
            </View>
          ) : (
            renderChart()
          )}
        </View>
        
        <View style={styles.summaryContainer}>
          <SummaryCard 
            title="Total Activities" 
            value={summaryData.totalActivities.toString()} 
            icon="analytics-outline" 
          />
          <SummaryCard 
            title="Total Rebates" 
            value={`₱${summaryData.totalRebates}`} 
            icon="cash-outline" 
          />
        </View>
        
        <View style={styles.summaryContainer}>
          <SummaryCard 
            title="Containers Registered" 
            value={summaryData.activeContainers.toString()} 
            icon="cube-outline" 
          />
          <SummaryCard 
            title="Returns Rate" 
            value={`${summaryData.returnRate}%`} 
            icon="trending-up-outline" 
          />
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={[styles.filterModalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.filterModalHeader}>
              <BoldText style={{ fontSize: 20, color: theme.text }}>
                Filter Reports
              </BoldText>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              
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
                      key={type.id || 'all'}
                      style={[
                        styles.optionItem, 
                        { 
                          backgroundColor: selectedActivityType === type.id 
                            ? theme.primary + '20' 
                            : 'transparent' 
                        }
                      ]}
                      onPress={() => setSelectedActivityType(type.id)}
                    >
                      <MediumText style={{ 
                        color: selectedActivityType === type.id 
                          ? theme.primary 
                          : theme.text 
                      }}>
                        {type.name}
                      </MediumText>
                      {selectedActivityType === type.id && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Restaurant Section (Admin only) */}
              {user?.userType === 'admin' && (
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
    </SafeAreaView>
  );
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
  },
  timeFrameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,

  },
  timeFrameText: {
    fontSize: 14,
  },
chartContainer: {
  padding: 16,
  borderRadius: 12,
  marginBottom: 24,
  overflow: 'hidden', 
  width: '100%', 
},
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  cardValue: {
    fontSize: 20,
    marginTop: 4,
  },
  // New styles for filtering
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
});

export default ReportsScreen;