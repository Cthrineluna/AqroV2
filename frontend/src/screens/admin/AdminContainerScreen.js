import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Modal,
  Alert,
  ScrollView as RNScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

const RebateSection = ({ container, theme }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [restaurantRebates, setRestaurantRebates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRestaurantRebates = async () => {
      if (!container || !container.containerTypeId) {
        console.error('Container or Container Type is missing');
        setIsLoading(false);
        return;
      }
    
      try {
        const token = await AsyncStorage.getItem('aqro_token');
        if (!token) {
          console.error('No auth token found');
          setIsLoading(false);
          return;
        }
    
        const containerTypeId = container.containerTypeId._id || container.containerTypeId;
    
        const response = await axios.get(
          `${getApiUrl('/containers/rebate-mappings-by-container-type')}/${containerTypeId}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
    
        if (response.data && response.data.length > 0) {
          const rebatesWithNames = response.data.map(mapping => ({
            restaurantName: mapping.restaurantId.name,
            rebateValue: mapping.rebateValue
          }));
    
          setRestaurantRebates(rebatesWithNames);
        }
      } catch (error) {
        console.error('Error fetching restaurant rebates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantRebates();
  }, [container]); 

  const toggleExpand = () => {
    const dynamicHeight = isExpanded 
      ? 0 
      : Math.min(
          (restaurantRebates.length || 1) * 50, 
          250
        );

    Animated.timing(animatedHeight, {
      toValue: dynamicHeight,
      duration: 300,
      useNativeDriver: false
    }).start(() => {
      setIsExpanded(!isExpanded);
    });
  };

  if (isLoading && restaurantRebates.length === 0) {
    return (
      <View style={[styles.detailRow, { flexDirection: 'column' }]}>
        <RegularText style={[styles.detailLabel, { opacity: 0.7 }]}>
          Restaurant Rebates
        </RegularText>
        <RegularText style={[styles.detailLabel, { width: '100%', textAlign: 'center' }]}>
          Loading rebates...
        </RegularText>
      </View>
    );
  }

  if (restaurantRebates.length === 0) {
    return null;
  }

  return (
    <View style={[styles.detailRow, { 
      flexDirection: 'column', 
      borderBottomWidth: 0, 
      paddingVertical: 0,
    }]}>
      <TouchableOpacity 
        style={[
          styles.detailRow, 
          { 
            width: '100%', 
            paddingVertical: 6,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(0,0,0,0.05)'
          }
        ]}
        onPress={toggleExpand}
      >
        <RegularText style={[styles.detailLabel, { opacity: 0.7 }]}>
          Restaurant Rebates
        </RegularText>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.text} 
        />
      </TouchableOpacity>
  
      <Animated.View 
        style={{
          height: animatedHeight, 
          overflow: 'hidden',
          width: '100%'
        }}
      >
        {restaurantRebates.map((rebate, index) => (
          <View 
            key={index} 
            style={[
              styles.detailRow,
              { 
                paddingVertical: 8,
                borderBottomWidth: index < restaurantRebates.length - 1 
                  ? StyleSheet.hairlineWidth 
                  : 0,
                borderBottomColor: 'rgba(0,0,0,0.05)'
              }
            ]}
          >
            <RegularText style={{ opacity: 0.7 }}>{rebate.restaurantName}</RegularText>
            <RegularText style={{ color: theme.text }}>₱{rebate.rebateValue.toFixed(2)}</RegularText>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const ContainerItem = ({ container, onPress }) => {
  const { theme } = useTheme();
  const estimatedUsesLeft = container.containerTypeId.maxUses - container.usesCount; 
  
  const customerName = container.customerId ? 
    `${container.customerId.firstName} ${container.customerId.lastName}` : 
    'Unregistered';
  
  const restaurantName = container.restaurantId ?
    container.restaurantId.name :
    'Unassigned';
    
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
            <RegularText style={{ color: theme.text, fontSize: 12, opacity: 0.7 }}>
              Restaurant: {restaurantName}
            </RegularText>
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

const ContainerDetailModal = ({ container, animation, closeModal, editContainer, deleteContainer, navigation }) => {
  const { theme } = useTheme();
  const estimatedUsesLeft = container?.containerTypeId?.maxUses - (container?.usesCount || 0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  if (!container) return null;

  const createdAt = container.createdAt 
    ? new Date(container.createdAt).toLocaleDateString() 
    : 'N/A';
  
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
  
  const restaurantName = container.restaurantId ?
    container.restaurantId.name :
    'Unassigned';
  
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
  const handleViewQR = async () => {
    try {
      const baseUrl = getApiUrl('').replace('/api', '');
      const url = `${baseUrl}/api/containers/qrcode/${container._id}`;
      setQrCodeUrl(url);
      setShowQRModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load QR code');
    }
  };
    
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
          <RegularText style={styles.detailLabel}>Date Created:</RegularText>
          <RegularText style={{ color: theme.text }}>{createdAt}</RegularText>
        </View>

        <RebateSection container={container} theme={theme} />
        
        <View style={styles.detailRow}>
          <RegularText style={styles.detailLabel}>Restaurant:</RegularText>
          <RegularText style={{ color: theme.text }}>{restaurantName}</RegularText>
        </View>
        
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


        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={handleViewQR}
        >
            <Ionicons name="qr-code-outline" size={18} color="#FFFFFF" />
            <MediumText style={styles.actionButtonText}>View QR</MediumText>
        </TouchableOpacity>
        <Modal
        transparent={true}
        visible={showQRModal}
        onRequestClose={() => setShowQRModal(false)}
        animationType="slide"
      >
        <View style={[styles.qrModalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.qrModalHeader}>
            <BoldText style={{ fontSize: 20, color: theme.text }}>
              Container QR Code
            </BoldText>
            <TouchableOpacity onPress={() => setShowQRModal(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrModalBody}>
            <Image 
              source={{ uri: qrCodeUrl }} 
              style={styles.qrCodeImage} 
              resizeMode="contain" 
            />
            <MediumText style={{ color: theme.text, marginTop: 16, textAlign: 'center', marginBottom: 16 }}>
              Scan this QR code to use the container
            </MediumText>
          </View>
        
        </View>
      </Modal>
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
                onPress={() => editContainer(container)}
            >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <MediumText style={styles.actionButtonText}>Edit</MediumText>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#d32f2f' }]}
                onPress={() => deleteContainer(container)}
            >
                <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                <MediumText style={styles.actionButtonText}>Delete</MediumText>
            </TouchableOpacity>
        </View>
      </View>
      </RNScrollView>
    </Animated.View>
  );
};

const ActionModal = ({ visible, container, onClose, onEdit, onDelete }) => {
  const { theme } = useTheme();
  
  if (!visible) return null;
  
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.actionModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View 
          style={[styles.actionModalContainer, { backgroundColor: theme.primary}]}
        >
          <View style={styles.actionModalHeader}>
            <BoldText style={{ fontSize: 18, color: theme.text }}>
              Container Actions
            </BoldText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.actionModalButton}
            onPress={() => {
              onClose();
              onEdit(container);
            }}
          >
            <Ionicons name="create-outline" size={24} color={theme.primary} />
            <MediumText style={{ marginLeft: 12, color: theme.text }}>
              Edit Container
            </MediumText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionModalButton}
            onPress={() => {
              onClose();
              onDelete(container);
            }}
          >
            <Ionicons name="trash-outline" size={24} color="#d32f2f" />
            <MediumText style={{ marginLeft: 12, color: theme.text }}>
              Delete Container
            </MediumText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const FilterModal = ({ visible, onClose, restaurants, containerTypes, selectedRestaurant, selectedContainerType, onSelectRestaurant, onSelectContainerType, theme }) => {
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
  const [containerTypeSearchQuery, setContainerTypeSearchQuery] = useState('');
  
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
  );

  const filteredContainerTypes = containerTypes.filter(type => 
    type.name.toLowerCase().includes(containerTypeSearchQuery.toLowerCase())
  );

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.filterModalOverlay}>
        <View style={[styles.filterModalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.filterModalHeader}>
            <BoldText style={{ fontSize: 20, color: theme.text }}>
              Filter Containers
            </BoldText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
              Filter by Restaurant
            </MediumText>
            
            <View style={[styles.searchInputContainer, { backgroundColor: theme?.input || '#F5F5F5' }]}>
              <Ionicons name="search" size={20} color={theme.text} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search restaurants..."
                placeholderTextColor={theme?.textMuted || '#888888'}
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
                onPress={() => onSelectRestaurant(null)}
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
                  onPress={() => onSelectRestaurant(restaurant)}
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
          
          <View style={styles.filterSection}>
            <MediumText style={{ fontSize: 16, color: theme.text, marginBottom: 8 }}>
              Filter by Container Type
            </MediumText>
            
            <View style={[styles.searchInputContainer, { backgroundColor: theme.input }]}>
              <Ionicons name="search" size={20} color={theme.text} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search container types..."
                placeholderTextColor={theme?.textMuted || '#888888'}
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
                onPress={() => onSelectContainerType(null)}
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
                  onPress={() => onSelectContainerType(type)}
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
          
          <TouchableOpacity 
            style={[styles.applyFilterButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <MediumText style={{ color: '#FFFFFF', fontSize: 16 }}>
              Apply Filters
            </MediumText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const EditContainerModal = ({ visible, container, onClose, onSave, restaurants, containerTypes, theme }) => {
    const [status, setStatus] = useState(container?.status || 'available');
    const [selectedRestaurant, setSelectedRestaurant] = useState(container?.restaurantId || null);
    const [selectedContainerType, setSelectedContainerType] = useState(container?.containerTypeId || null);
    const [selectedUser, setSelectedUser] = useState(container?.customerId || null);
    const [usesCount, setUsesCount] = useState(container?.usesCount || 0);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showRestaurantSearch, setShowRestaurantSearch] = useState(false);
    const [showContainerTypeSearch, setShowContainerTypeSearch] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
    const [containerTypeSearchQuery, setContainerTypeSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQRCode, setGeneratedQRCode] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
      const [quantity, setQuantity] = useState(1); 
  
  useEffect(() => {
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
    
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  useEffect(() => {
    if (container) {
      setStatus(container.status || 'available');
      setSelectedRestaurant(container.restaurantId || null);
      setSelectedContainerType(container.containerTypeId || null);
      setSelectedUser(container.customerId || null);
      setUsesCount(container.usesCount || 0);
    } else {
      setStatus('available');
      setSelectedRestaurant(null);
      setSelectedContainerType(null);
      setSelectedUser(null);
      setUsesCount(0);
    }
  }, [container, visible]);
  
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'active', label: 'Active' },
    { value: 'returned', label: 'Returned' },
    { value: 'lost', label: 'Lost' },
    { value: 'damaged', label: 'Damaged' }
  ];
  
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
  );

  const filteredContainerTypes = containerTypes.filter(type => 
    type.name.toLowerCase().includes(containerTypeSearchQuery.toLowerCase())
  );
  const filteredUsers = users.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
  
 const handleSave = async () => {
    if (!selectedContainerType) {
      Alert.alert('Error', 'Container Type is required');
      return;
    }

    setIsGenerating(true);

    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const containerData = {
        status,
        restaurantId: selectedRestaurant?._id || null,
        containerTypeId: selectedContainerType._id,
        customerId: selectedUser?._id || null,
        usesCount: parseInt(usesCount) || 0
      };

      let savedContainers = [];
      
      if (container?._id) {
        // Update existing container (single container)
        const response = await axios.put(
          getApiUrl(`/containers/${container._id}`),
          containerData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        savedContainers.push(response.data);
      } else {
        // Create multiple containers
        for (let i = 0; i < quantity; i++) {
          // Generate QR code first
          const generateResponse = await axios.post(
            getApiUrl('/containers/generate'),
            {
              containerTypeId: containerData.containerTypeId,
              restaurantId: containerData.restaurantId
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Create container with the generated QR code
          const createResponse = await axios.post(
            getApiUrl('/containers'),
            {
              ...containerData,
              qrCode: generateResponse.data.qrCode
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          savedContainers.push(createResponse.data);
        }
      }

      Alert.alert('Success', container?._id 
        ? 'Container updated' 
        : `${quantity} containers created successfully`);
      
      onClose();
      if (onSave) onSave(savedContainers[0]); // For now, just pass the first one

    } catch (error) {
      console.error('Save error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save container');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRCode = async (containerTypeId, restaurantId) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.post(
        getApiUrl('/containers/generate'),
        { containerTypeId, restaurantId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Return both the QR code string and URL
      return {
        qrCode: response.data.qrCode,
        qrCodeUrl: `${getApiUrl('').replace('/api', '')}/qr-codes/${response.data.qrCode}.png`
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
      return null;
    }
  };
  const QRModal = ({ visible, qrCodeUrl, onClose, theme }) => {
    if (!visible) return null;
  
    return (
      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        animationType="slide"
      >
        <View style={[styles.qrModalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.qrModalHeader}>
            <BoldText style={{ fontSize: 20, color: theme.text }}>
              Container QR Code
            </BoldText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrModalBody}>
            {qrCodeUrl ? (
              <Image 
                source={{ uri: qrCodeUrl }} 
                style={styles.qrCodeImage}
                resizeMode="contain"
                onError={(e) => console.log('Failed to load image', e.nativeEvent.error)}
              />
            ) : (
              <ActivityIndicator size="large" color={theme.primary} />
            )}
            <MediumText style={{ color: theme.text, marginTop: 16, textAlign: 'center' }}>
              Scan this QR code to use the container
            </MediumText>
          </View>
          
          <TouchableOpacity 
            style={[styles.qrModalButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <MediumText style={{ color: '#FFFFFF' }}>Close</MediumText>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };
  
  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={[styles.editModalContainer, { backgroundColor: theme.background }]}>
          <View style={styles.editModalHeader}>
            <BoldText style={{ fontSize: 20, color: theme.text }}>
              {container ? 'Edit Container' : 'Add Container'}
            </BoldText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.editModalBody}>
            <View style={styles.formGroup}>
              <MediumText style={{ color: theme.text, marginBottom: 8 }}>Assigned User (Optional)</MediumText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: theme.input }]}
                onPress={() => setShowUserSearch(!showUserSearch)}
              >
                <RegularText style={{ color: theme.text }}>
                  {selectedUser 
                    ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                    : 'Select User'}
                </RegularText>
                <Ionicons 
                  name={showUserSearch ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>
              
              {showUserSearch && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
                  <View style={[styles.searchInputContainer, { backgroundColor: theme.input, margin: 8 }]}>
                    <Ionicons name="search" size={20} color={theme.text} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search users..."
                      placeholderTextColor={theme?.textMuted || '#888888'}
                      value={userSearchQuery}
                      onChangeText={setUserSearchQuery}
                    />
                    {userSearchQuery !== '' && (
                      <TouchableOpacity onPress={() => setUserSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView 
      style={{ maxHeight: 200 }}
      nestedScrollEnabled={true}
    >
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      { 
                        backgroundColor: !selectedUser 
                          ? theme.primary + '20' 
                          : 'transparent' 
                      }
                    ]}
                    onPress={() => {
                      setSelectedUser(null);
                      setShowUserSearch(false);
                    }}
                  >
                    <RegularText style={{ 
                      color: !selectedUser ? theme.primary : theme.text 
                    }}>
                      None
                    </RegularText>
                    {!selectedUser && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                  
                {filteredUsers.map(user => (
                <TouchableOpacity
                    key={user._id}
                    style={[
                    styles.dropdownItem, 
                    { 
                        backgroundColor: selectedUser?._id === user._id 
                        ? theme.primary + '20' 
                        : 'transparent' 
                    }
                    ]}
                    onPress={() => {
                    setSelectedUser(user);
                    setShowUserSearch(false);
                    }}
                >
                    <RegularText style={{ 
                    color: selectedUser?._id === user._id 
                        ? theme.primary 
                        : theme.text 
                    }}>
                    {user.firstName} {user.lastName} ({user.email})
                    </RegularText>
                    {selectedUser?._id === user._id && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                </TouchableOpacity>
                ))}
            </ScrollView>
                </View>
              )}
            </View>


            <View style={styles.formGroup}>
              <MediumText style={{ color: theme.text, marginBottom: 8 }}>Status</MediumText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: theme.input }]}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <RegularText style={{ color: theme.text }}>
                  {statusOptions.find(option => option.value === status)?.label || 'Select Status'}
                </RegularText>
                <Ionicons 
                  name={showStatusDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>

              {showStatusDropdown && (
                 <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
            <ScrollView 
              style={{ maxHeight: 200 }}
              nestedScrollEnabled={true}
            >
              {statusOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem, 
                    { 
                      backgroundColor: status === option.value 
                        ? theme.primary + '20' 
                        : 'transparent' 
                    }
                  ]}
                  onPress={() => {
                    setStatus(option.value);
                    setShowStatusDropdown(false);
                  }}
                >
                      <RegularText style={{ 
                        color: status === option.value ? theme.primary : theme.text 
                      }}>
                        {option.label}
                      </RegularText>
                      {status === option.value && (
                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <MediumText style={{ color: theme.text, marginBottom: 8 }}>Uses Count</MediumText>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.input || '#F5F5F5', color: theme.text }]}
                placeholder="Enter uses count"
                placeholderTextColor={theme?.textMuted || '#888888'}
                value={usesCount.toString()}
                onChangeText={(text) => setUsesCount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formGroup}>
              <MediumText style={{ color: theme.text, marginBottom: 8 }}>Restaurant (Optional)</MediumText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: theme.input }]}
                onPress={() => setShowRestaurantSearch(!showRestaurantSearch)}
              >
                <RegularText style={{ color: theme.text }}>
                  {selectedRestaurant?.name || 'Select Restaurant'}
                </RegularText>
                <Ionicons 
                  name={showRestaurantSearch ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>
              
              {showRestaurantSearch && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
                  <View style={[styles.searchInputContainer, { backgroundColor: theme.input, margin: 8 }]}>
                    <Ionicons name="search" size={20} color={theme.text} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search restaurants..."
                      placeholderTextColor={theme?.textMuted || '#888888'}
                      value={restaurantSearchQuery}
                      onChangeText={setRestaurantSearchQuery}
                    />
                    
                    {restaurantSearchQuery !== '' && (
                      <TouchableOpacity onPress={() => setRestaurantSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <ScrollView 
                  style={{ maxHeight: 200 }}
                  nestedScrollEnabled={true}
                >
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      { 
                        backgroundColor: !selectedRestaurant 
                          ? theme.primary + '20' 
                          : 'transparent' 
                      }
                    ]}
                    onPress={() => {
                      setSelectedRestaurant(null);
                      setShowRestaurantSearch(false);
                    }}
                  >
                    <RegularText style={{ 
                      color: !selectedRestaurant ? theme.primary : theme.text 
                    }}>
                      None
                    </RegularText>
                    {!selectedRestaurant && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                  
                  {filteredRestaurants.map(restaurant => (
                    <TouchableOpacity
                      key={restaurant._id}
                      style={[
                        styles.dropdownItem, 
                        { 
                          backgroundColor: selectedRestaurant?._id === restaurant._id 
                            ? theme.primary + '20' 
                            : 'transparent' 
                        }
                      ]}
                      onPress={() => {
                        setSelectedRestaurant(restaurant);
                        setShowRestaurantSearch(false);
                      }}
                    >

                    <RegularText style={{ 
                        color: selectedRestaurant?._id === restaurant._id 
                          ? theme.primary 
                          : theme.text 
                      }}>
                        {restaurant.name}
                      </RegularText>
                      {selectedRestaurant?._id === restaurant._id && (
                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                   </ScrollView>
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <MediumText style={{ color: theme.text, marginBottom: 8 }}>Container Type</MediumText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: theme.input }]}
                onPress={() => setShowContainerTypeSearch(!showContainerTypeSearch)}
              >
                <RegularText style={{ color: theme.text }}>
                  {selectedContainerType?.name || 'Select Container Type'}
                </RegularText>
                <Ionicons 
                  name={showContainerTypeSearch ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>
              
              {showContainerTypeSearch && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
                  <View style={[styles.searchInputContainer, { backgroundColor: theme.input, margin: 8 }]}>
                    <Ionicons name="search" size={20} color={theme.text} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search container types..."
                      placeholderTextColor={theme?.textMuted || '#888888'}
                      value={containerTypeSearchQuery}
                      onChangeText={setContainerTypeSearchQuery}
                    />
                    {containerTypeSearchQuery !== '' && (
                      <TouchableOpacity onPress={() => setContainerTypeSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    nestedScrollEnabled={true}
                  >
                  {filteredContainerTypes.map(type => (
                    <TouchableOpacity
                      key={type._id}
                      style={[
                        styles.dropdownItem, 
                        { 
                          backgroundColor: selectedContainerType?._id === type._id 
                            ? theme.primary + '20' 
                            : 'transparent' 
                        }
                      ]}
                      onPress={() => {
                        setSelectedContainerType(type);
                        setShowContainerTypeSearch(false);
                      }}
                    >
                      <RegularText style={{ 
                        color: selectedContainerType?._id === type._id 
                          ? theme.primary 
                          : theme.text 
                      }}>
                        {type.name}
                      </RegularText>
                      {selectedContainerType?._id === type._id && (
                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  </ScrollView>
                </View>
              )}
            </View>

{!container?._id && (
  <View style={styles.formGroup}>
    <MediumText style={{ color: theme.text, marginBottom: 8 }}>Quantity</MediumText>
    <View style={styles.quantityContainer}>
      <TouchableOpacity 
        style={[styles.quantityButton, { backgroundColor: theme.primary }]}
        onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
        disabled={quantity <= 1}
      >
        <Ionicons name="remove" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TextInput
        style={[styles.quantityDisplay, { 
          backgroundColor: theme.input, 
          color: theme.text,
          textAlign: 'center'
        }]}
        value={quantity.toString()}
        onChangeText={(text) => {
          const num = parseInt(text.replace(/[^0-9]/g, ''));
          setQuantity(isNaN(num) ? 1 : Math.max(1, num));
        }}
        keyboardType="numeric"
      />
      
      <TouchableOpacity 
        style={[styles.quantityButton, { backgroundColor: theme.primary }]}
        onPress={() => setQuantity(prev => prev + 1)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  </View>
)}

          </ScrollView>
          
          <View style={styles.editModalFooter}>
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: theme.text }]}
              onPress={onClose}
            >
              <MediumText style={{ color: theme.text }}>Cancel</MediumText>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={isGenerating}
            >
                {isGenerating ? (
                <ActivityIndicator color="#FFFFFF" />
                ) : (
                <MediumText style={{ color: '#FFFFFF' }}>Save</MediumText>
                )}
            </TouchableOpacity>
          </View>
        </View>
        <QRModal
        visible={showQRModal}
        qrCodeUrl={generatedQRCode}
        onClose={() => setShowQRModal(false)}
        theme={theme}
      />
      </View>
    </Modal>
  );
};

const AdminContainersScreen = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [containers, setContainers] = useState([]);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [modalBackdrop] = useState(new Animated.Value(0));
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedContainerType, setSelectedContainerType] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(route.params?.userId || null);
  const [userName, setUserName] = useState(''); // Add this if you need userName
  const [generatedQRCode, setGeneratedQRCode] = useState(null); // Add this line
  const [showQRModal, setShowQRModal] = useState(false);
  const QRModal = ({ visible, qrCodeUrl, onClose, theme }) => {
    if (!visible) return null;
  
    return (
      <Modal
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        animationType="slide"
      >
        <View style={[styles.qrModalContainer, { backgroundColor: theme.card }]}>
          <View style={styles.qrModalHeader}>
            <BoldText style={{ fontSize: 20, color: theme.text }}>
              New Container QR Code
            </BoldText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrModalBody}>
            <Image 
              source={{ uri: qrCodeUrl }} 
              style={styles.qrCodeImage} 
              resizeMode="contain" 
            />
            <MediumText style={{ color: theme.text, marginTop: 16, textAlign: 'center' }}>
              Scan this QR code to use the container
            </MediumText>
          </View>
          
          <TouchableOpacity 
            style={[styles.qrModalButton, { backgroundColor: theme.primary }]}
            onPress={onClose}
          >
            <MediumText style={{ color: '#FFFFFF' }}>Done</MediumText>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const generateQRCode = async (containerTypeId, restaurantId) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.post(
        getApiUrl('/containers/generate'),
        { containerTypeId, restaurantId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
      return null;
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

  const fetchAllContainers = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      let url = getApiUrl('/containers/all');
      
      // Only include customerId if userId is provided
      const params = userId ? { customerId: userId } : {};
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
  
      if (response.data) {
        setContainers(response.data);
        applyFilters(response.data);
      }
    } catch (error) {
      console.error('Error fetching containers:', error);
      Alert.alert('Error', 'Failed to load containers');
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

  const applyFilters = (containerList = containers) => {
    let filtered = [...containerList];
    
    if (userId) {
        filtered = filtered.filter(item => 
          item.customerId && item.customerId._id === userId
        );
      }
    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.status === activeFilter);
    }
    
    // Apply restaurant filter
    if (selectedRestaurant) {
      filtered = filtered.filter(item => 
        item.restaurantId && item.restaurantId._id === selectedRestaurant._id
      );
    }
    
    // Apply container type filter
    if (selectedContainerType) {
      filtered = filtered.filter(item => 
        item.containerTypeId && item.containerTypeId._id === selectedContainerType._id
      );
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(container => {
        const containerTypeName = container.containerTypeId?.name?.toLowerCase() || '';
        const qrCode = container.qrCode?.toLowerCase() || '';
        const customerName = container.customerId 
          ? `${container.customerId.firstName || ''} ${container.customerId.lastName || ''}`.toLowerCase() 
          : '';
        const restaurantName = container.restaurantId?.name?.toLowerCase() || '';
        
        return containerTypeName.includes(query) || 
               qrCode.includes(query) || 
               customerName.includes(query) ||
               restaurantName.includes(query);
      });
    }
    
    setFilteredContainers(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters();
  };
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setUserId(null); // Reset userId when navigating away
    });
    return unsubscribe;
  }, [navigation]);
  
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters();
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setFilterModalVisible(false);
    applyFilters();
  };

  const handleSelectContainerType = (type) => {
    setSelectedContainerType(type);
    setFilterModalVisible(false);
    applyFilters();
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

  const handleEditContainer = (container) => {
    setSelectedContainer(container);
    setEditModalVisible(true);
    setModalVisible(false);
  };

  const handleDeleteContainer = (container) => {
    Alert.alert(
      'Delete Container',
      'Are you sure you want to delete this container?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteContainer(container._id)
        }
      ]
    );
    setModalVisible(false);
  };

  const deleteContainer = async (containerId) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      await axios.delete(getApiUrl(`/containers/${containerId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchAllContainers();
      Alert.alert('Success', 'Container deleted successfully');
    } catch (error) {
      console.error('Error deleting container:', error);
      Alert.alert('Error', 'Failed to delete container');
    }
  };

  const saveContainer = async (containerData) => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      
      let response;
      if (containerData._id) {
        // Update existing container
        response = await axios.put(
          getApiUrl(`/containers/${containerData._id}`),
          {
            status: containerData.status,
            restaurantId: containerData.restaurantId,
            containerTypeId: containerData.containerTypeId,
            customerId: containerData.customerId,
            usesCount: containerData.usesCount
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new container - generate QR code first
        const generateResponse = await axios.post(
          getApiUrl('/containers/generate'),
          {
            containerTypeId: containerData.containerTypeId,
            restaurantId: containerData.restaurantId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Then save the container with the generated QR code
        response = await axios.post(
          getApiUrl('/containers'),
          {
            ...containerData,
            qrCode: generateResponse.data.qrCode
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Get the QR code URL for display
        const baseUrl = getApiUrl('').replace('/api', '');
        setGeneratedQRCode(`${baseUrl}${generateResponse.data.qrCodeUrl}`);
        setShowQRModal(true);
      }
      
      return response.data;
    } catch (error) {
      console.error('Save error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedRestaurant(null);
    setSelectedContainerType(null);
    setActiveFilter('all');
    await Promise.all([fetchAllContainers(), fetchRestaurants(), fetchContainerTypes()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (route.params?.userId) {
      setUserId(route.params.userId);
      // If you need to set userName from params:
      // setUserName(route.params.userName || '');
    }
  }, [route.params]);

  useEffect(() => {
    const setNavBarColor = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(theme.background);
      }
    };
    setNavBarColor();
  }, [theme.background]);

  useEffect(() => {
    fetchAllContainers();
    fetchRestaurants();
    fetchContainerTypes();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [containers, activeFilter, selectedRestaurant, selectedContainerType, searchQuery]);

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
    {userId ? 'User Containers' : 'All Containers'}
  </BoldText>
  <View style={{ flexDirection: 'row' }}>
  <TouchableOpacity onPress={() => setEditModalVisible(true)}>
      <Ionicons 
        name="add-circle-outline" 
        size={24} 
        color={theme?.primary || '#007BFF'} 
        style={{ marginRight: 16 }}
      />
    </TouchableOpacity>
    <TouchableOpacity 
      onPress={() => navigation.navigate('ContainerType')}
      
    >
      <Ionicons 
        name="list-outline" 
        size={24} 
        color={theme.text} 
      />
    </TouchableOpacity>
    
  </View>
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
        {/* Filters */}
        <View style={styles.section}>
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: theme.card }]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="filter" size={20} color={theme.text} />
              <MediumText style={{ marginLeft: 8, color: theme.text }}>
                Filters
              </MediumText>
            </TouchableOpacity>
            
            <View style={styles.activeFiltersContainer}>
              {selectedRestaurant && (
                <View style={[styles.activeFilterChip, { backgroundColor: theme.primary + '20' }]}>
                  <MediumText style={{ color: theme.primary, fontSize: 12 }}>
                    {selectedRestaurant.name}
                  </MediumText>
                  <TouchableOpacity onPress={() => setSelectedRestaurant(null)}>
                    <Ionicons name="close" size={16} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              )}
              
              {selectedContainerType && (
                <View style={[styles.activeFilterChip, { backgroundColor: theme.primary + '20' }]}>
                  <MediumText style={{ color: theme.primary, fontSize: 12 }}>
                    {selectedContainerType.name}
                  </MediumText>
                  <TouchableOpacity onPress={() => setSelectedContainerType(null)}>
                    <Ionicons name="close" size={16} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
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
            placeholder="Search by type, QR code, customer or restaurant..."
          />
        </View>
        
        {/* Containers List */}
        <View style={styles.section}>
          <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
            {filteredContainers.length} {activeFilter === 'all' ? '' : activeFilter} Containers Found
          </SemiBoldText>
          
          {filteredContainers.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
              <Ionicons name="cube-outline" size={48} color={theme.text} style={{ opacity: 0.4 }} />
              <RegularText style={{ color: theme.text, textAlign: 'center', marginTop: 12 }}>
                {containers.length === 0 
                  ? "No containers found." 
                  : "No containers match the current filters."}
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
      
      {/* Container Detail Modal */}
      {modalVisible && (
        <TouchableOpacity 
          style={[styles.modalBackdrop, { opacity: modalBackdrop }]}
          activeOpacity={0.95}
          onPress={closeContainerDetail}
        />
      )}
      
      {modalVisible && (
        <ContainerDetailModal 
          container={selectedContainer} 
          animation={modalAnimation} 
          closeModal={closeContainerDetail}
          editContainer={handleEditContainer}
          deleteContainer={handleDeleteContainer}
          navigation={navigation}
        />
      )}
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        restaurants={restaurants}
        containerTypes={containerTypes}
        selectedRestaurant={selectedRestaurant}
        selectedContainerType={selectedContainerType}
        onSelectRestaurant={handleSelectRestaurant}
        onSelectContainerType={handleSelectContainerType}
        theme={theme}
      />
      
      {/* Edit/Add Container Modal */}
      <EditContainerModal
        visible={editModalVisible}
        container={selectedContainer}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedContainer(null);
        }}
        onSave={saveContainer}
        restaurants={restaurants}
        containerTypes={containerTypes}
        theme={theme}
      />
       <QRModal
      visible={showQRModal}
      qrCodeUrl={generatedQRCode}
      onClose={() => setShowQRModal(false)}
      theme={theme}
    />
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    marginLeft: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
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
    flex: 1,
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
  modalBodyScrollContent: {
    paddingBottom: 20,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 8, 
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    margin: 2,
    justifyContent: 'center', 
  },
  actionButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 12,
  },
  filterModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
 filterModalContainer: {
  height: height * 0.8, // Reduce slightly to ensure space
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 16,
  paddingBottom: 20, // Add bottom padding
},
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
optionsList: {
  maxHeight: Platform.OS === 'android' ? 120 : 150,
  paddingBottom: Platform.OS === 'android' ? 30 : 30,
},
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
applyFilterButton: {
  padding: 16,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 16,
  marginBottom: 20, // Add bottom margin
  position: 'relative', // Ensure it stays visible
},
  // Edit Modal Styles
  editModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
editModalContainer: {
  height: height * 0.85,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingBottom: 0, // Extra space for Android
},
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  editModalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dropdownMenu: {
    position: 'relative',
    marginTop: 4,
    borderRadius: 8,
    maxHeight: 200,
    paddingBottom: 10,
    overflow: 'scroll', 
    zIndex: 1000,
  },
dropdownItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12, 
  paddingHorizontal: 16,
  minHeight: 44, 
},
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  qrModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalBody: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrModalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  qrModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrModalBody: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrModalButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    width: 80,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 0,
    fontSize: 16,
  },
});

export default AdminContainersScreen;