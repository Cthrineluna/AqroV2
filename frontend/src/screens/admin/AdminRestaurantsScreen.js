import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
  FlatList,
  Image,
  Modal as RNModal,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  RegularText, 
  SemiBoldText
} from '../../components/StyledComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import { Keyboard } from 'react-native';
import SearchComponent from '../../components/SearchComponent';

const { width } = Dimensions.get('window');

const AdminRestaurantsScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, userToken } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffActionModalVisible, setStaffActionModalVisible] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);


  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query || query.trim() === '') {
      setFilteredRestaurants(restaurants);
      return;
    }
  
    const results = restaurants.filter(restaurant => {
      const name = restaurant.name?.toLowerCase() || '';
      const city = restaurant.location?.city?.toLowerCase() || '';
      const address = restaurant.location?.address?.toLowerCase() || '';
      const contact = restaurant.contactNumber?.toLowerCase() || '';
      const searchLower = query.toLowerCase();
  
      return name.includes(searchLower) || 
             city.includes(searchLower) ||
             address.includes(searchLower) ||
             contact.includes(searchLower);
    });
  
    setFilteredRestaurants(results);
  };
  useEffect(() => {

    return () => {
      // Reset all modal states when component unmounts
      setModalVisible(false);
      setActionModalVisible(false);
      setStaffModalVisible(false);
      setStaffActionModalVisible(false);
    };
  }, []);

// In your fetch functions, add better error handling:
const fetchStaffForRestaurant = async (restaurantId) => {
  try {
    setStaffLoading(true);
    const storedToken = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/restaurants/${restaurantId}/staff`, {
      headers: { 
        Authorization: `Bearer ${storedToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // Add timeout to prevent hanging
    });
    setStaffList(response.data);
  } catch (error) {
    console.error('Error fetching staff:', error);
    Alert.alert('Error', 'Failed to load staff data. Please try again.');
    // Ensure modal can still be closed
    setStaffModalVisible(false);
  } finally {
    setStaffLoading(false);
  }
};
  
  // Fetch available staff (users with staff type and no restaurant)

