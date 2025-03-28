import React, { useState, useEffect, useCallback } from 'react';
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
  Animated
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

const AdminUsersScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, userToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fetch users
  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const storedToken = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(`${getApiUrl()}/admin/users`, {
        headers: { 
          Authorization: `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setRefreshing(false);
    }
  };

  // Pick Profile Image
  const pickProfileImage = async () => {
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
      setNewUser(prev => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  // Create/Update User
  const handleSaveUser = async (userData) => {
    try {
      const storedToken = await AsyncStorage.getItem('aqro_token');
  
      if (selectedUser) {
        // Update existing user
        await axios.put(
          `${getApiUrl()}/admin/users/${selectedUser._id}`, 
          {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            userType: userData.userType,
            profileImage: userData.profileImage
          }, 
          { 
            headers: { 
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            } 
          }
        );
      } else {
        // Create new user
        await axios.post(
          `${getApiUrl()}/admin/users`, 
          userData, 
          { 
            headers: { 
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            } 
          }
        );
      }
      
      // Reset form and close modal
      fetchUsers();
      setModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error saving user:', error.response?.data || error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save user');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user?',
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
                `${getApiUrl()}/admin/users/${userId}`, 
                { 
                  headers: { 
                    Authorization: `Bearer ${storedToken}` 
                  } 
                }
              );
              fetchUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  // Open modal for editing/creating user
  const openUserModal = useCallback((user = null) => {
    setSelectedUser(user);
    setModalVisible(true);
  }, []);

  // Initial state for new user
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'customer',
    profileImage: null
  });

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Render user item
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.userCard, 
        { 
          backgroundColor: theme?.card || '#FFFFFF', 
          borderColor: theme?.border || '#E0E0E0' 
        }
      ]}
      onPress={() => {
        setSelectedUser(item);
        setActionModalVisible(true);
      }}
    >
      <View style={styles.userCardContent}>
        {/* Profile Image or Initials */}
        <View style={styles.profileImageContainer}>
          {item.profilePicture ? (
            <Image 
              source={{ uri: item.profilePicture }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={[
              styles.profileInitials, 
              { backgroundColor: theme?.primary || '#007BFF' }
            ]}>
              <RegularText style={styles.profileInitialsText}>
                {item.firstName[0]}{item.lastName[0]}
              </RegularText>
            </View>
          )}
        </View>

        {/* User Details */}
        <View style={styles.userDetails}>
          <SemiBoldText style={{ color: theme?.text || '#000000' }}>
            {item.firstName} {item.lastName}
          </SemiBoldText>
          <RegularText style={{ color: theme?.textMuted || '#666666' }}>
            {item.email}
          </RegularText>
        </View>

        {/* User Type */}
        <View style={[
          styles.userTypeContainer, 
          { backgroundColor: theme?.primary + '20' || 'rgba(0,123,255,0.1)' }
        ]}>
          <RegularText style={[
            styles.userTypeText, 
            { color: theme?.primary || '#007BFF' }
          ]}>
            {item.userType}
          </RegularText>
        </View>
      </View>
    </TouchableOpacity>
  );

  // User Management Modal
  const UserModal = () => {
    const [localUser, setLocalUser] = useState({
      firstName: selectedUser?.firstName || '',
      lastName: selectedUser?.lastName || '',
      email: selectedUser?.email || '',
      password: '',
      userType: selectedUser?.userType || 'customer',
      profileImage: selectedUser?.profilePicture || null
    });
    const [localError, setLocalError] = useState('');

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
      return true;
    };

    return (
      <RNModal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent, 
            { backgroundColor: theme?.background || '#FFFFFF' }
          ]}>
            {/* Profile Image Picker */}
            <TouchableOpacity 
              style={styles.profileImagePickerContainer}
              onPress={pickProfileImage}
            >
              {localUser.profileImage ? (
                <Image 
                  source={{ uri: localUser.profileImage }} 
                  style={styles.profileImagePicker} 
                />
              ) : (
                <View style={[
                  styles.profileImagePlaceholder,
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
              placeholder="First Name"
              value={localUser.firstName}
              onChangeText={(text) => {
                setLocalUser(prev => ({ ...prev, firstName: text }));
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
              placeholder="Last Name"
              value={localUser.lastName}
              onChangeText={(text) => {
                setLocalUser(prev => ({ ...prev, lastName: text }));
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
              placeholder="Email"
              value={localUser.email}
              onChangeText={(text) => {
                setLocalUser(prev => ({ ...prev, email: text }));
                setLocalError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme?.textMuted || '#888888'}
            />

            {!selectedUser && (
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme?.input || '#F5F5F5', 
                    color: theme?.text || '#000000',
                    borderColor: theme?.border || '#E0E0E0'
                  }
                ]}
                placeholder="Password"
                value={localUser.password}
                onChangeText={(text) => {
                  setLocalUser(prev => ({ ...prev, password: text }));
                  setLocalError('');
                }}
                secureTextEntry
                placeholderTextColor={theme?.textMuted || '#888888'}
              />
            )}

            {/* User Type Selection */}
            <View style={styles.userTypeRadioContainer}>
              {['customer', 'staff', 'admin'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.userTypeRadioButton}
                  onPress={() => {
                    setLocalUser(prev => ({ ...prev, userType: type }));
                  }}
                >
                  <View style={[
                    styles.radioOuterCircle,
                    { 
                      borderColor: localUser.userType === type 
                        ? (theme?.primary || '#007BFF')
                        : (theme?.border || '#E0E0E0')
                    }
                  ]}>
                    {localUser.userType === type && (
                      <View 
                        style={[
                          styles.radioInnerCircle,
                          { backgroundColor: theme?.primary || '#007BFF' }
                        ]} 
                      />
                    )}
                  </View>
                  <RegularText style={{ color: theme?.text || '#000000' }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </RegularText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.cancelButton,
                  { borderColor: theme?.border || '#E0E0E0' }
                ]}
                onPress={() => setModalVisible(false)}
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
                    handleSaveUser(localUser);
                  }
                }}
              >
                <RegularText style={{ color: 'white' }}>
                  {selectedUser ? 'Update' : 'Create'}
                </RegularText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    );
  };

  // Action Modal
  const ActionModal = () => (
    <RNModal
      animationType="slide"
      transparent={true}
      visible={actionModalVisible}
      onRequestClose={() => setActionModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.actionModalOverlay} 
        activeOpacity={1} 
        onPressOut={() => setActionModalVisible(false)}
      >
        <View style={[
          styles.actionModalContent, 
          { backgroundColor: theme?.card || '#FFFFFF' }
        ]}>

          <TouchableOpacity 
            style={styles.actionModalButton}
            onPress={() => {
              setActionModalVisible(false);
              openUserModal(selectedUser);
            }}
          >
            <Ionicons 
              name="create-outline" 
              size={24} 
              color={theme?.text || '#000000'} 
            />
            <RegularText style={{ marginLeft: 10 }}>
              Edit User
            </RegularText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionModalButton}
            onPress={() => {
              setActionModalVisible(false);
              handleDeleteUser(selectedUser._id);
            }}
          >
            <Ionicons 
              name="trash-outline" 
              size={24} 
              color="red" 
            />
            <RegularText style={{ marginLeft: 10, color: 'red' }}>
              Delete User
            </RegularText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </RNModal>
  );

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
          User Management
        </SemiBoldText>
        
        <TouchableOpacity onPress={() => openUserModal()}>
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={theme?.primary || '#007BFF'} 
          />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchUsers}
            colors={[theme?.primary || '#007BFF']}
            tintColor={theme?.primary || '#007BFF'}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <RegularText style={{ color: theme?.text || '#000000' }}>
              No users found
            </RegularText>
          </View>
        )}
      />

      <UserModal />
      <ActionModal />
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
  listContent: {
    paddingHorizontal: 16,
  },
  userCard: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInitials: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitialsText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userTypeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  userTypeText: {
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});

export default AdminUsersScreen;