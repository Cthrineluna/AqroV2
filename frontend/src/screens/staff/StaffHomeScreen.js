import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
  Text,
  Image,
  Dimensions,
  Animated
} from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText 
} from '../../components/StyledComponents';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { getApiUrl } from '../../services/apiConfig';
import { getRecentActivities, getRestaurantActivities } from '../../services/activityService';
import { PieChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

//added
// derived helpers
const getDerivedStatus = (c) => {
  const max = c?.containerTypeId?.maxUses ?? 0;
  const used = c?.usesCount ?? 0;
  return (c?.status === 'active' && max - used <= 0)
    ? 'expired'
    : (c?.status || 'unknown');
};

const computeStatsFromList = (list = []) => {
  const stats = { availableContainers: 0, activeContainers: 0, returnedContainers: 0, expiredContainers: 0 };
  for (const c of list) {
    const s = getDerivedStatus(c);
    if (s === 'available') stats.availableContainers++;
    else if (s === 'active') stats.activeContainers++;
    else if (s === 'returned') stats.returnedContainers++;
    else if (s === 'expired') stats.expiredContainers++;
  }
  return stats;
};
//added

const ContainerCard = ({ title, value, icon, backgroundColor, textColor, onPress }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
    >
      <View style={styles.cardContent}>
        <Ionicons name={icon} size={24} color={textColor} style={styles.cardIcon} />
        <View style={styles.cardTextContainer}>
          <RegularText style={[styles.cardTitle, { color: textColor }]}>{title}</RegularText>
          <BoldText style={[styles.cardValue, { color: textColor }]}>{value}</BoldText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ActivityItem = ({ activity, onPress }) => {
  const { theme } = useTheme();

  const getActivityInfo = () => {
    const customerName = activity.userId 
      ? `${activity.userId.firstName} ${activity.userId.lastName}`
      : 'Unknown Customer';
    
    switch (activity.type) {
      case 'registration':
        return {
          icon: 'add-circle-outline',
          color: '#4CAF50',
          title: 'Cup Registered',
          description: `Cup registered by ${customerName}`
        };
      case 'return':
        return {
          icon: 'repeat-outline',
          color: '#2196F3',
          title: 'Cup Returned',
          description: `Cup returned by ${customerName}`
        };
      case 'rebate':
        return {
          icon: 'cash-outline',
          color: '#FF9800',
          title: 'Rebate Issued',
          description: `₱${activity.amount.toFixed(2)} rebate to ${customerName}`
        };
      case 'status_change':
        return {
          icon: 'sync-outline',
          color: '#9C27B0',
          title: 'Status Changed',
          description: activity.notes || 'Cup status updated'
        };
      default:
        return {
          icon: 'ellipsis-horizontal-outline',
          color: '#757575',
          title: 'Activity',
          description: 'Cup activity recorded'
        };
    }
  };
  
  const info = getActivityInfo();
  const date = new Date(activity.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  return (
    <TouchableOpacity 
      style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => onPress(activity)}
    >
      <View style={[styles.activityIconContainer, { backgroundColor: info.color + '20' }]}>
        <Ionicons name={info.icon} size={24} color={info.color} />
      </View>
      <View style={styles.activityContent}>
        <SemiBoldText style={{ color: theme.text }}>{info.title}</SemiBoldText>
        <RegularText style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>{info.description}</RegularText>
      </View>
      <RegularText style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>{formattedDate}</RegularText>
    </TouchableOpacity>
  );
};

const StaffHomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [containerStats, setContainerStats] = useState({
    availableContainers: 0,
    activeContainers: 0,
    returnedContainers: 0
  });
  const [rebateStats, setRebateStats] = useState({
    totalRebateAmount: 0,
    rebateCount: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [fontsLoaded] = useFonts({
    Blanka: require('../../../assets/fonts/Blanka-Regular.otf'),
  });
  const isStaffOrAdmin = user?.userType === 'staff' || user?.userType === 'admin';
  const isAdmin = user?.userType === 'admin';

  const navigateToReports = () => {
    setTimeout(() => {
      navigation.navigate('Reports', { userType: user?.userType });
    }, 300);
  };

  const fetchRebateStats = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token || !user.restaurantId) {
        console.error('No auth token or restaurantId found');
        return;
      }
      
      try {
        const response = await axios.get(
          `${getApiUrl(`/rebates/restaurant/${user.restaurantId}/totals`)}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data) {
          setRebateStats(response.data);
        }
      } catch (error) {
        console.error('Error in API call:', error.response ? error.response.data : error.message);
        // Optionally set default/fallback stats
        setRebateStats({
          totalRebateAmount: 0,
          rebateCount: 0
        });
      }
    } catch (error) {
      console.error('Unexpected error in fetchRebateStats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const result = await getRestaurantActivities(1, 3);
      const activities = result.activities || result;

      if (activities && activities.length > 0) {
        setRecentActivities(activities);
      }
    } catch (error) {
      console.error('Error fetching recent restaurant activities:', error);
    }
  };
  
  const fetchContainerStats = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token || !user.restaurantId) {
        console.error('No auth token or restaurantId found');
        return;
      }
      
      const response = await axios.get(
        `${getApiUrl(`/containers/restaurant/${user.restaurantId}/stats`)}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        setContainerStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant cup stats:', error);
    }
  };
  
  useEffect(() => {
    const setNavBarColor = async () => {
      await NavigationBar.setBackgroundColorAsync(theme.background); 
    };
    setNavBarColor();
  }, [theme.background]);

  // useEffect(() => {
  //   fetchContainerStats();
  //   fetchRebateStats();
  //   fetchRecentActivities(); 
  // }, []);

  //added
  useEffect(() => {
  (async () => {
    await fetchContainerStats();      // server numbers
    await fetchRebateStats();
    await fetchRecentActivities();
    await fetchContainersForDerivedStats(); // <-- derived last so it wins
  })();
}, []);
//added

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchContainerStats(), 
      fetchRebateStats(), 
      fetchRecentActivities()
    ]);
    await fetchContainersForDerivedStats(); //added
    setRefreshing(false);
  };

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

  //added
  const fetchContainersForDerivedStats = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    if (!token || !user?.restaurantId) return;

    const res = await axios.get(
      getApiUrl(`/containers/restaurant/${user.restaurantId}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const stats = computeStatsFromList(res.data || []);
    // Only update the counts we care about; keep state shape the same
    setContainerStats(prev => ({
      ...prev,
      availableContainers: stats.availableContainers,
      activeContainers: stats.activeContainers,      // <-- will drop when items become expired
      returnedContainers: stats.returnedContainers,
      // (you can use stats.expiredContainers later if you show it on this screen)
    }));
  } catch (err) {
    console.error('Error fetching containers for derived stats:', err);
  }
};
//added

  const containerChartData = [
    {
      name: 'Available',
      population: containerStats.availableContainers,
      color: '#EBC684',
      legendFontColor: theme.text,
      legendFontSize: 12
    },
    {
      name: 'Active',
      population: containerStats.activeContainers,
      color: '#BBC191',
      legendFontColor: theme.text,
      legendFontSize: 12
    },
    {
      name: 'Returned',
      population: containerStats.returnedContainers,
      color: '#E0C7AC',
      legendFontColor: theme.text,
      legendFontSize: 12
    }
  ];

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[styles.headerLetter, { color: theme.text }]}>A</Text>
          <Text style={[styles.headerLetter, { color: theme.primary }]}>Q</Text>
          <Text style={[styles.headerLetter, { color: theme.primary }]}>R</Text>
          <Text style={[styles.headerLetter, { color: theme.text }]}>O</Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#677325']}
            tintColor={isDark ? '#677325' : '#2e7d32'}
          />
        }
      >
        <View style={styles.greetings}>
          <View>
            <SemiBoldText style={[styles.greetingsHeader, { color: theme.text }]}>
              Hello, {user?.firstName || 'User'}!
            </SemiBoldText>
            <RegularText style={[styles.subGreetings, { color: theme.primary }]}>
              Ready to serve customers?
            </RegularText> 
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
          >
            {renderProfileImage()}
          </TouchableOpacity>
        </View>

        {/* Container Stats Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => navigation.navigate('Cups')}
          >
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Cups
            </SemiBoldText>
            <Ionicons name="chevron-forward" style={styles.arrow} size={20} color={theme.text} />
          </TouchableOpacity>
          
           {/* Container Status Pie Chart */}
           <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <SemiBoldText style={[styles.chartTitle, { color: theme.text }]}>
              Cup Status Overview
            </SemiBoldText>
            {(containerStats.availableContainers > 0 || 
              containerStats.activeContainers > 0 || 
              containerStats.returnedContainers > 0) ? (
                <>
                <PieChart
                  data={containerChartData}
                  width={width - 40}
                  height={height * 0.18}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  absolute={false}
                />
                {/* Total Count Display */}
                <MediumText style={[styles.totalText, { color: theme.text }]}>
                  Total: {containerStats.availableContainers + containerStats.activeContainers + containerStats.returnedContainers}
                </MediumText>
              </>

            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="pie-chart-outline" size={40} color={theme.text} style={{opacity: 0.3}} />
                <RegularText style={{color: theme.text, opacity: 0.5, marginTop: 10}}>
                  No cup data available
                </RegularText>
              </View>
            )}
          </View>
        </View>
          <View style={styles.cardsContainer}>
            <ContainerCard 
              title="Available" 
              value={containerStats.availableContainers}
              icon="cafe-outline"
              backgroundColor="#EBC684"
              textColor="#7C663E"
              onPress={() => navigation.navigate('Cups', { filter: 'available' })}
            />
            
            <ContainerCard 
              title="Active" 
              value={containerStats.activeContainers}
              icon="cube-outline"
              backgroundColor="#BBC191"
              textColor="#677325"
              onPress={() => navigation.navigate('Cups', { filter: 'active' })}
            />
            
            <ContainerCard 
              title="Returned" 
              value={containerStats.returnedContainers}
              icon="refresh-outline"
              backgroundColor="#E0C7AC"
              textColor="#BF9266"
              onPress={() => navigation.navigate('Cups', { filter: 'returned' })}
            />
          </View>
          <View style={[styles.cardsContainer, {marginTop: 10}]}>
            <ContainerCard 
              title="Total Rebated" 
              value={`₱${rebateStats.totalRebateAmount.toFixed(2)}`}
              icon="cash-outline"
              backgroundColor="#d8cdbaff"
              textColor="#cc7913ff"
              onPress={() => navigation.navigate('Reports', { 
                userType: user?.userType,
                initialFilter: 'rebate',
                initialTimeframe: 'yearly'
              })}
            />
            
            <ContainerCard 
              title="Rebate Count" 
              value={rebateStats.rebateCount}
              icon="receipt-outline"
              backgroundColor="#c5c8daff"
              textColor="#3f51b5"
              onPress={() => navigation.navigate('Reports', { 
                userType: user?.userType,
                initialFilter: 'rebate',
                initialTimeframe: 'yearly'
              })}
            />
          </View>
         
        {/* Quick Actions Menu */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, {backgroundColor: '#7e7e7dff'}]}
            onPress={navigateToReports}
          >
            <Ionicons name="document-text-outline" size={24} color="#FFFFFF" />
            <BoldText style={styles.actionButtonText}>View Reports</BoldText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, {backgroundColor: '#7e7e7dff'}]}
            onPress={() => navigation.navigate('StaffScanner', { action: 'rebate' })}
          >
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            <BoldText style={styles.actionButtonText}>Process Rebate</BoldText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, {backgroundColor: '#7e7e7dff'}]}
            onPress={() => navigation.navigate('StaffScanner', { action: 'return' })}
          >
            <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
            <BoldText style={styles.actionButtonText}>Process Return</BoldText>
          </TouchableOpacity>
        </View>
        
        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionRecent}>
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Activity
            </SemiBoldText>
            <TouchableOpacity onPress={() => navigation.navigate('Activities', { filter: 'all' })}>
              <RegularText style={styles.viewAllText}>View All</RegularText>
            </TouchableOpacity>
          </View>

          {recentActivities.length > 0 ? (
            <View style={styles.activitiesContainer}>
              {recentActivities.map((activity, index) => (
                <ActivityItem 
                  key={activity._id || index} 
                  activity={activity} 
                  onPress={(activity) => navigation.navigate('Activities', { 
                    filter: activity.type,
                    selectedActivity: activity 
                  })}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.activityPlaceholder, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
              <RegularText style={{ color: theme.text, textAlign: 'center' }}>
                Your recent cup activity will appear here.
              </RegularText>
            </View>
          )}
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
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 4 : 10,
    marginBottom: 0  
  },
  headerLetter: {
    fontSize: 26,
    fontFamily: 'Arial',
    lineHeight: 30,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionRecent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
  },
  greetings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  arrow: {
    opacity: 0.5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#677324',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardTextContainer: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 18,
  },
  chartContainer: {
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },  
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  activityPlaceholder: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activitiesContainer: {
    marginTop: 8,
  },
});

export default StaffHomeScreen;