const fetchAvailableStaff = async () => {
  try {
    setStaffLoading(true);
    const storedToken = await AsyncStorage.getItem('aqro_token');
    const response = await axios.get(`${getApiUrl()}/users/available-staff`, {
      headers: { 
        Authorization: `Bearer ${storedToken}`,
        'Content-Type': 'application/json'
      }
    });
    setAvailableStaff(response.data);
  } catch (error) {
    console.error('Error fetching available staff:', error.response?.data || error.message);
    Alert.alert('Error', error.response?.data?.message || 'Failed to fetch available staff');
  } finally {
    setStaffLoading(false);
  }
};
  // Assign staff to restaurant
  const assignStaffToRestaurant = async (userId, restaurantId) => {
    try {
   
      const storedToken = await AsyncStorage.getItem('aqro_token');
      
      await axios.put(
        `${getApiUrl()}/users/${userId}/assign-restaurant`,
        { restaurantId },
        {
          headers: { 
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      Alert.alert('Success', 'Staff assigned successfully',);


       fetchStaffForRestaurant(restaurantId),
       fetchAvailableStaff()
      setStaffActionModalVisible(false);
      setStaffModalVisible(false);
      
      
    } catch (error) {
      console.error('Error assigning staff:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign staff');
    } 
  };
  
  // Remove staff from restaurant
  const removeStaffFromRestaurant = async (userId, restaurantId) => {
    try {
      const storedToken = await AsyncStorage.getItem('aqro_token');
      await axios.put(
        `${getApiUrl()}/users/${userId}/remove-restaurant`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      

      fetchStaffForRestaurant(restaurantId);
      fetchAvailableStaff();
      setStaffActionModalVisible(false);
      setStaffModalVisible(false);
      
      Alert.alert('Success', 'Staff removed from restaurant successfully');
    } catch (error) {
      console.error('Error removing staff:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove staff');
    } 

  };
  


  
 
  // Fetch restaurants
  const fetchRestaurants = async () => {
    try {
      setRefreshing(true);
      const storedToken = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(`${getApiUrl()}/restaurants`, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      setRestaurants(response.data);
      setFilteredRestaurants(response.data); // Initialize filtered restaurants
    } catch (error) {
      console.error('Error fetching restaurants:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch restaurants');
    } finally {
      setRefreshing(false);
    }
  };


// Create/Update Restaurant
const handleSaveRestaurant = async (restaurantData) => {
  Keyboard.dismiss();
  
  try {
    const storedToken = await AsyncStorage.getItem('aqro_token');
    
    const formData = new FormData();
    formData.append('name', restaurantData.name);
    formData.append('description', restaurantData.description);
    formData.append('contactNumber', restaurantData.contactNumber);
    formData.append('location[address]', restaurantData.location.address);
    formData.append('location[city]', restaurantData.location.city);
    formData.append('isActive', restaurantData.isActive.toString());
    
    // Handle logo upload
    if (restaurantData.logo) {
      if (restaurantData.logo.startsWith('file:')) {
        formData.append('logo', restaurantData.logo);
      } else if (restaurantData.logo.startsWith('file:')) {
        const filename = restaurantData.logo.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('logo', {
          uri: restaurantData.logo,
          name: filename,
          type: type
        });
      }
    }
    if (restaurantData.banner) {
      if (restaurantData.banner.startsWith('file:')) {
        formData.append('banner', restaurantData.banner);
      } else if (restaurantData.banner.startsWith('file:')) {
        const filename = restaurantData.banner.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('banner', {
          uri: restaurantData.banner,
          name: filename,
          type: type
        });
      }
    }
    
    // Make API request based on whether editing or creating
    if (selectedRestaurant) {
      await axios.put(
        `${getApiUrl()}/restaurants/${selectedRestaurant._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      Alert.alert('Success', 'Restaurant updated successfully!');
    } else {
      await axios.post(
        `${getApiUrl()}/restaurants`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      Alert.alert('Success', 'Restaurant added successfully!');
    }

    fetchRestaurants();
    setModalVisible(false);
    setSelectedRestaurant(null);
  } catch (error) {
    console.error('Error saving restaurant:', error.response?.data || error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to save restaurant');
  }
};


  // Delete restaurant
  const handleDeleteRestaurant = async (restaurantId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this restaurant? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('aqro_token');
              await axios.delete(
                `${getApiUrl()}/restaurants/${restaurantId}`,
                {
                  headers: { 
                    Authorization: `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              fetchRestaurants();
              Alert.alert('Success', 'Restaurant deleted successfully');
            } catch (error) {
              console.error('Error deleting restaurant:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to delete restaurant'
              );
            }
          },
        },
      ]
    );
  };

  //SaveUsers
const handleSaveUser = async (userData) => {
  try {
    const storedToken = await AsyncStorage.getItem('aqro_token');
    const headers = { 
      Authorization: `Bearer ${storedToken}`, 
      'Content-Type': 'application/json' 
    };

    const payload = {
      firstName: userData.firstName,
      lastName:  userData.lastName,
      email:     userData.email,
      userType:  'staff',                     // force staff
      profileImage: userData.profileImage || null,
      ...(selectedUser ? {} : { password: userData.password }) // only on create
    };

    if (selectedUser) {
      await axios.put(`${getApiUrl()}/admin/users/${selectedUser._id}`, payload, { headers });
      Alert.alert('Success', 'Staff updated.');
    } else {
      await axios.post(`${getApiUrl()}/admin/users`, payload, { headers });
      Alert.alert('Success', 'Staff created.');
    }

    if (selectedRestaurant?._id) {
      await fetchStaffForRestaurant(selectedRestaurant._id);
    }
    await fetchAvailableStaff();

    setUserModalVisible(false);
    setSelectedUser(null);
  } catch (error) {
    console.log('handleSaveUser error', error?.response?.data || error?.message);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to save staff');
  }
};


  // Handle viewing containers or other related items
  const handleViewContainers = (restaurantId) => {
    setActionModalVisible(false);
    navigation.navigate('AdminContainerScreen', { restaurantId });
  };

    const openRestaurantModal = (restaurant = null, viewOnly = false) => {
      setSelectedRestaurant(restaurant);
      setModalVisible(true);
      setViewOnly(viewOnly);
      fadeIn();
    };
  const handleViewStaff = async (restaurantId) => {
    console.log('Closing action modal');
    setActionModalVisible(false);
    
    console.log('Fetching staff data');
    try {
      await Promise.all([
        fetchStaffForRestaurant(restaurantId),
        fetchAvailableStaff()
      ]);
      
      console.log('Data fetched, opening staff modal');
      setStaffModalVisible(true);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Helper function for email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // // Helper function for phone number validation
  // const isValidPhoneNumber = (number) => {
  //   const digits = number.replace(/\D/g, '');
  //   return /^639\d{9}$/.test(digits); 
  // };
  // const getRawPhoneNumber = () => {
  //   return localRestaurant.contactNumber.replace(/\D/g, ''); // e.g., 639123456789
  // };
  
  
  useEffect(() => {
    fetchRestaurants();
  }, []);
  const fadeIn = () => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
  
    const fadeOut = (callback) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        if (callback) callback();
      });
    };
  
    // Handle modal visibility with animation
    useEffect(() => {
      if (modalVisible || actionModalVisible) {
        fadeIn();
      }
    }, [modalVisible, actionModalVisible]);

  const renderRestaurantItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.restaurantCard, 
        { 
          backgroundColor: theme?.card || '#FFFFFF', 
          borderColor: theme?.border || '#E0E0E0' 
        }
      ]}
      onPress={() => {
        setSelectedRestaurant(item);
        setActionModalVisible(true);
        fadeIn();
      }}
    >
       {item.banner && (
      <Image 
        source={{ uri: item.banner }} 
        style={styles.restaurantBanner}
        resizeMode="cover"
      />
    )}
      <View style={styles.restaurantCardContent}>
        {/* Logo Image or Initials */}
        <View style={styles.logoContainer}>
          {item.logo ? (
            <Image 
            source={{ uri: item.logo }} 
              style={styles.logoImage} 
            />
          ) : (
            <View style={[
              styles.logoInitials, 
              { backgroundColor: theme?.primary || '#007BFF' }
            ]}>
              <RegularText style={styles.logoInitialsText}>
                {item.name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2)}
              </RegularText>
            </View>
          )}
        </View>

        {/* Restaurant Details */}
        <View style={styles.restaurantDetails}>
          <SemiBoldText style={{ color: theme?.text || '#000000' }}>
            {item.name}
          </SemiBoldText>
          <RegularText style={{ color: theme?.textMuted || '#666666' }}>
            {item.location.city}
          </RegularText>
          <RegularText style={{ color: theme?.textMuted || '#666666', fontSize: 12 }}>
            {item.contactNumber}
          </RegularText>
        </View>

        {/* Status Badge */}
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: item.isActive 
              ? (theme?.primary + '20' || 'rgba(40,167,69,0.1)') 
              : (theme?.danger + '20' || 'rgba(220,53,69,0.1)') 
          }
        ]}>
          <RegularText style={[
            styles.statusText, 
            { 
              color: item.isActive 
                ? (theme?.primary || '#28A745') 
                : (theme?.danger || '#DC3545') 
            }
          ]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </RegularText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Restaurant Management Modal
  const RestaurantModal = () => {
    const [localRestaurant, setLocalRestaurant] = useState({
      name: selectedRestaurant?.name || '',
      description: selectedRestaurant?.description || '',
      contactNumber: selectedRestaurant?.contactNumber || '',
      location: {
        address: selectedRestaurant?.location?.address || '',
        city: selectedRestaurant?.location?.city || '',
      },
      logo: selectedRestaurant?.logo || null,
      banner: selectedRestaurant?.banner || null,
      isActive: selectedRestaurant?.isActive || true
    });
    const [localError, setLocalError] = useState('');

    // Modify input fields to match theme in view-only mode
    const inputStyle = [
      styles.input,
      { 
        backgroundColor: theme?.input || '#F5F5F5',
        color: theme?.text || '#000000',
        borderColor: viewOnly ? 'transparent' : (theme?.border || '#E0E0E0'),
        opacity: viewOnly ? 0.9 : 1
      }
    ];

    // Pick Logo Image
    // const pickLogoImage = async () => {
    //   try {
    //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //     if (status !== 'granted') {
    //       Alert.alert('Permission required', 'We need camera roll permissions to upload images');
    //       return;
    //     }
    
    //     let result = await ImagePicker.launchImageLibraryAsync({
    //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //       allowsEditing: true,
    //       aspect: [1, 1],
    //       quality: 0.7,
    //       base64: true,
    //     });
    
    //     if (!result.canceled) {
    //       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
    //       setLocalRestaurant(prev => ({ ...prev, logo: base64Image }));
    //     }
    //   } catch (error) {
    //     console.error('Error picking image:', error);
    //     Alert.alert('Error', 'Failed to pick image');
    //   }
    // };

    // const pickBannerImage = async () => {
    //   try {
    //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //     if (status !== 'granted') {
    //       Alert.alert('Permission required', 'We need camera roll permissions to upload images');
    //       return;
    //     }
    
    //     let result = await ImagePicker.launchImageLibraryAsync({
    //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //       allowsEditing: true,
    //       aspect: [16, 9], // Better aspect ratio for banners
    //       quality: 0.7,
    //       base64: true,
    //     });
    
    //     if (!result.canceled) {
    //       const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
    //       setLocalRestaurant(prev => ({ ...prev, banner: base64Image }));
    //     }
    //   } catch (error) {
    //     console.error('Error picking banner image:', error);
    //     Alert.alert('Error', 'Failed to pick banner image');
    //   }
    // };

    //added prompt
    const pickLogoImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,              // ⬅️ stop base64
    });

    if (!result.canceled) {
      setLocalRestaurant(prev => ({ ...prev, logo: result.assets[0].uri })); // ⬅️ keep file:// URI
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image');
  }
};

const pickBannerImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: false,              // ⬅️ stop base64
    });

    if (!result.canceled) {
      setLocalRestaurant(prev => ({ ...prev, banner: result.assets[0].uri })); // ⬅️ keep file:// URI
    }
  } catch (error) {
    console.error('Error picking banner image:', error);
    Alert.alert('Error', 'Failed to pick banner image');
  }
};


    const validateForm = () => {
      setLocalError('');

      // Check required fields
      if (!localRestaurant.name.trim()) {
        setLocalError('Restaurant name is required');
        return false;
      }

      if (!localRestaurant.contactNumber.trim()) {
        setLocalError('Contact number is required');
        return false;
      }

      // // Validate phone number format
      // if (!isValidPhoneNumber(localRestaurant.contactNumber)) {
      //   setLocalError('Please enter a valid Philippine phone number (e.g., 09123456789)');
      //   return false;
      // }

      if (!localRestaurant.location.address.trim()) {
        setLocalError('Address is required');
        return false;
      }

      if (!localRestaurant.location.city.trim()) {
        setLocalError('City is required');
        return false;
      }

      return true;
    };
    
    // const formatPHPhoneNumber = (text) => {
    //   // Remove non-digit characters
    //   let digits = text.replace(/\D/g, '');
    
    //   // Remove leading 0
    //   if (digits.startsWith('0')) {
    //     digits = digits.slice(1);
    //   }
    
    //   // Remove leading 63 if exists
    //   if (digits.startsWith('63')) {
    //     digits = digits.slice(2);
    //   }
    
    //   // Limit to 10 digits (PH mobile numbers only)
    //   digits = digits.slice(0, 10);
    
    //   // Format: 912 345 6789
    //   const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    //   if (!match) return '+63 ' + digits;
    
    //   const [, part1, part2, part3] = match;
    //   return '+63 ' + [part1, part2, part3].filter(Boolean).join(' ');
    // };
    
    

    
    return (
      <RNModal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          fadeOut(() => setModalVisible(false));
        }}
      >
        <View style={styles.modalBackdrop} />
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[
              styles.modalContent, 
              { 
                backgroundColor: theme?.background || '#FFFFFF',
                minWidth: width * 0.85,
                maxWidth: width * 0.95
              }
            ]}>
              {/* Title */}
              <SemiBoldText style={[
                styles.modalTitle, 
                { color: theme?.text || '#000000' }
              ]}>
                {viewOnly ? 'Restaurant Details' : (selectedRestaurant ? 'Edit Coffee Shop' : 'Add New Coffee Shop')}
              </SemiBoldText>

              {/* Error Message */}
              {localError ? (
                <View style={[
                  styles.errorContainer,
                  { 
                    backgroundColor: theme?.danger + '10' || 'rgba(220,53,69,0.1)',
                    borderLeftColor: theme?.danger || '#DC3545'
                  }
                ]}>
                  <RegularText style={[
                    styles.errorText,
                    { color: theme?.danger || '#DC3545' }
                  ]}>
                    {localError}
                  </RegularText>
                </View>
              ) : null}

              {/* Banner and Logo Section - Make them non-touchable in view mode */}
              <View style={styles.bannerContainer}>
                {!viewOnly ? (
                  <TouchableOpacity 
                    style={styles.bannerTouchable}
                    onPress={pickBannerImage}
                    activeOpacity={0.7}
                  >
                    {localRestaurant.banner ? (
                      <Image 
                        source={{ uri: localRestaurant.banner }} 
                        style={styles.bannerImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.bannerPlaceholder,
                        { backgroundColor: theme?.primary + '20' || 'rgba(0,123,255,0.1)' }
                      ]}>
                        <Ionicons 
                          name="image-outline" 
                          size={32} 
                          color={theme?.primary || '#007BFF'} 
                        />
                        <RegularText style={[
                          styles.bannerHint, 
                          { color: theme?.primary || '#007BFF' }
                        ]}>
                          Add Banner Image
                        </RegularText>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.bannerTouchable}>
                    {localRestaurant.banner ? (
                      <Image 
                        source={{ uri: localRestaurant.banner }} 
                        style={styles.bannerImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.bannerPlaceholder,
                        { backgroundColor: theme?.primary + '20' || 'rgba(0,123,255,0.1)' }
                      ]}>
                        <Ionicons 
                          name="image-outline" 
                          size={32} 
                          color={theme?.primary || '#007BFF'} 
                        />
                        <RegularText style={[
                          styles.bannerHint, 
                          { color: theme?.primary || '#007BFF' }
                        ]}>
                          No Banner Image
                        </RegularText>
                      </View>
                    )}
                  </View>
                )}

                {!viewOnly ? (
                  <TouchableOpacity 
                    style={styles.overlappingLogoContainer}
                    onPress={pickLogoImage}
                    activeOpacity={0.7}
                  >
                    {localRestaurant.logo ? (
                      <Image 
                        source={{ uri: localRestaurant.logo }} 
                        style={styles.logoImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.logoInitialsContainer,
                        { backgroundColor: theme?.primary || '#007BFF' }
                      ]}>
                        <RegularText style={styles.logoInitialsText}>
                          {localRestaurant.name 
                            ? localRestaurant.name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2)
                            : 'PP'}
                        </RegularText>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.overlappingLogoContainer}>
                    {localRestaurant.logo ? (
                      <Image 
                        source={{ uri: localRestaurant.logo }} 
                        style={styles.logoImage} 
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.logoInitialsContainer,
                        { backgroundColor: theme?.primary || '#007BFF' }
                      ]}>
                        <RegularText style={styles.logoInitialsText}>
                          {localRestaurant.name 
                            ? localRestaurant.name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2)
                            : 'RS'}
                        </RegularText>
                      </View>
                    )}
                  </View>
                )}

                {!viewOnly && (
                  <View style={styles.logoHintContainer}>
                    <RegularText style={[styles.logoHint, { color: theme?.textMuted || '#888888' }]}>
                      Tap images to change
                    </RegularText>
                  </View>
                )}
              </View>

              {/* Input Fields */}
              <TextInput
                style={inputStyle}
                placeholder="Coffee Shop Name"
                value={localRestaurant.name}
                onChangeText={(text) => {
                  if (!viewOnly) {
                    setLocalRestaurant(prev => ({ ...prev, name: text }));
                    setLocalError('');
                  }
                }}
                editable={!viewOnly}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              <TextInput
                style={inputStyle}
                placeholder="Description (optional)"
                value={localRestaurant.description}
                onChangeText={(text) => {
                  if (!viewOnly) {
                    setLocalRestaurant(prev => ({ ...prev, description: text }));
                  }
                }}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={!viewOnly}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              {/* <TextInput
                style={inputStyle}
                placeholder="Contact Number (PH)"
                value={localRestaurant.contactNumber}
                onChangeText={(text) => {
                  if (!viewOnly) {
                    const formatted = formatPHPhoneNumber(text);
                    setLocalRestaurant(prev => ({ ...prev, contactNumber: formatted }));
                    setLocalError('');
                  }
                }}
                editable={!viewOnly}
                keyboardType="phone-pad"
                placeholderTextColor={theme?.textMuted || '#888888'}
              /> */}

              <TextInput
                style={inputStyle}
                placeholder="Address"
                value={localRestaurant.location.address}
                onChangeText={(text) => {
                  if (!viewOnly) {
                    setLocalRestaurant(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, address: text } 
                    }));
                    setLocalError('');
                  }
                }}
                editable={!viewOnly}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              {/* CITY */}
              <TextInput
                style={inputStyle}
                placeholder="City"
                value={localRestaurant.location.city}
                onChangeText={(text) => {
                  if (!viewOnly) {
                    setLocalRestaurant(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: text } 
                    }));
                    setLocalError('');
                  }
                }}
                editable={!viewOnly}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              {/* Action Buttons */}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.cancelButton,
                    { 
                      borderColor: viewOnly ? (theme?.primary || '#007BFF') : (theme?.border || '#E0E0E0')
                    }
                  ]}
                  onPress={() => {
                    fadeOut(() => setModalVisible(false));
                  }}
                >
                  <RegularText style={{ 
                    color: viewOnly ? (theme?.primary || '#007BFF') : (theme?.text || '#000000')
                  }}>
                    {viewOnly ? 'Close' : 'Cancel'}
                  </RegularText>
                </TouchableOpacity>
                {!viewOnly && (
                  <TouchableOpacity 
                    style={[
                      styles.modalButton, 
                      styles.saveButton,
                      { backgroundColor: theme?.primary || '#007BFF' }
                    ]}
                    onPress={() => {
                      if (validateForm()) {
                        handleSaveRestaurant(localRestaurant);
                      }
                    }}
                  >
                    <RegularText style={{ color: 'white' }}>
                      {selectedRestaurant ? 'Update' : 'Create'}
                    </RegularText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
        {loading && (
          <View style={[
            styles.loadingOverlay,
            { backgroundColor: theme?.modalOverlay || 'rgba(0,0,0,0.5)' }
          ]}
          pointerEvents={loading ? "auto" : "none"}>
            <View style={[
              styles.loadingContainer,
              { backgroundColor: theme?.card || '#FFFFFF' }
            ]}>
              <ActivityIndicator size="large" color={theme?.primary || '#007BFF'} />
              <RegularText style={{marginTop: 10, color: theme?.text || '#000000'}}>
                {selectedRestaurant ? 'Updating coffee shop...' : 'Creating coffee shop...'}
              </RegularText>
            </View>
          </View>
        )}
      </RNModal>
    );
  };

  const ActionModal = () => {
    return (
      <RNModal
        animationType="fade"
        transparent={true}
        visible={actionModalVisible}
        onRequestClose={() => {
          fadeOut(() => setActionModalVisible(false));
        }}
      >
        <TouchableWithoutFeedback 
          onPress={() => {
            fadeOut(() => setActionModalVisible(false));
          }}
        >
          <View style={styles.actionModalOverlay}>
            <View style={[
              styles.actionModalContent, 
              { 
                backgroundColor: theme?.card || '#FFFFFF',
                position: 'absolute',
                bottom: 0, 
                left: 0,   
                right: 0,  
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
                borderBottomLeftRadius: 0, 
                borderBottomRightRadius: 0 
              }
            ]}>
              {/* View Restaurant Button */}
              <TouchableOpacity 
                style={styles.actionModalButton}
                onPress={() => {
                  setActionModalVisible(false);
                  openRestaurantModal(selectedRestaurant, true); // true for view-only mode
                }}
              >
                <Ionicons 
                  name="eye-outline" 
                  size={24} 
                  color={theme?.text || '#000000'} 
                />
                <RegularText style={{ marginLeft: 10, color: theme?.text || '#000000' }}>
                  View Coffee Shop
                </RegularText>
              </TouchableOpacity>

              {/* Edit Restaurant Button - Temporarily Disabled 
              <TouchableOpacity 
                style={styles.actionModalButton}
                onPress={() => {
                  setActionModalVisible(false);
                  openRestaurantModal(selectedRestaurant);
                }}
              >
                <Ionicons 
                  name="create-outline" 
                  size={24} 
                  color={theme?.text || '#000000'} 
                />
                <RegularText style={{ marginLeft: 10, color: theme?.text || '#000000' }}>
                  Edit Restaurant
                </RegularText>
              </TouchableOpacity>
              */}
              
              <TouchableOpacity 
                style={styles.actionModalButton}
                onPress={() => {
                  setActionModalVisible(false);
                  handleViewStaff(selectedRestaurant._id);
                }}
              >
                <Ionicons 
                  name="people-outline" 
                  size={24} 
                  color={theme?.primary || '#007BFF'} 
                />
                <RegularText style={{ marginLeft: 10, color: theme?.primary || '#007BFF' }}>
                  Manage Staff
                </RegularText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionModalButton}
                onPress={() => {
                  setActionModalVisible(false);
                  handleDeleteRestaurant(selectedRestaurant._id);
                }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={24} 
                  color="red" 
                />
                <RegularText style={{ marginLeft: 10, color: 'red' }}>
                  Delete Coffee Shop
                </RegularText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    );
  };
 
