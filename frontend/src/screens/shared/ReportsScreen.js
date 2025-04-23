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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  RegularText,
  SemiBoldText,
  BoldText,
  ThemedView,
  PrimaryButton
} from '../../components/StyledComponents';
import { getRestaurantActivities, getAllActivities, getAllActivitiesAdmin } from '../../services/activityService';
import * as NavigationBar from 'expo-navigation-bar';
import { LineChart, BarChart } from 'react-native-chart-kit';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from 'expo-datepicker';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';

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
  const [startFilterDate, setStartFilterDate] = useState(null);
  const [endFilterDate, setEndFilterDate] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState(null);
  const [selectedContainerType, setSelectedContainerType] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantsList, setRestaurantsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [containerTypesList, setContainerTypesList] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start');

  const getFilteredActivities = useCallback((activities) => {
    if (!activities) return [];
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      
      if (startFilterDate && activityDate < new Date(startFilterDate)) return false;
      if (endFilterDate && activityDate > new Date(endFilterDate)) return false;
      
      if (selectedCustomer && activity.userId?._id !== selectedCustomer) return false;
      
      if (selectedActivityType && activity.type !== selectedActivityType) return false;
      
      if (selectedContainerType && 
          activity.containerId?.containerTypeId?._id !== selectedContainerType) return false;
      
      if (selectedRestaurant && activity.restaurantId?._id !== selectedRestaurant) return false;
      
      return true;
    });
  }, [startFilterDate, endFilterDate, selectedCustomer, selectedActivityType, 
      selectedContainerType, selectedRestaurant]);
  
  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(theme.background);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [theme, isDark]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const now = new Date();
      let startDate = new Date();
      
      if (timeFrame === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeFrame === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeFrame === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      let activitiesResponse;
      try {
        if (user?.userType === 'admin') {
          activitiesResponse = await getAllActivitiesAdmin(1, 1000);
        } else if (user?.userType === 'staff') {
          activitiesResponse = await getRestaurantActivities(1, 1000);
        } else {
          activitiesResponse = await getAllActivities(1, 1000);
        }
      
        const activities = activitiesResponse?.activities || [];
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activity data');
        setLoading(false);
      }
      
      const activities = activitiesResponse.activities || [];
      let filteredActivities = activities.filter(activity => 
        new Date(activity.createdAt) >= startDate
      );
      
      if (startFilterDate || endFilterDate || selectedCustomer || 
          selectedActivityType || selectedContainerType || selectedRestaurant) {
        
        filteredActivities = filteredActivities.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          
          if (startFilterDate && activityDate < new Date(startFilterDate)) return false;
          if (endFilterDate && activityDate > new Date(endFilterDate)) return false;
          
          if (selectedCustomer && activity.userId?._id !== selectedCustomer) return false;
          
          if (selectedActivityType && activity.type !== selectedActivityType) return false;
          
          if (selectedContainerType && 
              activity.containerId?.containerTypeId?._id !== selectedContainerType) return false;
          
          if (selectedRestaurant && activity.restaurantId?._id !== selectedRestaurant) return false;
          
          return true;
        });
      }
      
      if (user?.userType === 'admin' && (!restaurantsList || !restaurantsList.length)) {
        try {
          const response = await axios.get(getApiUrl('/restaurants'), {
            headers: { Authorization: `Bearer ${token}` }
          });
          setRestaurantsList(response.data.restaurants);
        } catch (err) {
          console.log('Failed to fetch restaurants list:', err.message);
          if (err.response) {
            console.log('Error response:', err.response.status, err.response.data);
          } else if (err.request) {
            console.log('No response received:', err.request);
          }
        }
      }
      
      if (!containerTypesList.length) {
        try {
          const response = await axios.get(`${getApiUrl()}/container-types`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.data && Array.isArray(response.data)) {
            setContainerTypesList(response.data);
          } else {
            setContainerTypesList([]);
          }
        } catch (err) {
          console.error('Failed to fetch container types:', err);
          setContainerTypesList([]);
        }
      }
      
      if (user?.userType === 'admin' && !customersList.length) {
        const uniqueCustomers = [...new Set(activities.map(a => a.userId?._id))]
          .filter(id => id)
          .map(id => {
            const userActivity = activities.find(a => a.userId?._id === id);
            return {
              _id: id,
              name: `${userActivity.userId?.firstName || ''} ${userActivity.userId?.lastName || ''}`,
              email: userActivity.userId?.email || ''
            };
          });
        setCustomersList(uniqueCustomers);
      }
      
      if (activeReport === 'activity') {
        const groupedByDay = groupActivitiesByTimeFrame(filteredActivities, timeFrame);
        setReportData(formatChartData(groupedByDay, 'Activity Count', timeFrame));
      } else if (activeReport === 'rebate') {
        const rebateActivities = filteredActivities.filter(a => a.type === 'rebate');
        const groupedRebates = groupRebatesByTimeFrame(rebateActivities, timeFrame);
        setReportData(formatChartData(groupedRebates, 'Rebate Amount (₱)', timeFrame));
      } else if (activeReport === 'container') {
        const groupedByType = groupByContainerType(filteredActivities);
        setReportData(formatBarChartData(groupedByType, 'Container Usage'));
      }
      
      const totalActivities = filteredActivities.length;
      const rebateActivities = filteredActivities.filter(a => a.type === 'rebate');
      const totalRebates = rebateActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0);
      const distinctContainers = new Set(filteredActivities.map(a => a.containerId?._id.toString()));
      const activeContainers = distinctContainers.size;
      const registrations = filteredActivities.filter(a => a.type === 'registration').length;
      const returns = filteredActivities.filter(a => a.type === 'return').length;
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
  }, [activeReport, timeFrame, user, startFilterDate, endFilterDate, selectedCustomer, 
    selectedActivityType, selectedContainerType, selectedRestaurant, 
    restaurantsList?.length, containerTypesList?.length, customersList?.length]);

  const groupActivitiesByTimeFrame = (activities, timeFrame) => {
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
        key = date.getDate().toString();
      } else if (timeFrame === 'year') {
        key = date.toLocaleDateString('en-US', { month: 'short' });
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
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        labels.push(day);
        data.push(groupedData[day] || 0);
      });
    } else if (timeFrame === 'month') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        labels.push(month);
        data.push(groupedData[month] || 0);
      });
    } else if (timeFrame === 'year') {
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 4; i <= currentYear; i++) {
        const year = i.toString();
        labels.push(year);
        data.push(groupedData[year] || 0);
      }
    }
    
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
    
    if (activeReport === 'container') {
      return (
        <BarChart
          data={reportData}
          width={screenWidth}
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
        width={screenWidth}
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
        <TouchableOpacity>
          <Ionicons name="calendar-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
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
            title="Active Containers" 
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
    borderWidth: 1,
  },
  timeFrameText: {
    fontSize: 14,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  filterSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  filterToggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  filterTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    width: 100,
    fontSize: 14,
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  picker: {
    height: 40,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
  }
});

export default ReportsScreen;