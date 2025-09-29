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
  Animated,
  Dimensions
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
import { useFonts } from 'expo-font';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { getApiUrl } from '../../services/apiConfig';
import { getRecentActivities } from '../../services/activityService';
import RestaurantCarousel from '../../components/RestaurantCarousel';

const { width, height } = Dimensions.get('window');

//added
const getDerivedStatus = (c) => {
  const max = c?.containerTypeId?.maxUses ?? 0;
  const used = c?.usesCount ?? 0;
  return (c?.status === 'active' && max - used <= 0)
    ? 'expired'
    : (c?.status || 'unknown');
};

const computeStatsFromList = (list = []) => {
  const stats = { activeContainers: 0, returnedContainers: 0, expiredContainers: 0 };
  for (const c of list) {
    const s = getDerivedStatus(c);
    if (s === 'active') stats.activeContainers++;
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
    const restaurantName = activity.restaurantId?.name || activity.location || 'Unknown';
    
    switch (activity.type) {
      case 'registration':
        return {
          icon: 'add-circle-outline',
          color: '#4CAF50',
          title: 'Container Registered',
          description: `Container registered at ${restaurantName}`
        };
      case 'return':
        return {
          icon: 'repeat-outline',
          color: '#2196F3',
          title: 'Container Returned',
          description: `Container returned at ${restaurantName}`
        };
      case 'rebate':
        return {
          icon: 'cash-outline',
          color: '#FF9800',
          title: 'Rebate Received',
          description: `₱${activity.amount.toFixed(2)} rebate from ${restaurantName}`
        };
      case 'status_change':
        return {
          icon: 'sync-outline',
          color: '#9C27B0',
          title: 'Status Changed',
          description: activity.notes || 'Container status updated'
        };
      default:
        return {
          icon: 'ellipsis-horizontal-outline',
          color: '#757575',
          title: 'Activity',
          description: 'Container activity recorded'
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

const CustomerHomeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [containerStats, setContainerStats] = useState({
    activeContainers: 0,
    returnedContainers: 0,
    totalRebate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({
      Blanka: require('../../../assets/fonts/Blanka-Regular.otf'),
    });

  const fetchRecentActivities = async () => {
    try {
      const activities = await getRecentActivities(3); 
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };
  

  const fetchContainerStats = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await axios.get(
        `${getApiUrl('/containers/stats')}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // if (response.data) {
      //   setContainerStats(response.data);
      // }

      //added
      if (response.data) {
          setContainerStats(prev => ({
            ...prev,
            totalRebate: response.data.totalRebate ?? prev.totalRebate,
            // leave activeContainers/returnedContainers to be set by fetchContainersForDerivedStats
          }));
        }
      //added

    } catch (error) {
      console.error('Error fetching container stats:', error);
      // dummy data
      // setContainerStats({
      //   activeContainers: 3,
      //   returnedContainers: 5,
      //   totalRebate: 15.50
      // });
    }
  };
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('aqro_token');
  
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }
  
      const response = await axios.get(
        getApiUrl('/restaurants'), 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (response.data) {
        setRestaurants(response.data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  //added
const fetchContainersForDerivedStats = async () => {
  try {
    const token = await AsyncStorage.getItem('aqro_token');
    if (!token) return;

    const res = await axios.get(
      getApiUrl('/containers'),
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const stats = computeStatsFromList(res.data || []);
    // keep totalRebate from /containers/stats; only override counts we derive here
    setContainerStats(prev => ({
      ...prev,
      activeContainers: stats.activeContainers,
      returnedContainers: stats.returnedContainers,
      // you can also keep stats.expiredContainers if you later show it on Home
    }));
  } catch (err) {
    console.error('Error fetching containers for derived stats:', err);
  }
};
//added

  const handleRestaurantPress = (restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurantId: restaurant._id });
  };
  const renderProfileImage = () => {
      if (user?.profilePicture) {
        return (
          <Image
            source={{ uri: user.profilePicture }}
            style={styles.profileImage}
            onError={(e) => {
              console.log("Image loading error:", e.nativeEvent.error);
              setImageFailed(true);
            }}
          />
        );
      } else {
        return (
          <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="person" size={30} color={theme.primary} />
          </View>
        );
      }
    };

  useEffect(() => {
      const setNavBarColor = async () => {
        await NavigationBar.setBackgroundColorAsync(theme.background); 
      };
      setNavBarColor();
    }, [theme.background]);

  useEffect(() => {
    fetchContainerStats();
    fetchRecentActivities(); 
    fetchRestaurants();
    fetchContainersForDerivedStats(); 
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchContainerStats(), fetchRecentActivities(), fetchContainersForDerivedStats(),]);
    setRefreshing(false);
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
        {/* <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity> */}
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#677324']}
            tintColor={isDark ? '#00df82' : '#2e7d32'}
          />
        }
      >
        <View style={styles.greetings}>
          <View>
            <SemiBoldText style={[styles.greetingsHeader, { color: theme.text }]}>
              Hello, {user?.firstName || 'User'}!
            </SemiBoldText>
            <RegularText style={[styles.subGreetings, { color: theme.primary }]}>
              Brewed and ready today?
            </RegularText> 
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
          >
            {renderProfileImage()}
          </TouchableOpacity>
        </View>

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
          
          <View style={styles.cardsContainer}>
            <ContainerCard 
              title="Active" 
              value={containerStats.activeContainers}
              icon="cafe-outline"
              backgroundColor="#BBC191"
              textColor="#677325"
              onPress={() => navigation.navigate('Cups', { filter: 'active' })}
            />
            
            <ContainerCard 
              title="Returned" 
              value={containerStats.returnedContainers}
              icon="refresh-outline"
              backgroundColor="#E0C7AC"
              textColor="#5A3E29"
              onPress={() => navigation.navigate('Cups', { filter: 'returned' })}
            />
            
            <ContainerCard 
              title="Total Rebate" 
              value={`₱${containerStats.totalRebate.toFixed(2)}`}
              icon="cash-outline"
              backgroundColor="#EBC684"
              textColor="#7C663E"
              onPress={() => navigation.navigate('Activities', { filter: 'rebate' })}
            />
          </View>
        </View>
        
        {/* Scan Button */}
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" style={styles.scanIcon} />
          <BoldText style={styles.scanButtonText}>Scan Cups</BoldText>
        </TouchableOpacity>
        
        
        {!loading && restaurants.length > 0 && (
          <RestaurantCarousel 
            restaurants={restaurants} 
            title="Our Partners"
            onRestaurantPress={handleRestaurantPress}
            autoPlay={true}
          />
        )}
        {/* Recent Activity Section  */}
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
    paddingTop:0,
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
    fontSize: 16 ,
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
  scanButton: {
    backgroundColor: '#677324',
    borderRadius: 30,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  scanIcon: {
    marginRight: 10,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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

export default CustomerHomeScreen;