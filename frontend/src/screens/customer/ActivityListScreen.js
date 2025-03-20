
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  FlatList, 
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { 
  RegularText, 
  SemiBoldText, 
  BoldText 
} from '../../components/StyledComponents';
import FilterTabs from '../../components/FilterTabs';
import { getAllActivities } from '../../services/activityService';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const ActivityListScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const modalBackdrop = useRef(new Animated.Value(0)).current;
  

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'registration', label: 'Registration' },
    { id: 'return', label: 'Return' },
    { id: 'rebate', label: 'Rebate' },
    { id: 'status_change', label: 'Status Change' },
  ];


  const loadActivities = async (pageNum = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }
      
      const result = await getAllActivities(pageNum);
      
      if (result) {
        let newActivities;
        if (pageNum === 1 || shouldRefresh) {
          newActivities = result.activities;
          setActivities(newActivities);
        } else {
          newActivities = [...activities, ...result.activities];
          setActivities(newActivities);
        }
        

        applyFilter(activeFilter, newActivities);
        
        setTotalPages(result.totalPages);
        setPage(result.page);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const applyFilter = (filter, activityList = activities) => {
    if (filter === 'all') {
      setFilteredActivities(activityList);
    } else {
      const filtered = activityList.filter(item => item.type === filter);
      setFilteredActivities(filtered);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(filter);
  };

const processSections = () => {
    const sections = {};
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.createdAt);
      const dateString = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!sections[dateString]) {
        sections[dateString] = [];
      }
      
      sections[dateString].push(activity);
    });
    
    return Object.entries(sections).map(([title, data]) => ({
      title,
      data
    }));
  };


  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [activities, activeFilter]);
  useEffect(() => {
      const setNavBarColor = async () => {
        if (Platform.OS === 'android') {
          await NavigationBar.setBackgroundColorAsync(theme.background);
        }
      };
      setNavBarColor();
    }, [theme.background]);

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      loadActivities(page + 1);
    }
  };


  const onRefresh = () => {
    loadActivities(1, true);
  };

  const getActivityInfo = (type) => {
    switch (type) {
      case 'registration':
        return {
          icon: 'add-circle-outline',
          color: '#4CAF50',
          title: 'Container Registered',
          background: '#e8f5e9'
        };
      case 'return':
        return {
          icon: 'repeat-outline',
          color: '#2196F3',
          title: 'Container Returned',
          background: '#e3f2fd'
        };
      case 'rebate':
        return {
          icon: 'cash-outline',
          color: '#FF9800',
          title: 'Rebate Received',
          background: '#fff3e0'
        };
      case 'status_change':
        return {
          icon: 'sync-outline',
          color: '#9C27B0',
          title: 'Status Changed',
          background: '#f3e5f5'
        };
      default:
        return {
          icon: 'ellipsis-horizontal-outline',
          color: '#757575',
          title: 'Activity',
          background: '#f5f5f5'
        };
    }
  };

  const openActivityDetail = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);

    if (Platform.OS === 'android') {
        const navBarColor = isDark ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.9)';
        NavigationBar.setBackgroundColorAsync(navBarColor);
        }

    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(modalBackdrop, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const closeActivityDetail = () => {
    
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(modalBackdrop, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      setModalVisible(false);
      setSelectedActivity(null);

      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(theme.background);
      }
    });
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
        {section.title}
      </SemiBoldText>
    </View>
  );


  const renderActivityItem = ({ item }) => {
    const info = getActivityInfo(item.type);
    const date = new Date(item.createdAt);
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let description = '';
    
    switch (item.type) {
      case 'registration':
        description = `Registered at ${item.location || 'Unknown'}`;
        break;
      case 'return':
        description = `Returned at ${item.location || 'Unknown'}`;
        break;
      case 'rebate':
        description = `₱${item.amount ? item.amount.toFixed(2) : '0.00'} from ${item.location || 'Unknown'}`;
        break;
      case 'status_change':
        description = item.notes || 'Status updated';
        break;
      default:
        description = 'Activity recorded';
    }
    
    return (
      <TouchableOpacity 
        style={[styles.activityItem, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => openActivityDetail(item)}
      >
        <View style={styles.activityItemContent}>
          <View style={styles.activityItemLeft}>
            <View style={[styles.activityIconContainer, { backgroundColor: info.background }]}>
              <Ionicons name={info.icon} size={24} color={info.color} />
            </View>
            <View style={styles.activityInfo}>
              <SemiBoldText style={{ fontSize: 16, color: theme.text }}>
                {info.title}
              </SemiBoldText>
              <RegularText style={{ color: theme.text, opacity: 0.6, fontSize: 12 }}>
                {formattedTime}
              </RegularText>
            </View>
          </View>
            <View style={[styles.activityItemRight]}>
             <Ionicons name="chevron-forward" size={20} color={theme.primary} />
            </View>
        </View>
      </TouchableOpacity>
    );
  };


  // Check if there are any text strings directly in View components
const ActivityDetailModal = ({ activity, animation }) => {
    if (!activity) return null;
    
    const info = getActivityInfo(activity.type);
    const date = new Date(activity.createdAt);
    
    // Make sure we handle cases where activity data might be undefined or null
    const formattedDate = date ? date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    }) : '';
    
    const formattedTime = date ? date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';
    
    return (
        <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [
              { translateY: -height * 0.33 },
              { scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }
            ],
            opacity: animation,
            backgroundColor: theme.card,
          }
        ]}
      >
        <View style={styles.modalHeader}>
          <BoldText style={{ fontSize: 20, color: theme.text }}>
            Activity Details
          </BoldText>
          <TouchableOpacity onPress={closeActivityDetail}>
            <Ionicons name="close-circle-outline" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalBody}>
          <View style={[styles.activityIconLarge, { backgroundColor: info.background }]}>
            <Ionicons name={info.icon} size={24} color={info.color} />
          </View>
          
          <BoldText style={{ fontSize: 24, marginVertical: 8, color: theme.text }}>
            {info.title}
          </BoldText>
          
          <View style={styles.statusChip}>
            <RegularText style={{ color: info.color, fontSize: 16 }}>
                {activity.type ? activity.type.replace(/_/g, ' ').toUpperCase() : ''}
            </RegularText>
          </View>

          
          <View style={styles.detailRow}>
            <RegularText style={styles.detailLabel}>Date:</RegularText>
            <RegularText style={{ color: theme.text }}>{formattedDate}</RegularText>
          </View>
          
          <View style={styles.detailRow}>
            <RegularText style={styles.detailLabel}>Time:</RegularText>
            <RegularText style={{ color: theme.text }}>{formattedTime}</RegularText>
          </View>
          
          {activity.type === 'return' && activity.location && (
            <View style={styles.detailRow}>
                <RegularText style={styles.detailLabel}>Location:</RegularText>
                <RegularText style={{ color: theme.text }}>{activity.location}</RegularText>
            </View>
            )}
          
          {activity.type === 'rebate' && activity.amount != null && (
            <View style={styles.detailRow}>
                <RegularText style={styles.detailLabel}>Amount:</RegularText>
                <RegularText style={{ color: theme.text }}>
                ₱{typeof activity.amount === 'number' ? activity.amount.toFixed(2) : '0.00'}
                </RegularText>
            </View>
            )}
          
          {activity.containerId && (
            <View style={styles.detailRow}>
              <RegularText style={styles.detailLabel}>Container ID:</RegularText>
              <RegularText style={{ 
                color: theme.text, 
                fontSize: 12, 
                flex: 1, 
                textAlign: 'right',
                marginLeft: 8
              }}>
                {typeof activity.containerId === 'object' ? activity.containerId._id : activity.containerId.toString()}
              </RegularText>
            </View>
          )}
          
          {activity.containerId && typeof activity.containerId === 'object' && activity.containerId.containerTypeId && (
            <View style={styles.detailRow}>
              <RegularText style={styles.detailLabel}>Container Type:</RegularText>
              <RegularText style={{ color: theme.text }}>
                {typeof activity.containerId.containerTypeId === 'object' && activity.containerId.containerTypeId.name 
                  ? activity.containerId.containerTypeId.name 
                  : 'Unknown'}
              </RegularText>
            </View>
          )}
          
          {activity.notes && (
            <View style={styles.detailRow}>
              <RegularText style={styles.detailLabel}>Notes:</RegularText>
              <RegularText style={{ color: theme.text, fontStyle: 'italic' }}>
                "{activity.notes}"
              </RegularText>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderContent = () => {
    if (loading && page === 1) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    
    const sections = processSections();
    
    if (sections.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.text} style={{ opacity: 0.3 }} />
          <RegularText style={[styles.emptyText, { color: theme.text }]}>
            No activity records found
          </RegularText>
        </View>
      );
    }
    

return (
  <View style={styles.listContainer}>
    <SectionList
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#00df82']} 
        tintColor={isDark ? '#00df82' : '#2e7d32'}
      />
    }
      sections={sections}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => renderActivityItem({ item })}
      renderSectionHeader={({ section: { title } }) => (
        
        <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
          <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
            {title}
          </SemiBoldText>
        </View>
      )}
      stickySectionHeadersEnabled={true}
      contentContainerStyle={styles.listContent}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListFooterComponent={
        page < totalPages && (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )
      }
    />
  </View>
);

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
        <BoldText style={[styles.headerTitle, { color: theme.text }]}>Activity History</BoldText>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Filter Tabs */}
      <View style={[ { padding: 16 }]}>
            <FilterTabs 
                options={filterOptions}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                theme={theme}
            />
        </View>

      
      {/* Main Content */}
      {renderContent()}
      
      {/* Modal Backdrop */}
      {modalVisible && (
        <TouchableOpacity 
          style={[styles.modalBackdrop, { opacity: modalBackdrop }]}
          activeOpacity={0.95}
          onPress={closeActivityDetail}
        />
      )}
      
      {/* Activity Detail Modal */}
      {modalVisible && (
        <ActivityDetailModal 
          activity={selectedActivity} 
          animation={modalAnimation} 
        />
      )}
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
    listContainer: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    sectionHeader: {
      paddingVertical: 8,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
    },
    activityItem: {
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    activityItemContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
    },
    activityItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
 
    activityItemRight: {
        alignSelf: 'center',
        marginLeft: 'auto',
    },
    emptyContainer: {
      flex: 1,
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      marginTop: 16,
      textAlign: 'center',
      opacity: 0.6,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.90)', 
      opacity: 0.95,
      zIndex: 10,
    },
    modalContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: width * 0.85,
        marginLeft: -(width * 0.85) / 2,
        transform: [
            { translateY: -height * 0.3 }, 
        ],
        maxHeight: height * 0.75, 
        borderRadius: 16,
        zIndex: 11,
        overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalBody: {
      padding: 20,
      alignItems: 'center',
    },
    activityIconLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 8,
    },
    statusChip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: 'rgba(112, 111, 111, 0.05)',
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    detailLabel: {
      opacity: 0.7,
      fontSize: 14,
    }
  });

export default ActivityListScreen;