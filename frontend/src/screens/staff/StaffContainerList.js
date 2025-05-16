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
  Animated,
  Dimensions,
  ScrollView as RNScrollView
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
import FilterTabs from '../../components/FilterTabs'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { getApiUrl } from '../../services/apiConfig';
import SearchComponent from '../../components/SearchComponent';


const { width, height } = Dimensions.get('window');

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

const ContainerItem = ({ container, onPress }) => {
  const { theme } = useTheme();
  const estimatedUsesLeft = container.containerTypeId.maxUses - container.usesCount; 
  
  const customerName = container.customerId ? 
    `${container.customerId.firstName} ${container.customerId.lastName}` : 
    'Unregistered';
    
  const statusMessage = (() => {
    switch (container.status) {
      case 'available':
        return 'Available';
      case 'active':
        return `${estimatedUsesLeft} uses left`;
      case 'returned':
        return 'Returned';
      case 'lost':
        return 'Lost';
      case 'damaged':
        return 'Damaged';
      default:
        return 'Unknown status'; 
    }
  })();

  const getContainerIcon = (status) => {
    switch (status) {
      case 'available':
        return { name: 'cafe-outline', color: '#9c27b0' };
      case 'active':
        return { name: 'cube-outline', color: '#2e7d32' };
      case 'returned':
        return { name: 'archive-outline', color: '#0277bd' }; 
      case 'lost':
        return { name: 'help-circle-outline', color: '#ff9800' };
      case 'damaged':
        return { name: 'alert-circle-outline', color: '#d32f2f' }; 
      default:
        return { name: 'help-outline', color: '#9e9e9e' }; 
    }
  };
  
  const { name, color } = getContainerIcon(container.status);
  
  const getContainerBackground = (status) => {
    switch (status) {
      case 'available':
        return '#f3e5f5';
      case 'active':
        return '#e8f5e9';
      case 'returned':
        return '#e3f2fd';
      case 'lost':
        return '#fff3e0';
      case 'damaged':
        return '#ffebee'; 
      default:
        return '#e0e0e0'; 
    }
  };
  
  const backgroundColor = getContainerBackground(container.status);
  
  return (
    <TouchableOpacity 
      style={[styles.containerItem, { backgroundColor: theme.card }]}
      onPress={() => onPress(container)}
    >
      <View style={styles.containerItemContent}>
        <View style={styles.containerItemLeft}>
          <View style={[styles.containerIcon, { backgroundColor }]}>
            <Ionicons name={name} size={24} color={color} />
          </View>
          <View style={styles.containerInfo}>
            <SemiBoldText style={{ fontSize: 16, color: theme.text }}>
              {container.containerTypeId.name}
            </SemiBoldText>
            <RegularText style={{ color: theme.text }}>
              {statusMessage}
            </RegularText>
            {/* Display customer name for staff view */}
            <RegularText style={{ color: theme.text, fontSize: 12, opacity: 0.7 }}>
              Customer: {customerName}
            </RegularText>
          </View>
        </View>
        <View style={styles.containerItemRight}>
          <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ContainerDetailModal = ({ container, animation, closeModal }) => {
  const { theme } = useTheme();
  const estimatedUsesLeft = container?.containerTypeId?.maxUses - (container?.usesCount || 0);
  
  if (!container) return null;
  
  const registrationDate = container.registrationDate 
    ? new Date(container.registrationDate).toLocaleDateString() 
    : 'N/A';
  
  const lastUsed = container.lastUsed 
    ? new Date(container.lastUsed).toLocaleDateString() 
    : 'N/A';
    
  const customerName = container.customerId ? 
    `${container.customerId.firstName} ${container.customerId.lastName}` : 
    'Unregistered';
    
  const customerEmail = container.customerId ? 
    container.customerId.email : 
    'N/A';
  
  const statusMessage = (() => {
    switch (container.status) {
      case 'available':
        return 'Available';
      case 'active':
        return `${estimatedUsesLeft} uses left`;
      case 'returned':
        return 'Returned';
      case 'lost':
        return 'Lost';
      case 'damaged':
        return 'Damaged';
      default:
        return 'Unknown status'; 
    }
  })();
  
  const getContainerIcon = (status) => {
    switch (status) {
      case 'available':
        return { name: 'cafe-outline', color: '#9c27b0' };
      case 'active':
        return { name: 'cube-outline', color: '#2e7d32' };
      case 'returned':
        return { name: 'archive-outline', color: '#0277bd' }; 
      case 'lost':
        return { name: 'help-circle-outline', color: '#ff9800' };
      case 'damaged':
        return { name: 'alert-circle-outline', color: '#d32f2f' }; 
      default:
        return { name: 'help-outline', color: '#9e9e9e' }; 
    }
  };
    
  const { name, color } = getContainerIcon(container.status);

  const getContainerBackground = (status) => {
    switch (status) {
      case 'available':
        return '#f3e5f5';
      case 'active':
        return '#e8f5e9';
      case 'returned':
        return '#e3f2fd';
      case 'lost':
        return '#fff3e0';
      case 'damaged':
        return '#ffebee'; 
      default:
        return '#e0e0e0'; 
    }
  };
    
  const backgroundColor = getContainerBackground(container.status);

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'available':
        return '#9c27b0';
      case 'active':
        return '#2e7d32'; 
      case 'returned':
        return '#0277bd'; 
      case 'lost':
        return '#ff9800'; 
      case 'damaged':
        return '#d32f2f'; 
      default:
        return '#757575'; 
    }
  };
    
  const statusTextColor = getStatusTextColor(container.status);
    
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
          Container Details
        </BoldText>
        <TouchableOpacity onPress={closeModal}>
          <Ionicons name="close-circle-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <RNScrollView 
        contentContainerStyle={styles.modalBodyScrollContent}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.modalBody}>
        <View style={[styles.containerIconLarge, { backgroundColor }]}>
          <Ionicons name={name} size={24} color={color} />
        </View>
        
        <BoldText style={{ fontSize: 24, marginVertical: 8, color: theme.text }}>
          {container.containerTypeId.name}
        </BoldText>
        
        <View style={styles.statusChip}>
          <RegularText style={{ color: statusTextColor, fontSize: 16 }}>
            {container.status.toUpperCase()}
          </RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Container Code:</RegularText>
          <RegularText style={{ color: theme.text, fontSize: 12 }}>{container.qrCode}</RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Rebate Value:</RegularText>
          <RegularText style={{ color: theme.text }}>
            ₱{container.rebateValue ? container.rebateValue.toFixed(2) : container.containerTypeId.rebateValue.toFixed(2)}
          </RegularText>
        </View>
        
        {/* Add customer details for staff view */}
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Customer:</RegularText>
          <RegularText style={{ color: theme.text }}>{customerName}</RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Email:</RegularText>
          <RegularText style={{ color: theme.text }}>{customerEmail}</RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Registered:</RegularText>
          <RegularText style={{ color: theme.text }}>{registrationDate}</RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Last Used:</RegularText>
          <RegularText style={{ color: theme.text }}>{lastUsed}</RegularText>
        </View>
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Usage Count:</RegularText>
          <RegularText style={{ color: theme.text }}>{container.usesCount}</RegularText>
        </View>
        
        {container.status === 'active' && (
          <View style={styles.detailRow}>
            <RegularText style={styles.detailLabel}>Uses Left:</RegularText>
            <RegularText style={{ color: theme.text }}>{estimatedUsesLeft}</RegularText>
          </View>
        )}
      </View>
      </RNScrollView>
    </Animated.View>
  );
};

