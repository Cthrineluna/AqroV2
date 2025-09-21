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
  Modal,
  Image,
  Text
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
  const { userType, isAdminHome } = route.params || {};
  
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
const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);
const [selectedRestaurants, setSelectedRestaurants] = useState([]);
const [selectedContainerTypes, setSelectedContainerTypes] = useState([]);
  
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
    if (selectedActivityTypes.length > 0 && !selectedActivityTypes.includes(activity.type)) {
      return false;
    }
    
    if (selectedContainerTypes.length > 0 && 
        !selectedContainerTypes.some(type => type._id === activity.containerId?.containerTypeId?._id)) {
      return false;
    }
    
    if (selectedRestaurants.length > 0 && 
        !selectedRestaurants.some(rest => rest._id === activity.restaurantId?._id)) {
      return false;
    }
    
    return true;
  });
}, [selectedActivityTypes, selectedContainerTypes, selectedRestaurants]);

 const fetchReportData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    if (!user) {
      console.log('No user found, skipping report loading');
      setLoading(false);
      return; 
    }

    const token = await AsyncStorage.getItem('aqro_token');
    if (!token) {
      console.log('No authentication token found, user may have logged out');
      setLoading(false);
      return;
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

    // This will store two sets of filtered activities - one for the chart and one for the summary cards
    let timeFrameFilteredActivities; // For summary cards
    let chartFilteredActivities; // For the chart display

    // Filter for different time frames
    if (timeFrame === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      timeFrameFilteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= weekStart;
      });
      chartFilteredActivities = timeFrameFilteredActivities; // Same for week view
    } else if (timeFrame === 'month') {
      // For summary cards - only current month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      timeFrameFilteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
      });
      
      // For chart - include the last 12 months of data
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      chartFilteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= monthStart;
      });
    } else if (timeFrame === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      timeFrameFilteredActivities = filteredActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= yearStart;
      });
      chartFilteredActivities = timeFrameFilteredActivities; // Same for year view
    } else {
      // Default fallback
      timeFrameFilteredActivities = filteredActivities;
      chartFilteredActivities = filteredActivities;
    }
    
    // Use chartFilteredActivities for chart data
    if (activeReport === 'activity') {
      const groupedByDay = groupActivitiesByTimeFrame(chartFilteredActivities, timeFrame);
      setReportData(formatChartData(groupedByDay, 'Activity Count', timeFrame));
    } else if (activeReport === 'rebate') {
      const rebateActivities = chartFilteredActivities.filter(a => a.type === 'rebate');
      const groupedRebates = groupRebatesByTimeFrame(rebateActivities, timeFrame);
      setReportData(formatChartData(groupedRebates, 'Rebate Amount (₱)', timeFrame));
    } else if (activeReport === 'container') {
      const groupedByType = groupByContainerType(chartFilteredActivities, timeFrame);
      setReportData(formatBarChartData(groupedByType, 'Container Usage'));
    }
    
    // Use timeFrameFilteredActivities for summary data
    const totalActivities = timeFrameFilteredActivities.length;
    const rebateActivities = timeFrameFilteredActivities.filter(a => a.type === 'rebate');
    const totalRebates = rebateActivities ? rebateActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0) : 0;
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
}, [activeReport, timeFrame, user, selectedActivityTypes, 
    selectedContainerTypes, selectedRestaurants, restaurants.length, containerTypes.length]);

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

  useEffect(() => {
    // If no user exists, don't try to fetch any data
    if (!user) {
      // Clear any loaded data
      setReportData(null);
      setSummaryData({
        totalActivities: 0,
        totalRebates: '0.00',
        activeContainers: 0,
        returnRate: 0
      });
    }
  }, [user]);
  
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
      console.error('Error fetching cup size:', error);
    }
  };

 const groupActivitiesByTimeFrame = (activities, timeFrame) => {
  const grouped = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.createdAt);
    let key;
    
    if (timeFrame === 'week') {
      key = date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (timeFrame === 'month') {
      // For monthly view, use YYYY-MM format to distinguish between same month in different years
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      key = `${month} ${year}`;
    } else if (timeFrame === 'year') {
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
      // For monthly view, use YYYY-MM format to distinguish between same month in different years
      const year = date.getFullYear();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      key = `${month} ${year}`;
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
  
const groupByContainerType = (activities, timeFrame) => {
  const grouped = {};
  
  if (!activities || !Array.isArray(activities)) {
    console.warn('Invalid activities data in groupByContainerType', activities);
    return {};
  }

  const now = new Date();
  let filteredActivities = activities;

  // Filter activities based on time frame
  if (timeFrame === 'month') {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    filteredActivities = activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
    });
  } else if (timeFrame === 'week') {
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    filteredActivities = activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      return activityDate >= weekStart;
    });
  } else if (timeFrame === 'year') {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    filteredActivities = activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      return activityDate >= yearStart;
    });
  }
  
  filteredActivities.forEach(activity => {
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
    // Weekly logic stays the same
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
      labels.push(day);
      data.push(groupedData[day] || 0);
    });
  } else if (timeFrame === 'month') {
    // Show all months of current year
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach(month => {
      const monthYearKey = `${month} ${currentYear}`;
      labels.push(month);
      data.push(groupedData[monthYearKey] || 0);
    });
  } else if (timeFrame === 'year') {
    // Year logic stays the same
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
  setSelectedActivityTypes([]);
  setSelectedRestaurants([]);
  setSelectedContainerTypes([]);
};

  const applyFilters = () => {
    fetchReportData();
    setShowFilters(false);
  };

