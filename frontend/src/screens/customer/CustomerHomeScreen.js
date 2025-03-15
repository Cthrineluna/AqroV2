import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform
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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { getApiUrl } from '../../services/apiConfig';
import { getRecentActivities } from '../../services/activityService';

const ContainerCard = ({ title, value, icon, backgroundColor, textColor }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.cardContent}>
        <Ionicons name={icon} size={24} color={textColor} style={styles.cardIcon} />
        <View style={styles.cardTextContainer}>
          <RegularText style={[styles.cardTitle, { color: textColor }]}>{title}</RegularText>
          <BoldText style={[styles.cardValue, { color: textColor }]}>{value}</BoldText>
        </View>
      </View>
    </View>
  );
};



const ActivityItem = ({ activity }) => {
  const { theme } = useTheme();
  
  // Format the activity information
  const getActivityInfo = () => {
    switch (activity.type) {
      case 'registration':
        return {
          icon: 'add-circle-outline',
          color: '#4CAF50',
          title: 'Container Registered',
          description: `Container registered at ${activity.location || 'Unknown'}`
        };
      case 'return':
        return {
          icon: 'repeat-outline',
          color: '#2196F3',
          title: 'Container Returned',
          description: `Container returned at ${activity.location || 'Unknown'}`
        };
      case 'rebate':
        return {
          icon: 'cash-outline',
          color: '#FF9800',
          title: 'Rebate Received',
          description: `₱${activity.amount.toFixed(2)} rebate from ${activity.location || 'Unknown'}`
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
    <View style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.activityIconContainer, { backgroundColor: info.color + '20' }]}>
        <Ionicons name={info.icon} size={24} color={info.color} />
      </View>
      <View style={styles.activityContent}>
        <SemiBoldText style={{ color: theme.text }}>{info.title}</SemiBoldText>
        <RegularText style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>{info.description}</RegularText>
      </View>
      <RegularText style={{ color: theme.text, opacity: 0.5, fontSize: 12 }}>{formattedDate}</RegularText>
    </View>
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
      
      if (response.data) {
        setContainerStats(response.data);
      }
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
  useEffect(() => {
      const setNavBarColor = async () => {
        await NavigationBar.setBackgroundColorAsync(theme.background); 
      };
      setNavBarColor();
    }, [theme.background]);
  useEffect(() => {
    fetchContainerStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchContainerStats(), fetchRecentActivities()]);
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
        <BoldText style={[styles.headerTitle, { color: theme.text }]}>aQRo</BoldText>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00df82']}
            tintColor={isDark ? '#00df82' : '#2e7d32'}
          />
        }
      >
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => navigation.navigate('ContainersList')}
          >
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Containers
            </SemiBoldText>
            <Ionicons name="chevron-forward" style={styles.arrow} size={20} color={theme.text} />
          </TouchableOpacity>
          
          <View style={styles.cardsContainer}>
          <ContainerCard 
              title="Active" 
              value={containerStats.activeContainers}
              icon="cube-outline"
              backgroundColor="#e8f5e9"
              textColor="#2e7d32"
            />
            
            <ContainerCard 
              title="Returned" 
              value={containerStats.returnedContainers}
              icon="refresh-outline"
              backgroundColor="#e3f2fd"
              textColor="#0277bd"
            />
            
            <ContainerCard 
              title="Total Rebate" 
              value={`₱${containerStats.totalRebate.toFixed(2)}`}
              icon="cash-outline"
              backgroundColor="#fffde7"
              textColor="#f57f17"
            />
          </View>
        </View>
        
        {/* Scan Button */}
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner')}
        >
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" style={styles.scanIcon} />
          <BoldText style={styles.scanButtonText}>Scan Container</BoldText>
        </TouchableOpacity>
        
        {/* Recent Activity Section - You can add this later */}
        <View style={styles.section}>
          <View style={styles.sectionRecent}>
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Recent Activity
            </SemiBoldText>
            <TouchableOpacity onPress={() => navigation.navigate('ActivityList')}>
              <RegularText style={styles.viewAllText}>View All</RegularText>
            </TouchableOpacity>
          </View>
          
          {recentActivities.length > 0 ? (
            <View style={styles.activitiesContainer}>
              {recentActivities.map((activity, index) => (
                <ActivityItem key={activity._id || index} activity={activity} />
              ))}
            </View>
          ) : (
            <View style={[styles.activityPlaceholder, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
              <RegularText style={{ color: theme.text, textAlign: 'center' }}>
                Your recent container activity will appear here.
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 2 : 10,
  },
  headerTitle: {
    fontSize: 24,
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
  arrow: {
    opacity: 0.5,
  },

  viewAllText: {
    fontSize: 14,
    color: '#00df82',
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
    backgroundColor: '#00df82',
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