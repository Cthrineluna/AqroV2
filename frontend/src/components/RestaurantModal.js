import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { RegularText, SemiBoldText } from './StyledComponents';

const { width } = Dimensions.get('window');

const RestaurantModal = ({ 
  visible, 
  onClose, 
  restaurant, 
  onSave, 
  isLoading,
  isStaff,
  theme 
}) => {
  const [localRestaurant, setLocalRestaurant] = useState({
    name: '',
    description: '',
    contactNumber: '',
    location: {
      address: '',
      city: '',
      coordinates: {
        lat: 14.5995, // Default to Manila coordinates
        lng: 120.9842
      }
    },
    logo: null,
    banner: null,
    operatingHours: {
      open: '8:00 AM',
      close: '5:00 PM'
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });
  
  const [localError, setLocalError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showOpenTimePicker, setShowOpenTimePicker] = useState(false);
  const [showCloseTimePicker, setShowCloseTimePicker] = useState(false);
  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const parseTimeString = (timeString) => {
    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, parseInt(minutes), 0);
    return date;
  };

  useEffect(() => {
    if (visible && restaurant) {
      setLocalRestaurant({
        name: restaurant?.name || '',
        description: restaurant?.description || '',
        contactNumber: restaurant?.contactNumber || '',
        location: {
          address: restaurant?.location?.address || '',
          city: restaurant?.location?.city || '',
          coordinates: restaurant?.location?.coordinates || {
            lat: 14.5995,
            lng: 120.9842
          }
        },
        logo: restaurant?.logo || null,
        banner: restaurant?.banner || null,
        operatingHours: {
          open: restaurant?.operatingHours?.open || '8:00 AM',
          close: restaurant?.operatingHours?.close || '5:00 PM'
        },
        socialMedia: {
          facebook: restaurant?.socialMedia?.facebook || '',
          instagram: restaurant?.socialMedia?.instagram || '',
          twitter: restaurant?.socialMedia?.twitter || ''
        }
      });
      setOpenTime(parseTimeString(restaurant.operatingHours?.open || '8:00 AM'));
      setCloseTime(parseTimeString(restaurant.operatingHours?.close || '5:00 PM'));
      setLocalError('');
      fadeIn();
    }
  }, [visible, restaurant]);

  const handleOpenTimeChange = (event, selectedTime) => {
    setShowOpenTimePicker(false);
    if (selectedTime) {
      setOpenTime(selectedTime);
      setLocalRestaurant(prev => ({
        ...prev,
        operatingHours: { 
          ...prev.operatingHours, 
          open: formatTime(selectedTime)
        }
      }));
    }
  };

  const handleCloseTimeChange = (event, selectedTime) => {
    setShowCloseTimePicker(false);
    if (selectedTime) {
      setCloseTime(selectedTime);
      setLocalRestaurant(prev => ({
        ...prev,
        operatingHours: { 
          ...prev.operatingHours, 
          close: formatTime(selectedTime)
        }
      }));
    }
  };

  const handleLocationPress = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow location access to set the restaurant location.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current coordinates from local state
      const { lat, lng } = localRestaurant.location.coordinates;

      // Open maps with current coordinates
      const url = Platform.select({
        ios: `maps:${lat},${lng}?q=@${lat},${lng}`,
        android: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        
        // Show alert with instructions
        Alert.alert(
          'Select Location',
          '1. The map will open with the current coordinates\n2. Search for or select your desired location\n3. The coordinates will be shown in the search bar\n4. Copy the coordinates and return to the app\n5. Enter the coordinates in the fields below',
          [
            {
              text: 'Enter Coordinates Manually',
              onPress: () => {
                Alert.prompt(
                  'Enter Coordinates',
                  'Enter latitude and longitude (e.g., 14.5995, 120.9842)',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'OK',
                      onPress: (coordinates) => {
                        if (coordinates) {
                          const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
                          if (!isNaN(lat) && !isNaN(lng)) {
                            setLocalRestaurant(prev => ({
                              ...prev,
                              location: {
                                ...prev.location,
                                coordinates: { lat, lng }
                              }
                            }));
                          } else {
                            Alert.alert('Invalid Format', 'Please enter coordinates in the format: latitude, longitude');
                          }
                        }
                      },
                    },
                  ],
                  'plain-text',
                  `${lat}, ${lng}`
                );
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Could not open maps application',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error handling location:', error);
      Alert.alert(
        'Error',
        'Failed to open maps',
        [{ text: 'OK' }]
      );
    }
  };

  // Simple coordinate input handlers
  const handleLatitudeChange = (text) => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      setLocalRestaurant(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            lat: num
          }
        }
      }));
    }
  };

  const handleLongitudeChange = (text) => {
    const num = parseFloat(text);
    if (!isNaN(num)) {
      setLocalRestaurant(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: {
            ...prev.location.coordinates,
            lng: num
          }
        }
      }));
    }
  };

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

  const pickLogoImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalRestaurant(prev => ({ ...prev, logo: base64Image }));
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

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalRestaurant(prev => ({ ...prev, banner: base64Image }));
      }
    } catch (error) {
      console.error('Error picking banner image:', error);
      Alert.alert('Error', 'Failed to pick banner image');
    }
  };

  const isValidPhoneNumber = (number) => {
    const digits = number.replace(/\D/g, '');
    return /^639\d{9}$/.test(digits);
  };

  const formatPHPhoneNumber = (text) => {
    // Remove non-digit characters
    let digits = text.replace(/\D/g, '');
  
    // Remove leading 0
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  
    // Remove leading 63 if exists
    if (digits.startsWith('63')) {
      digits = digits.slice(2);
    }
  
    // Limit to 10 digits (PH mobile numbers only)
    digits = digits.slice(0, 10);
  
    // Format: 912 345 6789
    const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return '+63 ' + digits;
  
    const [, part1, part2, part3] = match;
    return '+63 ' + [part1, part2, part3].filter(Boolean).join(' ');
  };

  const validateForm = () => {
    if (!localRestaurant.name.trim()) {
      setLocalError('Restaurant name is required');
      return false;
    }
    if (!localRestaurant.contactNumber.trim()) {
      setLocalError('Contact number is required');
      return false;
    }
    if (!isValidPhoneNumber(localRestaurant.contactNumber)) {
      setLocalError('Please enter a valid Philippine phone number (e.g., 09123456789)');
      return false;
    }
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

  const handleSave = () => {
    if (validateForm()) {
      // Create a clean copy of the restaurant data without the base64 images
      const cleanRestaurantData = {
        ...restaurant,
        ...localRestaurant,
        // Only include logo/banner if they've been changed
        logo: localRestaurant.logo !== restaurant?.logo ? localRestaurant.logo : undefined,
        banner: localRestaurant.banner !== restaurant?.banner ? localRestaurant.banner : undefined,
        // Ensure operatingHours and socialMedia are properly formatted
        operatingHours: {
          open: localRestaurant.operatingHours.open,
          close: localRestaurant.operatingHours.close
        },
        socialMedia: {
          facebook: localRestaurant.socialMedia.facebook.trim(),
          instagram: localRestaurant.socialMedia.instagram.trim(),
          twitter: localRestaurant.socialMedia.twitter.trim()
        }
      };

      // Remove any undefined values
      Object.keys(cleanRestaurantData).forEach(key => {
        if (cleanRestaurantData[key] === undefined) {
          delete cleanRestaurantData[key];
        }
      });

      onSave(cleanRestaurantData);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        fadeOut(onClose);
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
              Edit Restaurant
            </SemiBoldText>
            
            <View style={styles.bannerContainer}>
              {/* The Banner itself is wrapped in TouchableOpacity */}
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
              
              {/* Overlapping Logo - Separate TouchableOpacity */}
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
                        : 'RS'}
                    </RegularText>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Logo Hint Text - Positioned below the overlapping logo */}
              <View style={styles.logoHintContainer}>
                <RegularText style={[styles.logoHint, { color: theme?.textMuted || '#888888' }]}>
                  Tap images to change
                </RegularText>
              </View>
            </View>

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
              placeholder="Restaurant Name"
              value={localRestaurant.name}
              onChangeText={(text) => {
                setLocalRestaurant(prev => ({ ...prev, name: text }));
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
                  borderColor: theme?.border || '#E0E0E0'
                }
              ]}
              placeholder="Description (optional)"
              value={localRestaurant.description}
              onChangeText={(text) => {
                setLocalRestaurant(prev => ({ ...prev, description: text }));
              }}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor={theme?.textMuted || '#888888'}
            />

            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: theme?.input || '#F5F5F5', 
                  color: theme?.text || '#000000',
                  borderColor: theme?.border || '#E0E0E0'
                }
              ]}
              placeholder="Contact Number (PH)"
              value={localRestaurant.contactNumber}
              onChangeText={(text) => {
                const formatted = formatPHPhoneNumber(text);
                setLocalRestaurant(prev => ({ ...prev, contactNumber: formatted }));
                setLocalError('');
              }}
              keyboardType="phone-pad"
              placeholderTextColor={theme?.textMuted || '#888888'}
            />

            {/* Location Section */}
            <View style={styles.section}>
              <SemiBoldText style={[styles.sectionTitle, { color: theme?.text || '#000000' }]}>
                Location
              </SemiBoldText>
              
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme?.input || '#F5F5F5', 
                    color: theme?.text || '#000000',
                    borderColor: theme?.border || '#E0E0E0'
                  }
                ]}
                placeholder="Street Address"
                value={localRestaurant.location.address}
                onChangeText={(text) => {
                  setLocalRestaurant(prev => ({
                    ...prev,
                    location: { ...prev.location, address: text }
                  }));
                }}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme?.input || '#F5F5F5', 
                    color: theme?.text || '#000000',
                    borderColor: theme?.border || '#E0E0E0'
                  }
                ]}
                placeholder="City"
                value={localRestaurant.location.city}
                onChangeText={(text) => {
                  setLocalRestaurant(prev => ({
                    ...prev,
                    location: { ...prev.location, city: text }
                  }));
                }}
                placeholderTextColor={theme?.textMuted || '#888888'}
              />

              <TouchableOpacity style={styles.infoRow} onPress={handleLocationPress}>
                <Ionicons name="location-outline" size={20} color={theme.primary} />
                <RegularText style={[styles.infoText, { color: theme.text }]}>
                  Set Coordinates from Map
                </RegularText>
              </TouchableOpacity>

              {/* Manual Coordinate Input */}
              <View style={styles.coordinatesContainer}>
                <View style={styles.coordinateInputRow}>
                  <View style={styles.coordinateInput}>
                    <RegularText style={[styles.coordinateLabel, { color: theme.text }]}>Latitude</RegularText>
                    <TextInput
                      style={[styles.coordinateTextInput, { 
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.card
                      }]}
                      value={localRestaurant.location.coordinates?.lat?.toString() || ''}
                      onChangeText={handleLatitudeChange}
                      placeholder="Enter latitude"
                      placeholderTextColor={theme.text + '80'}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.coordinateInput}>
                    <RegularText style={[styles.coordinateLabel, { color: theme.text }]}>Longitude</RegularText>
                    <TextInput
                      style={[styles.coordinateTextInput, { 
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.card
                      }]}
                      value={localRestaurant.location.coordinates?.lng?.toString() || ''}
                      onChangeText={handleLongitudeChange}
                      placeholder="Enter longitude"
                      placeholderTextColor={theme.text + '80'}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <RegularText style={[styles.coordinateHint, { color: theme.text + '80' }]}>
                  Example: 14.5995, 120.9842
                </RegularText>
              </View>
            </View>

            {/* Operating Hours Section */}
            <View style={styles.section}>
              <SemiBoldText style={[styles.sectionTitle, { color: theme?.text || '#000000' }]}>
                Operating Hours
              </SemiBoldText>
              <View style={styles.timeContainer}>
                <View style={styles.timeInput}>
                  <RegularText style={[styles.label, { color: theme?.text || '#000000' }]}>Open</RegularText>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      { 
                        backgroundColor: theme?.input || '#F5F5F5',
                        borderColor: theme?.border || '#E0E0E0'
                      }
                    ]}
                    onPress={() => setShowOpenTimePicker(true)}
                  >
                    <RegularText style={{ color: theme?.text || '#000000' }}>
                      {localRestaurant.operatingHours.open}
                    </RegularText>
                  </TouchableOpacity>
                  {showOpenTimePicker && (
                    <DateTimePicker
                      value={openTime}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleOpenTimeChange}
                    />
                  )}
                </View>
                <View style={styles.timeInput}>
                  <RegularText style={[styles.label, { color: theme?.text || '#000000' }]}>Close</RegularText>
                  <TouchableOpacity
                    style={[
                      styles.timePickerButton,
                      { 
                        backgroundColor: theme?.input || '#F5F5F5',
                        borderColor: theme?.border || '#E0E0E0'
                      }
                    ]}
                    onPress={() => setShowCloseTimePicker(true)}
                  >
                    <RegularText style={{ color: theme?.text || '#000000' }}>
                      {localRestaurant.operatingHours.close}
                    </RegularText>
                  </TouchableOpacity>
                  {showCloseTimePicker && (
                    <DateTimePicker
                      value={closeTime}
                      mode="time"
                      is24Hour={false}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleCloseTimeChange}
                    />
                  )}
                </View>
              </View>
            </View>

            {/* Social Media Section */}
            <View style={styles.section}>
              <SemiBoldText style={[styles.sectionTitle, { color: theme?.text || '#000000' }]}>
                Social Media Links
              </SemiBoldText>
              <View style={styles.socialInput}>
                <Ionicons name="logo-facebook" size={24} color={theme?.primary || '#007BFF'} />
                <TextInput
                  style={[
                    styles.socialTextInput,
                    { 
                      backgroundColor: theme?.input || '#F5F5F5',
                      color: theme?.text || '#000000',
                      borderColor: theme?.border || '#E0E0E0'
                    }
                  ]}
                  placeholder="Facebook URL"
                  value={localRestaurant.socialMedia.facebook}
                  onChangeText={(text) => {
                    setLocalRestaurant(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, facebook: text }
                    }));
                  }}
                  placeholderTextColor={theme?.textMuted || '#888888'}
                />
              </View>
              <View style={styles.socialInput}>
                <Ionicons name="logo-instagram" size={24} color={theme?.primary || '#007BFF'} />
                <TextInput
                  style={[
                    styles.socialTextInput,
                    { 
                      backgroundColor: theme?.input || '#F5F5F5',
                      color: theme?.text || '#000000',
                      borderColor: theme?.border || '#E0E0E0'
                    }
                  ]}
                  placeholder="Instagram URL"
                  value={localRestaurant.socialMedia.instagram}
                  onChangeText={(text) => {
                    setLocalRestaurant(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, instagram: text }
                    }));
                  }}
                  placeholderTextColor={theme?.textMuted || '#888888'}
                />
              </View>
              <View style={styles.socialInput}>
                <Ionicons name="logo-twitter" size={24} color={theme?.primary || '#007BFF'} />
                <TextInput
                  style={[
                    styles.socialTextInput,
                    { 
                      backgroundColor: theme?.input || '#F5F5F5',
                      color: theme?.text || '#000000',
                      borderColor: theme?.border || '#E0E0E0'
                    }
                  ]}
                  placeholder="Twitter URL"
                  value={localRestaurant.socialMedia.twitter}
                  onChangeText={(text) => {
                    setLocalRestaurant(prev => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, twitter: text }
                    }));
                  }}
                  placeholderTextColor={theme?.textMuted || '#888888'}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  { borderColor: theme?.border || '#E0E0E0' }
                ]}
                onPress={() => {
                  fadeOut(onClose);
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
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <RegularText style={{ color: 'white' }}>
                    Save Changes
                  </RegularText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      {isLoading && (
        <View style={[
          styles.loadingOverlay,
          { backgroundColor: theme?.modalOverlay || 'rgba(0,0,0,0.5)' }
        ]}
        pointerEvents={isLoading ? "auto" : "none"}>
          <View style={[
            styles.loadingContainer,
            { backgroundColor: theme?.card || '#FFFFFF' }
          ]}>
            <ActivityIndicator size="large" color={theme?.primary || '#007BFF'} />
            <RegularText style={{marginTop: 10, color: theme?.text || '#000000'}}>
              Updating restaurant...
            </RegularText>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 10,
    padding: 16,
    paddingTop: 24,
    elevation: 5,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
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
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
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
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  socialTextInput: {
    flex: 1,
    marginLeft: 12,
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
  },
  timePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordinatesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  coordinateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  coordinateTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
  },
  coordinateHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
  },
});

export default RestaurantModal;