const renderFilterBadges = () => {
  const badges = [];
  
  selectedActivityTypes.forEach(typeId => {
    const type = activityTypes.find(t => t.id === typeId);
    if (type) {
      badges.push(
        <TouchableOpacity 
          key={`type-${typeId}`} 
          style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
        >
          <MediumText style={{ color: theme.primary, fontSize: 12 }}>
            {type.name}
          </MediumText>
          <TouchableOpacity 
            onPress={() => setSelectedActivityTypes(prev => prev.filter(id => id !== typeId))}
            style={{ marginLeft: 4 }}
          >
            <Ionicons name="close-circle" size={14} color={theme.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
  });
  
  selectedRestaurants.forEach(restaurant => {
    badges.push(
      <TouchableOpacity 
        key={`rest-${restaurant._id}`} 
        style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
      >
        <MediumText style={{ color: theme.primary, fontSize: 12 }}>
          {restaurant.name}
        </MediumText>
        <TouchableOpacity 
          onPress={() => setSelectedRestaurants(prev => prev.filter(r => r._id !== restaurant._id))}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="close-circle" size={14} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  });
  
  selectedContainerTypes.forEach(containerType => {
    badges.push(
      <TouchableOpacity 
        key={`cont-${containerType._id}`} 
        style={[styles.filterBadge, { backgroundColor: theme.primary + '20' }]}
      >
        <MediumText style={{ color: theme.primary, fontSize: 12 }}>
          {containerType.name}
        </MediumText>
        <TouchableOpacity 
          onPress={() => setSelectedContainerTypes(prev => prev.filter(c => c._id !== containerType._id))}
          style={{ marginLeft: 4 }}
        >
          <Ionicons name="close-circle" size={14} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  });
  
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

  const renderProfileImage = () => {
    if (user?.profilePicture) {
      return (
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profileImage}
          onError={(e) => {
            console.log("Image loading error:", e.nativeEvent.error);
          }}
        />
      );
    } else {
      return (
        <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="person" size={35} color={theme.primary} />
        </View>
      );
    }
  };

  const renderHeader = () => {
    if (isAdminHome) {
      return (
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.headerLetter, { color: theme.text }]}>A</Text>
            <Text style={[styles.headerLetter, { color: theme.primary }]}>Q</Text>
            <Text style={[styles.headerLetter, { color: theme.primary }]}>R</Text>
            <Text style={[styles.headerLetter, { color: theme.text }]}>O</Text>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setShowFilters(true)} style={{ marginRight: 16 }}>
              <Ionicons name="options-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('GenerateReport')}>
              <Ionicons name="calendar-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
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
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor={theme.background}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      
      {renderHeader()}
      
      {isAdminHome && (
        <View style={styles.greetings}>
          <View>
            <SemiBoldText style={[styles.greetingsHeader, { color: theme.text }]}>
              Hello Admin, {user?.firstName || 'User'}!
            </SemiBoldText>
            <RegularText style={[styles.subGreetings, { color: theme.primary }]}>
              Your dashboard is ready!
            </RegularText> 
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
          >
            {renderProfileImage()}
          </TouchableOpacity>
        </View>
      )}
      
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
            title="Cups"
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
            {activeReport === 'activity' && 'Cup Activity Trend'}
            {activeReport === 'rebate' && 'Rebate Distribution'}
            {activeReport === 'container' && 'Cup Usage by Type'}
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
            title="Cup Containers" 
            value={summaryData.activeContainers.toString()} 
            icon="cafe-outline" 
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
      backgroundColor: (type.id === null && selectedActivityTypes.length === 0) || 
        selectedActivityTypes.includes(type.id) 
        ? theme.primary + '20' 
        : 'transparent' 
    }
  ]}
  onPress={() => {
    if (type.id === null) {
      setSelectedActivityTypes([]);
    } else {
      setSelectedActivityTypes(prev => 
        prev.includes(type.id) 
          ? prev.filter(id => id !== type.id)
          : [...prev, type.id]
      );
    }
  }}
>
  <MediumText style={{ 
    color: (type.id === null && selectedActivityTypes.length === 0) || 
      selectedActivityTypes.includes(type.id) 
      ? theme.primary 
      : theme.text 
  }}>
    {type.name}
  </MediumText>
  {((type.id === null && selectedActivityTypes.length === 0) || 
    selectedActivityTypes.includes(type.id)) && (
    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
  )}
</TouchableOpacity>
))}
                </ScrollView>
              </View>
              
              {/* Coffee Shop Section (Admin only) */}
              {user?.userType === 'admin' && (
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
    { backgroundColor: selectedRestaurants.length === 0 ? theme.primary + '20' : 'transparent' }
  ]} 
  onPress={() => setSelectedRestaurants([])}
