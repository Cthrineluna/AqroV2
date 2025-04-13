import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  FlatList,
  Image,
  Modal as RNModal,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { RegularText, SemiBoldText } from '../../components/StyledComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import { StatusBar } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const AdminContainerTypeScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { userToken } = useAuth();
  const [containerTypes, setContainerTypes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContainerType, setSelectedContainerType] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Animation functions
  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fadeOut = useCallback((callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  }, [fadeAnim]);

  // Fetch container types
  const fetchContainerTypes = async () => {
    try {
      setRefreshing(true);
      const storedToken = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(`${getApiUrl()}/container-types`, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      setContainerTypes(response.data);
    } catch (error) {
      console.error('Error fetching container types:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch container types');
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch restaurants
  const fetchRestaurants = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(`${getApiUrl()}/restaurants`, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch restaurants');
    }
  };

  // Fetch restaurant rebate for a container type
  const fetchRebateValues = async (containerTypeId) => {
    try {
      const storedToken = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(`${getApiUrl()}/rebates/${containerTypeId}`, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rebate values:', error.response?.data || error.message);
      return [];
    }
  };

  useEffect(() => {
    fetchContainerTypes();
    fetchRestaurants();
  }, []);

  // Open container type modal for creating/editing
  const openContainerTypeModal = async (containerType = null) => {
    if (containerType) {
      const rebates = await fetchRebateValues(containerType._id);
      setSelectedContainerType({
        ...containerType,
        rebates: rebates
      });
    } else {
      setSelectedContainerType(null);
    }
    setModalVisible(true);
    fadeIn();
  };

  // Pick container type image
  const pickContainerTypeImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  };

  // Create/Update Container Type
  const handleSaveContainerType = async (containerTypeData) => {
    try {
      const storedToken = await AsyncStorage.getItem('aqro_token');
      
      // Prepare form data
      const formData = new FormData();
      formData.append('name', containerTypeData.name);
      formData.append('description', containerTypeData.description || ''); 
      formData.append('price', containerTypeData.price);
      formData.append('maxUses', containerTypeData.maxUses);
      
      // Add image if it's a file URI
      if (containerTypeData.image && containerTypeData.image.startsWith('file:')) {
        const filename = containerTypeData.image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('image', {
          uri: containerTypeData.image,
          name: filename,
          type,
        });
      }
  
      if (selectedContainerType && selectedContainerType._id) {
        // First get current rebates to compare
        const currentRebates = await fetchRebateValues(selectedContainerType._id);
        
        await axios.put(
          `${getApiUrl()}/container-types/${selectedContainerType._id}`, 
          formData, 
          { 
            headers: { 
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );

        // Update rebate values
       // Handle rebate updates and deletions
      if (containerTypeData.rebates) {
        // Find rebates that need to be deleted (present in current but not in new data)
        const rebatesToDelete = currentRebates.filter(currentRebate => 
          !containerTypeData.rebates.some(newRebate => 
            newRebate.restaurantId === currentRebate.restaurantId
          )
        );
        
        // Delete removed rebates
        for (const rebate of rebatesToDelete) {
          await axios.delete(
            `${getApiUrl()}/rebates/${rebate._id}`,
            { 
              headers: { 
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              } 
            }
          );
        }
        
        // Update or create remaining rebates
        for (const rebate of containerTypeData.rebates) {
          await axios.post(
            `${getApiUrl()}/rebates`, 
            {
              restaurantId: rebate.restaurantId,
              containerTypeId: selectedContainerType._id,
              rebateValue: rebate.rebateValue
            },
            { 
              headers: { 
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              } 
            }
          );
        }
      }
      } else {
        // Create new container type
        const response = await axios.post(
          `${getApiUrl()}/container-types`, 
          formData, 
          { 
            headers: { 
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        
        const newContainerTypeId = response.data._id;
        
        // Create rebate values for the new container type
        if (containerTypeData.rebates && containerTypeData.rebates.length > 0) {
          for (const rebate of containerTypeData.rebates) {
            await axios.post(
              `${getApiUrl()}/rebates`, 
              {
                restaurantId: rebate.restaurantId,
                containerTypeId: newContainerTypeId,
                rebateValue: rebate.rebateValue
              },
              { 
                headers: { 
                  Authorization: `Bearer ${storedToken}`,
                  'Content-Type': 'application/json'
                } 
              }
            );
          }
        }
      }
      
      // Reset form and close modal
      fetchContainerTypes();
      setModalVisible(false);
      setSelectedContainerType(null);
    } catch (error) {
      console.error('Error saving container type:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save container type');
    }
  };

  // Delete Container Type
  const handleDeleteContainerType = async (containerTypeId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this container type?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('aqro_token');
              await axios.delete(
                `${getApiUrl()}/container-types/${containerTypeId}`, 
                { 
                  headers: { 
                    Authorization: `Bearer ${storedToken}` 
                  } 
                }
              );
              fetchContainerTypes();
              setActionModalVisible(false);
            } catch (error) {
              console.error('Error deleting container type:', error);
              Alert.alert('Error', 'Failed to delete container type');
            }
          }
        }
      ]
    );
  };

  // Validate container type data
  const isValidContainerType = (data) => {
    if (!data.name.trim()) return false;
    if (!data.description.trim()) return false;
    if (isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) return false;
    if (isNaN(parseInt(data.maxUses)) || parseInt(data.maxUses) <= 0) return false;
    return true;
  };

  // Function to validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Render each container type item
  const renderContainerTypeItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.containerTypeCard, 
        { 
          backgroundColor: theme?.card || '#FFFFFF', 
          borderColor: theme?.border || '#E0E0E0' 
        }
      ]}
      onPress={() => {
        setSelectedContainerType(item);
        setActionModalVisible(true);
        fadeIn();
      }}
    >
      <View style={styles.containerTypeCardContent}>
        {/* Container Type Image */}
        <View style={styles.containerTypeImageContainer}>
          {item.image && item.image !== 'default-container.png' ? (
            <Image 
              source={{ uri: `${getApiUrl()}/uploads/${item.image}` }} 
              style={styles.containerTypeImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={[
              styles.containerTypeInitials, 
              { backgroundColor: theme?.primary || '#007BFF' }
            ]}>
              <Ionicons name="cube-outline" size={24} color="white" />
            </View>
          )}
        </View>

        {/* Container Type Details */}
        <View style={styles.containerTypeDetails}>
          <SemiBoldText style={{ color: theme?.text || '#000000' }}>
            {item.name}
          </SemiBoldText>
          <RegularText 
            style={{ color: theme?.textMuted || '#666666' }}
            numberOfLines={1}
          >
            {item.description}
          </RegularText>
        </View>

        {/* Container Type Uses */}
        <View style={[
          styles.maxUsesContainer, 
          { backgroundColor: theme?.primary + '20' || 'rgba(0,123,255,0.1)' }
        ]}>
          <RegularText style={[
            styles.maxUsesText, 
            { color: theme?.primary || '#007BFF' }
          ]}>
            {item.maxUses} uses
          </RegularText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Action Modal for container type options
  const ActionModal = () => (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={actionModalVisible}
      onRequestClose={() => {
        fadeOut(() => setActionModalVisible(false));
      }}
    >
      <Animated.View 
        style={[
          styles.actionModalOverlay,
          { opacity: fadeAnim }
        ]} 
      >
        <TouchableOpacity 
          style={styles.actionModalOverlayTouch} 
          activeOpacity={1} 
          onPressOut={() => {
            fadeOut(() => setActionModalVisible(false));
          }}
        >
          <View style={[
            styles.actionModalContent, 
            { backgroundColor: theme?.card || '#FFFFFF' }
          ]}>
            <TouchableOpacity 
              style={styles.actionModalButton}
              onPress={() => {
                setActionModalVisible(false);
                openContainerTypeModal(selectedContainerType);
              }}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color={theme?.text || '#000000'} 
              />
              <RegularText style={{ marginLeft: 10, color: theme?.text || '#000000' }}>
                Edit Container Type
              </RegularText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionModalButton}
              onPress={() => {
                setActionModalVisible(false);
                handleDeleteContainerType(selectedContainerType._id);
              }}
            >
              <Ionicons 
                name="trash-outline" 
                size={24} 
                color="red" 
              />
              <RegularText style={{ marginLeft: 10, color: 'red' }}>
                Delete Container Type
              </RegularText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </RNModal>
  );

  // Container Type Management Modal
  const ContainerTypeModal = () => {
    const [localContainerType, setLocalContainerType] = useState({
      name: selectedContainerType?.name || '',
      description: selectedContainerType?.description || '',
      price: selectedContainerType?.price?.toString() || '',
      maxUses: selectedContainerType?.maxUses?.toString() || '10',
      image: selectedContainerType?.image || null,
      rebates: selectedContainerType?.rebates || []
    });
    const [localError, setLocalError] = useState('');
    const [isRebateSectionOpen, setIsRebateSectionOpen] = useState(false);
    const [showAddRebateModal, setShowAddRebateModal] = useState(false);
    const [newRebateRestaurant, setNewRebateRestaurant] = useState('');
    const [newRebateValue, setNewRebateValue] = useState('0');
  
    useEffect(() => {
      if (restaurants.length > 0 && (!localContainerType.rebates || localContainerType.rebates.length === 0)) {
        setLocalContainerType(prev => ({
          ...prev,
          rebates: []
        }));
      }
    }, [restaurants]);
  
    const handleImagePick = async () => {
      const imageUri = await pickContainerTypeImage();
      if (imageUri) {
        setLocalContainerType(prev => ({
          ...prev,
          image: imageUri
        }));
      }
    };
    
    const handleAddRebate = () => {
      if (!newRebateRestaurant) {
        setLocalError('Please select a restaurant');
        return;
      }
  
      if (isNaN(parseFloat(newRebateValue)) || parseFloat(newRebateValue) < 0) {
        setLocalError('Rebate value must be a positive number');
        return;
      }
  
      // Check if rebate already exists for this restaurant
      const existingIndex = localContainerType.rebates.findIndex(
        r => r.restaurantId === newRebateRestaurant
      );
  
      if (existingIndex >= 0) {
        setLocalError('Rebate already exists for this restaurant');
        return;
      }
  
      const restaurant = restaurants.find(r => r._id === newRebateRestaurant);
      
      setLocalContainerType(prev => ({
        ...prev,
        rebates: [
          ...prev.rebates,
          {
            restaurantId: newRebateRestaurant,
            restaurantName: restaurant.name,
            rebateValue: newRebateValue
          }
        ]
      }));
  
      setNewRebateRestaurant('');
      setNewRebateValue('0');
      setShowAddRebateModal(false);
      setLocalError('');
    };
  
    // Delete rebate
    const handleDeleteRebate = (restaurantId) => {
      setLocalContainerType(prev => ({
        ...prev,
        rebates: prev.rebates.filter(r => r.restaurantId !== restaurantId)
      }));
    };
  
    const validateForm = () => {
      if (!localContainerType.name.trim()) {
        setLocalError('Name is required');
        return false;
      }
      // if (isNaN(parseFloat(localContainerType.price)) || parseFloat(localContainerType.price) <= 0) {
      //   setLocalError('Price must be a positive number');
      //   return false;
      // }
      if (isNaN(parseInt(localContainerType.maxUses)) || parseInt(localContainerType.maxUses) <= 0) {
        setLocalError('Max uses must be a positive number');
        return false;
      }
      
      // Validate rebate values
      for (const rebate of localContainerType.rebates) {
        if (isNaN(parseFloat(rebate.rebateValue)) || parseFloat(rebate.rebateValue) < 0) {
          setLocalError(`Invalid rebate value for ${rebate.restaurantName}`);
          return false;
        }
      }
      
      return true;
    };
  
    // Update a specific rebate value
    const updateRebateValue = (restaurantId, value) => {
      setLocalContainerType(prev => ({
        ...prev,
        rebates: prev.rebates.map(rebate => 
          rebate.restaurantId === restaurantId 
            ? { ...rebate, rebateValue: value }
            : rebate
        )
      }));
    };
  
    return (
      <RNModal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          fadeOut(() => setModalVisible(false));
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: fadeAnim }
            ]}
          >
            <View style={[
              styles.modalContainer,
              { 
                backgroundColor: theme?.background || '#FFFFFF',
                maxHeight: Dimensions.get('window').height * 0.85 // Slightly increased max height
              }
            ]}>
              {/* Modal Title */}
              <SemiBoldText style={[
                styles.modalTitle, 
                { color: theme?.text || '#000000' }
              ]}>
                {selectedContainerType ? 'Edit Container Type' : 'Create New Container Type'}
              </SemiBoldText>
              
              {/* Scrollable Content */}
              <ScrollView 
                style={styles.modalScrollView}
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Container Type Image Picker */}
                <TouchableOpacity 
                  style={styles.containerTypeImagePickerContainer}
                  onPress={handleImagePick}
                >
                  {localContainerType.image && localContainerType.image !== 'default-container.png' ? (
                    <Image 
                      source={{ 
                        uri: localContainerType.image.startsWith('file:') 
                          ? localContainerType.image 
                          : `${getApiUrl()}/uploads/${localContainerType.image}` 
                      }} 
                      style={styles.containerTypeImagePicker} 
                    />
                  ) : (
                    <View style={[
                      styles.containerTypeImagePlaceholder,
                      { backgroundColor: theme?.primary || '#007BFF' }
                    ]}>
                      <Ionicons 
                        name="camera" 
                        size={24} 
                        color="white" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
  
                {/* Error Message */}
                {localError ? (
                  <View style={styles.errorContainer}>
                    <RegularText style={styles.errorText}>
                      {localError}
                    </RegularText>
                  </View>
                ) : null}
  
                {/* Input Fields */}
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: theme?.input || '#F5F5F5', 
                      color: theme?.text || '#000000',
                      borderColor: theme?.border || '#E0E0E0'
                    }
                  ]}
                  placeholder="Name"
                  value={localContainerType.name}
                  onChangeText={(text) => {
                    setLocalContainerType(prev => ({ ...prev, name: text }));
                    setLocalError('');
                  }}
                  placeholderTextColor={theme?.textMuted || '#888888'}
                />
  
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: theme?.input || '#F5F5F5', 
                      color: theme?.text || '#000000',
                      borderColor: theme?.border || '#E0E0E0',
                      height: 100,
                      textAlignVertical: 'top'
                    }
                  ]}
                  placeholder="Description (optional)"
                  value={localContainerType.description}
                  onChangeText={(text) => {
                    setLocalContainerType(prev => ({ ...prev, description: text }));
                    setLocalError('');
                  }}
                  multiline={true}
                  numberOfLines={4}
                  placeholderTextColor={theme?.textMuted || '#888888'}
                />
  
                <View style={styles.rowInputContainer}>
                  {/* <TextInput
                    style={[
                      styles.input, 
                      styles.halfInput,
                      { 
                        backgroundColor: theme?.input || '#F5F5F5', 
                        color: theme?.text || '#000000',
                        borderColor: theme?.border || '#E0E0E0'
                      }
                    ]}
                    placeholder="Price"
                    value={localContainerType.price}
                    onChangeText={(text) => {
                      setLocalContainerType(prev => ({ ...prev, price: text }));
                      setLocalError('');
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={theme?.textMuted || '#888888'}
                  /> */}
  
                  <TextInput
                    style={[
                      styles.input, 
                      styles.halfInput,
                      { 
                        backgroundColor: theme?.input || '#F5F5F5', 
                        color: theme?.text || '#000000',
                        borderColor: theme?.border || '#E0E0E0'
                      }
                    ]}
                    placeholder="Max Uses"
                    value={localContainerType.maxUses}
                    onChangeText={(text) => {
                      setLocalContainerType(prev => ({ ...prev, maxUses: text }));
                      setLocalError('');
                    }}
                    keyboardType="numeric"
                    placeholderTextColor={theme?.textMuted || '#888888'}
                  />
                </View>
  
                {/* Rebate Values Section - Collapsible */}
                <TouchableOpacity 
                  style={styles.rebateSectionHeader}
                  onPress={() => setIsRebateSectionOpen(!isRebateSectionOpen)}
                >
                  <SemiBoldText style={{ color: theme?.text || '#000000' }}>
                    Restaurant Rebate Values
                  </SemiBoldText>
                  <Ionicons 
                    name={isRebateSectionOpen ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={theme?.text || '#000000'} 
                  />
                </TouchableOpacity>
  
                {isRebateSectionOpen && (
                  <View style={styles.rebateSection}>
                    {localContainerType.rebates.length > 0 ? (
                      localContainerType.rebates.map((rebate) => (
                        <View key={rebate.restaurantId} style={styles.rebateItemContainer}>
                          <RegularText style={{ 
                            flex: 1, 
                            color: theme?.text || '#000000',
                            marginRight: 10
                          }}>
                            {rebate.restaurantName}
                          </RegularText>
                          <TextInput
                            style={[
                              styles.rebateInput, 
                              { 
                                backgroundColor: theme?.input || '#F5F5F5', 
                                color: theme?.text || '#000000',
                                borderColor: theme?.border || '#E0E0E0'
                              }
                            ]}
                            placeholder="0.00"
                            value={rebate.rebateValue}
                            onChangeText={(text) => {
                              updateRebateValue(rebate.restaurantId, text);
                              setLocalError('');
                            }}
                            keyboardType="numeric"
                            placeholderTextColor={theme?.textMuted || '#888888'}
                          />
                          <TouchableOpacity 
                            style={styles.deleteRebateButton}
                            onPress={() => handleDeleteRebate(rebate.restaurantId)}
                          >
                            <Ionicons name="trash-outline" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <RegularText style={{ color: theme?.textMuted || '#888888' }}>
                        No rebates configured
                      </RegularText>
                    )}
  
                    <TouchableOpacity
                      style={[
                        styles.addRebateButton,
                        { backgroundColor: theme?.primary || '#007BFF' }
                      ]}
                      onPress={() => setShowAddRebateModal(true)}
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <RegularText style={{ color: 'white', marginLeft: 5 }}>
                        Add Restaurant Rebate
                      </RegularText>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
              
              {/* Action Buttons - Fixed at bottom of modal */}
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.cancelButton,
                    { borderColor: theme?.border || '#E0E0E0', backgroundColor: theme.background }
                  ]}
                  onPress={() => {
                    fadeOut(() => setModalVisible(false));
                  }}
                >
                  <RegularText style={{ color: theme?.text || '#000000' }}>
                    Cancel
                  </RegularText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.saveButton,
                    { backgroundColor: theme?.primary || '#007BFF' }
                  ]}
                  onPress={() => {
                    if (validateForm()) {
                      handleSaveContainerType(localContainerType);
                    }
                  }}
                  disabled={loading}
                >
                  <RegularText style={{ color: 'white' }}>
                    {loading ? 'Saving...' : (selectedContainerType ? 'Update' : 'Create')}
                  </RegularText>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Add Rebate Modal */}
            <RNModal
              animationType="slide"
              transparent={true}
              visible={showAddRebateModal}
              onRequestClose={() => setShowAddRebateModal(false)}
            >
              <View style={styles.addRebateModalContainer}>
                <View style={[
                  styles.addRebateModalContent,
                  { backgroundColor: theme?.background || '#FFFFFF' }
                ]}>
                  <SemiBoldText style={{ 
                    fontSize: 18,
                    marginBottom: 15,
                    color: theme?.text || '#000000'
                  }}>
                    Add Restaurant Rebate
                  </SemiBoldText>
  
                  {localError && (
                    <RegularText style={{ color: 'red', marginBottom: 10 }}>
                      {localError}
                    </RegularText>
                  )}
  
                  <Picker
                    selectedValue={newRebateRestaurant}
                    style={[
                      styles.picker,
                      { 
                        backgroundColor: theme?.input || '#F5F5F5',
                        color: theme?.text || '#000000'
                      }
                    ]}
                    onValueChange={(itemValue) => setNewRebateRestaurant(itemValue)}
                  >
                    <Picker.Item label="Select a restaurant" value="" />
                    {restaurants
                      .filter(r => !localContainerType.rebates.some(rebate => rebate.restaurantId === r._id))
                      .map(restaurant => (
                        <Picker.Item 
                          key={restaurant._id} 
                          label={restaurant.name} 
                          value={restaurant._id} 
                        />
                      ))}
                  </Picker>
  
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: theme?.input || '#F5F5F5', 
                        color: theme?.text || '#000000',
                        borderColor: theme?.border || '#E0E0E0'
                      }
                    ]}
                    placeholder="Rebate Value"
                    value={newRebateValue}
                    onChangeText={(text) => setNewRebateValue(text)}
                    keyboardType="numeric"
                    placeholderTextColor={theme?.textMuted || '#888888'}
                  />
  
                  <View style={styles.addRebateButtonContainer}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.cancelButton,
                        { borderColor: theme?.border || '#E0E0E0' }
                      ]}
                      onPress={() => {
                        setShowAddRebateModal(false);
                        setLocalError('');
                      }}
                    >
                      <RegularText style={{ color: theme?.text || '#000000' }}>
                        Cancel
                      </RegularText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.saveButton,
                        { backgroundColor: theme?.primary || '#007BFF' }
                      ]}
                      onPress={handleAddRebate}
                    >
                      <RegularText style={{ color: 'white' }}>
                        Add Rebate
                      </RegularText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </RNModal>
          </Animated.View>
        </KeyboardAvoidingView>
      </RNModal>
    );
  };

  return (
    <SafeAreaView style={[
      styles.container, 
      { backgroundColor: theme?.background || '#F9F9F9' }
    ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme?.background || '#F9F9F9'}
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
                Container Types
              </SemiBoldText>
              
              <TouchableOpacity 
              onPress={() => openContainerTypeModal()}>
                <Ionicons 
                  name="add-circle-outline" 
                  size={24} 
                  color={theme?.primary || '#007BFF'} 
                />
              </TouchableOpacity>
            </View>
      
      {/* Container Type List */}
      <FlatList
        data={containerTypes}
        renderItem={renderContainerTypeItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchContainerTypes} 
            colors={[theme?.primary || '#007BFF']}
            tintColor={theme?.primary || '#007BFF'}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="cube-outline" 
              size={48} 
              color={theme?.textMuted || '#888888'} 
            />
            <RegularText style={{ 
              color: theme?.textMuted || '#888888',
              marginTop: 10,
              textAlign: 'center'
            }}>
              No container types found.{'\n'}
              Pull down to refresh or add a new one.
            </RegularText>
          </View>
        )}
      />
      
      {/* Modals */}
      {modalVisible && <ContainerTypeModal />}
      {actionModalVisible && <ActionModal />}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  list: {
    padding: 15,
  },
  containerTypeCard: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  containerTypeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerTypeImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },
  containerTypeImage: {
    width: '100%',
    height: '100%',
  },
  containerTypeInitials: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerTypeDetails: {
    flex: 1,
  },
  priceContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  priceText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Add padding to keep modal from edges on small screens
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  containerTypeImagePickerContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  containerTypeImagePicker: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  containerTypeImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  rebateSection: {
    marginBottom: 15,
  },
  rebateSectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  rebateItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rebateInput: {
    height: 40,
    width: '30%',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    textAlign: 'right',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalOverlayTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalContainer: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden', // Ensure nothing bleeds outside the container
    display: 'flex',
    flexDirection: 'column',
  },
  rebateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  addRebateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  deleteRebateButton: {
    padding: 5,
    marginLeft: 5,
  },
  addRebateModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  addRebateModalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 15,
  },
  addRebateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalScrollView: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.6, // Control scroll area height
  },
  maxUsesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  maxUsesText: {
    fontSize: 14,
  },
});

export default AdminContainerTypeScreen;