const StaffModal = () => {
  return (
    <RNModal
      animationType="fade"
      transparent
      visible={staffModalVisible}
      onRequestClose={() => setStaffModalVisible(false)}
    >
      {/* Dim backdrop to close on tap */}
      <TouchableWithoutFeedback onPress={() => setStaffModalVisible(false)}>
        <View style={styles.modalBackdrop} />
      </TouchableWithoutFeedback>

      {/* Foreground */}
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <View style={[styles.staffModalContent, { backgroundColor: theme?.background || '#FFFFFF' }]}>
          {/* Header */}
          <View style={styles.staffModalHeader}>
            <SemiBoldText style={{ color: theme?.text || '#000000' }}>
              Add Staff – {selectedRestaurant?.name || 'Coffee Shop'}
            </SemiBoldText>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              
              <TouchableOpacity
                onPress={() => {
                  setSelectedUser(null);      // create mode
                  setUserModalVisible(true);  // open modal
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="person-add-outline" size={22} color={theme?.primary || '#007BFF'} />
              </TouchableOpacity>


              <TouchableOpacity onPress={() => setStaffModalVisible(false)}>
                <Ionicons name="close-outline" size={26} color={theme?.text || '#000000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Staff */}
          <View style={styles.sectionContainer}>
            <SemiBoldText style={{ color: theme?.text || '#000000', marginBottom: 10 }}>
              Current Staff
            </SemiBoldText>

            {staffLoading ? (
              <ActivityIndicator size="small" color={theme?.primary || '#007BFF'} />
            ) : staffList?.length ? (
              <FlatList
                data={staffList}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator
                style={{ maxHeight: 220 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.staffItem,
                      {
                        backgroundColor: theme?.card || '#FFFFFF',
                        borderColor: theme?.border || '#E0E0E0',
                      },
                    ]}
                  >
                    <View style={styles.staffInfo}>
                      <View style={styles.avatarContainer}>
                        {item.profilePicture ? (
                          <Image source={{ uri: item.profilePicture }} style={styles.staffAvatar} />
                        ) : (
                          <View
                            style={[
                              styles.staffInitials,
                              { backgroundColor: theme?.primary || '#007BFF' },
                            ]}
                          >
                            <RegularText style={styles.initialsText}>
                              {(item.firstName?.[0] || '').toUpperCase()}
                              {(item.lastName?.[0] || '').toUpperCase()}
                            </RegularText>
                          </View>
                        )}
                      </View>
                      <View style={styles.staffDetails}>
                        <SemiBoldText style={{ color: theme?.text || '#000000' }}>
                          {item.firstName} {item.lastName}
                        </SemiBoldText>
                        <RegularText style={{ color: theme?.textMuted || '#666666', fontSize: 12 }}>
                          {item.email}
                        </RegularText>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.removeButton,
                        { backgroundColor: (theme?.danger || '#DC3545') + '20' },
                      ]}
                      onPress={() => {
                        Alert.alert(
                          'Remove Staff',
                          `Remove ${item.firstName} ${item.lastName} from this coffee shop?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removeStaffFromRestaurant(item._id, selectedRestaurant._id),
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={16}
                        color={theme?.danger || '#DC3545'}
                      />
                      <RegularText
                        style={{
                          marginLeft: 6,
                          color: theme?.danger || '#DC3545',
                          fontSize: 12,
                        }}
                      >
                        Remove
                      </RegularText>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <RegularText style={{ color: theme?.textMuted || '#666666', fontStyle: 'italic' }}>
                No staff assigned to this coffee shop.
              </RegularText>
            )}
          </View>

          {/* Available Staff */}
          <View style={styles.sectionContainer}>
            <SemiBoldText style={{ color: theme?.text || '#000000', marginBottom: 10 }}>
              Available Staff
            </SemiBoldText>

            {staffLoading ? (
              <ActivityIndicator size="small" color={theme?.primary || '#007BFF'} />
            ) : availableStaff?.length ? (
              <FlatList
                data={availableStaff}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator
                style={{ maxHeight: 220 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.staffItem,
                      {
                        backgroundColor: theme?.card || '#FFFFFF',
                        borderColor: theme?.border || '#E0E0E0',
                      },
                    ]}
                  >
                    <View style={styles.staffInfo}>
                      <View style={styles.avatarContainer}>
                        {item.profilePicture ? (
                          <Image source={{ uri: item.profilePicture }} style={styles.staffAvatar} />
                        ) : (
                          <View
                            style={[
                              styles.staffInitials,
                              { backgroundColor: theme?.primary || '#007BFF' },
                            ]}
                          >
                            <RegularText style={styles.initialsText}>
                              {(item.firstName?.[0] || '').toUpperCase()}
                              {(item.lastName?.[0] || '').toUpperCase()}
                            </RegularText>
                          </View>
                        )}
                      </View>
                      <View style={styles.staffDetails}>
                        <SemiBoldText style={{ color: theme?.text || '#000000' }}>
                          {item.firstName} {item.lastName}
                        </SemiBoldText>
                        <RegularText style={{ color: theme?.textMuted || '#666666', fontSize: 12 }}>
                          {item.email}
                        </RegularText>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.assignButton,
                        { backgroundColor: (theme?.success || '#28A745') + '20' },
                      ]}
                      onPress={() => assignStaffToRestaurant(item._id, selectedRestaurant._id)}
                    >
                      <Ionicons
                        name="person-add-outline"
                        size={16}
                        color={theme?.success || '#28A745'}
                      />
                      <RegularText
                        style={{
                          marginLeft: 6,
                          color: theme?.success || '#28A745',
                          fontSize: 12,
                        }}
                      >
                        Assign
                      </RegularText>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <RegularText style={{ color: theme?.textMuted || '#666666', fontStyle: 'italic' }}>
                No available staff to assign.
              </RegularText>
            )}
          </View>
        </View>

        {/* Loading overlay while fetching/assigning/removing */}
        {staffLoading && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: theme?.modalOverlay || 'rgba(0,0,0,0.5)' },
            ]}
            pointerEvents="auto"
          >
            <View style={[styles.loadingContainer, { backgroundColor: theme?.card || '#FFFFFF' }]}>
              <ActivityIndicator size="large" color={theme?.primary || '#007BFF'} />
              <RegularText style={{ marginTop: 10, color: theme?.text || '#000000' }}>
                Loading staff…
              </RegularText>
            </View>
          </View>
        )}
      </Animated.View>
    </RNModal>
  );
};

const UserModal = () => {
  const [localUser, setLocalUser] = useState({
    firstName: selectedUser?.firstName || '',
    lastName:  selectedUser?.lastName  || '',
    email:     selectedUser?.email     || '',
    password:  selectedUser ? '' : '',
    userType:  'staff', // locked to staff here
    profileImage: selectedUser?.profilePicture || null,
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
  if (modalVisible || actionModalVisible || staffModalVisible || userModalVisible) {
    fadeIn();
  }
}, [modalVisible, actionModalVisible, staffModalVisible, userModalVisible]);


  useEffect(() => {
    setLocalUser({
      firstName: selectedUser?.firstName || '',
      lastName:  selectedUser?.lastName  || '',
      email:     selectedUser?.email     || '',
      password:  selectedUser ? '' : '',
      userType:  'staff',
      profileImage: selectedUser?.profilePicture || null,
    });
    setLocalError('');
    setShowPassword(false);
  }, [selectedUser, userModalVisible]);

  const pickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalUser(prev => ({ ...prev, profileImage: base64Image }));
      }
    } catch (err) {
      console.error('pickProfileImage error:', err);
      Alert.alert('Error', 'Failed to pick profile image');
    }
  };

  const validateForm = () => {
    if (!localUser.firstName.trim()) {
      setLocalError('First name is required');
      return false;
    }
    if (!localUser.lastName.trim()) {
      setLocalError('Last name is required');
      return false;
    }
    if (!localUser.email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!isValidEmail(localUser.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (!selectedUser) {
      if (!localUser.password || localUser.password.trim() === '') {
        setLocalError('Password is required for new staff');
        return false;
      }
      if (localUser.password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return false;
      }
    }
    return true;
  };

  return (
    <RNModal
      animationType="fade"
      transparent
      visible={userModalVisible}
      onRequestClose={() => fadeOut(() => setUserModalVisible(false))}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <View style={[styles.modalContent, { backgroundColor: theme?.background || '#FFFFFF' }]}>
          {/* Title */}
          <SemiBoldText style={[styles.modalTitle, { color: theme?.text || '#000000' }]}>
            {selectedUser ? 'Edit Staff' : 'Create New Staff'}
          </SemiBoldText>

          {/* Profile Image Picker */}
          <TouchableOpacity style={styles.profileImagePickerContainer} onPress={pickProfileImage}>
            {localUser.profileImage ? (
              <Image source={{ uri: localUser.profileImage }} style={styles.profileImagePicker} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme?.primary || '#007BFF' }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
            )}
          </TouchableOpacity>

          {/* Error */}
          {localError ? (
            <View style={styles.errorContainer}>
              <RegularText style={styles.errorText}>{localError}</RegularText>
            </View>
          ) : null}

          {/* Inputs */}
          <TextInput
            style={[styles.input, { backgroundColor: theme?.input || '#F5F5F5', color: theme?.text || '#000', borderColor: theme?.border || '#E0E0E0' }]}
            placeholder="First Name"
            value={localUser.firstName}
            onChangeText={(text) => { setLocalUser(p => ({ ...p, firstName: text })); setLocalError(''); }}
            placeholderTextColor={theme?.textMuted || '#888'}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme?.input || '#F5F5F5', color: theme?.text || '#000', borderColor: theme?.border || '#E0E0E0' }]}
            placeholder="Last Name"
            value={localUser.lastName}
            onChangeText={(text) => { setLocalUser(p => ({ ...p, lastName: text })); setLocalError(''); }}
            placeholderTextColor={theme?.textMuted || '#888'}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme?.input || '#F5F5F5', color: theme?.text || '#000', borderColor: theme?.border || '#E0E0E0' }]}
            placeholder="Email"
            value={localUser.email}
            onChangeText={(text) => { setLocalUser(p => ({ ...p, email: text })); setLocalError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme?.textMuted || '#888'}
          />

          {/* Password only when creating */}
          {!selectedUser && (
            <>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: theme?.input || '#F5F5F5', color: theme?.text || '#000', borderColor: theme?.border || '#E0E0E0', fontSize: 12 }]}
                  placeholder="Password"
                  value={localUser.password}
                  onChangeText={(text) => { setLocalUser(p => ({ ...p, password: text })); setLocalError(''); }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={theme?.textMuted || '#888'}
                />
                <TouchableOpacity style={styles.passwordVisibilityButton} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={theme?.textMuted || '#888'} />
                </TouchableOpacity>
              </View>
              <RegularText style={[styles.passwordHint, { color: theme?.textMuted || '#888' }]}>
                Password must be at least 6 characters
              </RegularText>
            </>
          )}

          {/* Actions */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: theme?.border || '#E0E0E0' }]}
              onPress={() => fadeOut(() => setUserModalVisible(false))}
            >
              <RegularText style={{ color: theme?.text || '#000' }}>Cancel</RegularText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: theme?.primary || '#007BFF' }]}
              onPress={() => {
                if (validateForm()) handleSaveUser(localUser);
              }}
            >
              <RegularText style={{ color: '#fff' }}>
                {selectedUser ? 'Update' : 'Create'}
              </RegularText>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </RNModal>
  );
};


  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: theme?.background || '#FFFFFF' }
    ]}>
      <StatusBar 
        backgroundColor={theme?.background || '#FFFFFF'} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header */}
      <View style={[
        styles.header, 
        { backgroundColor: theme?.background || '#FFFFFF' }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={theme?.text || '#000000'} 
          />
        </TouchableOpacity>
        
        <SemiBoldText style={[
          styles.headerTitle, 
          { color: theme?.text || '#000000' }
        ]}>
          Coffee Shop Management
        </SemiBoldText>
        
        <TouchableOpacity 
          onPress={() => openRestaurantModal()}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={theme?.primary || '#007BFF'} 
          />
        </TouchableOpacity>
      </View>
      {/* Searc hComponent */}

      <View style={styles.section}>
        <SearchComponent 
          onSearch={handleSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          placeholder="Search by name, city, address or contact..."
        />
      </View>

      <FlatList
        data={filteredRestaurants}  // Changed from restaurants to filteredRestaurants
        renderItem={renderRestaurantItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRestaurants}
            colors={[theme?.primary || '#007BFF']}
            tintColor={theme?.primary || '#007BFF'}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <RegularText style={{ color: theme?.text || '#000000' }}>
              {restaurants.length === 0 
                ? "No coffee shop found" 
                : "No coffee shop match your search."}
            </RegularText>
          </View>
        )}
      />

      <RestaurantModal />
      <ActionModal />
      <StaffModal /> 
      <UserModal />
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  restaurantCard: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
  },
  restaurantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  logoInitials: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  restaurantDetails: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 16,
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  logoPickerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPicker: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoInitialsLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitialsTextLarge: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoHint: {
    marginTop: 8,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
  },
  activeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  radioOuterCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalOverlayTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalContent: {
    borderRadius: 10,
    padding: 8,
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  actionModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  staffModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  staffModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  staffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staffImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  staffInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInitialsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffDetails: {
    flex: 1,
  },
  deleteStaffButton: {
    padding: 8,
  },
  noStaffContainer: {
    padding: 20,
    alignItems: 'center',
  },
  addStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStaffButtonSmall: {
    padding: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'auto', // This allows the overlay to capture touch events
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
    sectionContainer: {
      marginVertical: 10,
    },
    staffItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      marginVertical: 5,
      borderRadius: 8,
      borderWidth: 1,

    },
    staffInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarContainer: {
      marginRight: 10,
    },
    staffAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    staffInitials: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      color: 'white',
      fontSize: 16,
    },
    staffDetails: {
      flex: 1,
    },
    assignButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderRadius: 5,
    },
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderRadius: 5,
    },
    modalTouchableOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    staffModalContent: {
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      borderRadius: 10,
      padding: 20,
    },
    staffModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    closeButton: {
      padding: 5,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    bannerPickerContainer: {
      marginBottom: 16,
      borderRadius: 8,
      overflow: 'hidden',
    },
    bannerPicker: {
      width: '100%',
      height: 150,
    },
    bannerPlaceholder: {
      width: '100%',
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    bannerHint: {
      marginTop: 8,
      fontSize: 14,
    },
    restaurantBanner: {
      width: '100%',
      height: 100,
      marginBottom: 12,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    bannerContainer: {
      position: 'relative',
      marginBottom: 40, // Allow space for the overlapping logo
      borderRadius: 10,
      overflow: 'visible', // Important for the logo to overlap
    },
    bannerTouchable: {
      width: '100%',
      borderRadius: 10,
    },
    bannerImage: {
      width: '100%',
      height: 140,
      borderRadius: 10,
    },
    bannerPlaceholder: {
      width: '100%',
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: 'rgba(0,123,255,0.3)',
    },
    bannerHint: {
      marginTop: 8,
      fontSize: 14,
    },
    overlappingLogoContainer: {
      position: 'absolute',
      bottom: -40, // Half of the logo height to create overlap
      alignSelf: 'center',
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: '#FFFFFF', // White border around the logo
      elevation: 5, // Android shadow
      shadowColor: '#000000', // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      backgroundColor: '#FFFFFF', // Fallback background
      overflow: 'hidden', // Clips the image to the circular shape
    },
    logoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 40,
    },
    logoInitialsContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoInitialsText: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold',
    },
    logoHintContainer: {
      position: 'absolute',
      bottom: -60, // Position below the logo
      width: '100%',
      alignItems: 'center',
    },
    logoHint: {
      fontSize: 12,
    },
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  profileImagePickerContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  passwordVisibilityButton: {
    position: 'absolute',
    right: 15,
  },
  passwordHint: {
    fontSize: 12,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  userTypeRadioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userTypeRadioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuterCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#007BFF',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionModalOverlayTouch: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  actionModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  section: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },

});

export default AdminRestaurantsScreen;