const StaffContainersList = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [containerStats, setContainerStats] = useState({
    availableContainers: 0,
    activeContainers: 0,
    returnedContainers: 0
  });
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalBackdrop] = useState(new Animated.Value(0));
  const [activeFilter, setActiveFilter] = useState(route.params?.filter || 'all');
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Update activeFilter when route.params.filter changes
  useEffect(() => {
    if (route.params?.filter) {
      setActiveFilter(route.params.filter);
      applyFilter(route.params.filter);
    }
  }, [route.params?.filter]);

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
      console.error('Error fetching restaurant container stats:', error);
    }
  };
  const fetchRestaurantDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
  
      if (!token || !user.restaurantId) {
        console.error('No auth token or restaurantId found');
        return;
      }
  
      const response = await axios.get(
        `${getApiUrl(`/restaurants/${user.restaurantId}`)}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (response.data) {
        setRestaurantName(response.data.name);
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };
  

  const fetchContainerRebateValue = async (container) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      const response = await axios.get(
        `${getApiUrl(`/containers/rebate-value/${container.containerTypeId._id}`)}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Create a new container object with the updated rebate value
      return {
        ...container,
        rebateValue: response.data.rebateValue
      };
    } catch (error) {
      console.error('Error fetching rebate value:', error);
      // Fallback to original container type rebate value
      return container;
    }
  };
  
  // Modify your container fetching logic
  const fetchContainers = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token || !user.restaurantId) {
        console.error('No auth token or restaurantId found');
        return;
      }
      
      const response = await axios.get(
        `${getApiUrl(`/containers/restaurant/${user.restaurantId}`)}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        // Fetch rebate values for each container
        const containersWithRebates = await Promise.all(
          response.data.map(container => fetchContainerRebateValue(container))
        );
        
        setContainers(containersWithRebates);
        applyFilter(activeFilter, containersWithRebates);
      }
    } catch (error) {
      console.error('Error fetching restaurant containers:', error);
    }
  };

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'Available' },
    { id: 'active', label: 'Active' },
    { id: 'returned', label: 'Returned' },
    { id: 'lost', label: 'Lost' },
    { id: 'damaged', label: 'Damaged' },
  ];
  const handleSearch = (query) => {
    if (!query.trim()) {
      applyFilter(activeFilter);
      return;
    }
  
    const filtered = activeFilter === 'all' 
      ? containers 
      : containers.filter(item => item.status === activeFilter);
  
    const results = filtered.filter(container => {
      const containerTypeName = container.containerTypeId?.name?.toLowerCase() || '';
      const qrCode = container.qrCode?.toLowerCase() || '';
      const customerName = container.customerId 
        ? `${container.customerId.firstName || ''} ${container.customerId.lastName || ''}`.toLowerCase() 
        : '';
      const restaurantName = container.restaurantId?.name?.toLowerCase() || '';
  
      const searchLower = query.toLowerCase();
  
      return containerTypeName.includes(searchLower) || 
             qrCode.includes(searchLower) || 
             customerName.includes(searchLower) ||
             restaurantName.includes(searchLower);
    });
  
    setFilteredContainers(results);
  };
  
  const applyFilter = (filter, containerList = containers) => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
      return;
    }
    
    if (filter === 'all') {
      setFilteredContainers(containerList);
    } else {
      const filtered = containerList.filter(item => item.status === filter);
      setFilteredContainers(filtered);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(filter);
  };
  
  useEffect(() => {
    applyFilter(activeFilter);
  }, [containers]);
  

  useEffect(() => {
    const setNavBarColor = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(theme.background);
      }
    };
    setNavBarColor();
  }, [theme.background]);

  useEffect(() => {
    fetchContainerStats();
    fetchContainers();
    fetchRestaurantDetails();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    await Promise.all([fetchContainerStats(), fetchContainers()]);
    setRefreshing(false);
  };

  const openContainerDetail = (container) => {
    setSelectedContainer(container);
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

  const closeContainerDetail = () => {
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
      setSelectedContainer(null);

      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(theme.background); 
      }
    });
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
        {restaurantName || "Restaurant"} Containers
      </BoldText>
        <View style={{ width: 24 }} />
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
        {/* Container Stats */}
        <View style={styles.section}>
          <View style={styles.cardsContainer}>
            <ContainerCard 
              title="Available" 
              value={containerStats.availableContainers}
              icon="cafe-outline"
              backgroundColor="#f3e5f5"
              textColor="#9c27b0"
            />
            
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
          </View>
        </View>
        
        {/* Containers List */}
        <View style={styles.section}>
        <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
          {searchQuery.trim() 
            ? `Search Results (${filteredContainers.length})` 
            : `${filterOptions.find(option => option.id === activeFilter)?.label} Containers`}
        </SemiBoldText>

          <FilterTabs 
            options={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
            theme={theme}
          />
          <SearchComponent 
            onSearch={handleSearch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            theme={theme}
            placeholder="Search by type, QR code, or customer..."
          />
          {filteredContainers.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
              <Ionicons name="cube-outline" size={48} color={theme.text} style={{ opacity: 0.4 }} />
              <RegularText style={{ color: theme.text, textAlign: 'center', marginTop: 12 }}>
                {containers.length === 0 
                  ? "No containers found for this restaurant." 
                  : "No containers match the selected filter."}
              </RegularText>
            </View>
          ) : (
            <View style={styles.containersList}>
              {filteredContainers.map((container) => (
                <ContainerItem 
                  key={container._id} 
                  container={container} 
                  onPress={openContainerDetail}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Scan QR Button */}
      {containers.length > 0 && (
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => navigation.navigate('StaffScanner', { action: 'rebate' })}
        >
          <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* Modal Backdrop */}
      {modalVisible && (
        <TouchableOpacity 
          style={[styles.modalBackdrop, { opacity: modalBackdrop }]}
          activeOpacity={0.95}
          onPress={closeContainerDetail}
        />
      )}
      
      {/* Container Detail Modal */}
      {modalVisible && (
        <ContainerDetailModal 
          container={selectedContainer} 
          animation={modalAnimation} 
          closeModal={closeContainerDetail}
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
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  card: {
    width: width / 3 - 14,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    textAlign: 'center',
  },
  containersList: {
    marginTop: 8,
  },
  containerItem: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  containerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  containerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  containerInfo: {
    flexShrink: 1,
  },
  containerItemRight: {
    paddingLeft: 8,
  },
  emptyState: {
    marginTop: 12,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00df82',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00df82',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
  containerIconLarge: {
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
  },
});

export default StaffContainersList;