>
  <MediumText style={{ color: selectedRestaurants.length === 0 ? theme.primary : theme.text }}>
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
          backgroundColor: selectedRestaurants && selectedRestaurants.some(r => r._id === restaurant._id) 
            ? theme.primary + '20' 
            : 'transparent' 
        }
      ]} 
      onPress={() => {
        if (!selectedRestaurants) {
          setSelectedRestaurants([restaurant]);
        } else {
          setSelectedRestaurants(prev => 
            prev.some(r => r._id === restaurant._id) 
              ? prev.filter(r => r._id !== restaurant._id) 
              : [...prev, restaurant]
          );
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
    { backgroundColor: selectedContainerTypes.length === 0 ? theme.primary + '20' : 'transparent' }
  ]}
  onPress={() => setSelectedContainerTypes([])}
>
  <MediumText style={{ color: selectedContainerTypes.length === 0 ? theme.primary : theme.text }}>
    All cup type
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
          backgroundColor: selectedContainerTypes && selectedContainerTypes.some(c => c._id === type._id)
            ? theme.primary + '20' 
            : 'transparent' 
        }
      ]}
      onPress={() => {
        if (!selectedContainerTypes) {
          setSelectedContainerTypes([type]);
        } else {
          setSelectedContainerTypes(prev => 
            prev.some(c => c._id === type._id)
              ? prev.filter(c => c._id !== type._id)
              : [...prev, type]
          );
        }
      }}
    >
      <MediumText style={{ 
        color: selectedContainerTypes && selectedContainerTypes.some(c => c._id === type._id)
          ? theme.primary 
          : theme.text 
      }}>
        {type.name}
      </MediumText>
      {selectedContainerTypes && selectedContainerTypes.some(c => c._id === type._id) && (
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 4 : 10,
    marginBottom: 16,  
  },
  headerLetter: {
    fontSize: 26,
    fontFamily: 'Arial',
    lineHeight: 30,
    fontWeight: '550',

  },
  headerTitle: {
    fontSize: 20,
  },
  greetings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileImage: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
  },  
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 40, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingsHeader: {
    fontSize: 24,
  },
  subGreetings: {
    fontSize: 16,
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