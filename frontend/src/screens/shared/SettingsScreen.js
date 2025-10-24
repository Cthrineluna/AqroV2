import React, { useState } from 'react';
import { 
  StyleSheet, 
  Switch, 
  View, 
  TouchableOpacity, 
  Platform, 
  StatusBar, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  ThemedView, 
  BoldText, 
  RegularText,
  MediumText,
  SemiBoldText
} from '../../components/StyledComponents';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme, followSystem, setFollowSystem } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const iconColor = isDark ? '#677325' : theme.text;

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };
  
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  const handleInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      Alert.alert('Error', 'New password is required');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const updatePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }
      
      const response = await axios.put(
        `${getApiUrl('/users/password')}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data) {
        Alert.alert('Success', 'Password updated successfully');
        setPasswordSection(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.response && error.response.data) {
        Alert.alert('Error', error.response.data.message || 'Failed to update password');
      } else {
        Alert.alert('Error', 'Failed to update password. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, {backgroundColor: theme.background}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <BoldText style={styles.title}>Settings</BoldText>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={22} color={theme.primary} />
            <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Appearance</BoldText>
          </View>
          
          <View style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>Follow system theme</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  Automatically switch between light and dark mode
                </RegularText>
              </View>
              <Switch
                value={followSystem}
                onValueChange={setFollowSystem}
                trackColor={{ false: '#767577', true: theme.primary }}
                thumbColor="#f4f3f4"
              />
            </View>
            
            {!followSystem && (
              <View style={[styles.settingRow, {borderBottomWidth: 0}]}>
                <View style={styles.settingLabelContainer}>
                  <MediumText style={{color: theme.text}}>Dark Mode</MediumText>
                  <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                    Enable dark theme
                  </RegularText>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#767577', true: theme.primary }}
                  thumbColor="#f4f3f4"
                />
              </View>
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={22} color={theme.primary} />
            <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Security</BoldText>
          </View>
          
          <View style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <TouchableOpacity 
              style={[styles.settingRow, {borderBottomWidth: 0}]}
              onPress={() => setPasswordSection(!passwordSection)}
            >
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>Change Password</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  Update your account password
                </RegularText>
              </View>
              <Ionicons 
                name={passwordSection ? "chevron-up" : "chevron-forward"} 
                size={20} 
                color={theme.text} 
              />
            </TouchableOpacity>
          </View>
          
          {passwordSection && (
            <View style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border, marginTop: 10}]}>
             <View style={styles.passwordInputContainer}>
                <RegularText style={{color: theme.text, marginBottom: 8}}>Current Password</RegularText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showCurrentPassword}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => handleInputChange('currentPassword', text)}
                    style={[styles.input, {backgroundColor: theme.input, color: theme.text, borderColor: theme.border, flex: 1}]}
                    placeholderTextColor={theme.text + '60'}
                    placeholder="Enter current password"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle} 
                    onPress={toggleCurrentPasswordVisibility}
                  >
                    <Ionicons 
                      name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={iconColor} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.passwordInputContainer}>
                <RegularText style={{color: theme.text, marginBottom: 8}}>New Password</RegularText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showNewPassword}
                    value={passwordData.newPassword}
                    onChangeText={(text) => handleInputChange('newPassword', text)}
                    style={[styles.input, {backgroundColor: theme.input, color: theme.text, borderColor: theme.border, flex: 1}]}
                    placeholderTextColor={theme.text + '60'}
                    placeholder="Enter new password"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle} 
                    onPress={toggleNewPasswordVisibility}
                  >
                    <Ionicons 
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={iconColor} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.passwordInputContainer}>
                <RegularText style={{color: theme.text, marginBottom: 8}}>Confirm New Password</RegularText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    secureTextEntry={!showConfirmPassword}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    style={[styles.input, {backgroundColor: theme.input, color: theme.text, borderColor: theme.border, flex: 1}]}
                    placeholderTextColor={theme.text + '60'}
                    placeholder="Confirm new password"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle} 
                    onPress={toggleConfirmPasswordVisibility}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={iconColor} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, {backgroundColor: theme.background, borderColor: theme.border}]}
                  onPress={() => {
                    setPasswordSection(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  <MediumText style={{color: theme.text}}>Cancel</MediumText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, {backgroundColor: theme.primary}]}
                  onPress={updatePassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MediumText style={{color: '#fff'}}>Update</MediumText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={22} color={theme.primary} />
            <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Account</BoldText>
          </View>
          
          <View style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>Email</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  {user?.email || 'Not available'}
                </RegularText>
              </View>
            </View>
            
            <View style={[styles.settingRow, {borderBottomWidth: 0}]}>
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>Username</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  {user?.username || user?.firstName + ' ' + user?.lastName || 'Not available'}
                </RegularText>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, {marginBottom: 30}]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
            <BoldText style={[styles.sectionTitle, {color: theme.text}]}>About</BoldText>
          </View>
          
          <View style={[styles.card, {backgroundColor: theme.card, borderColor: theme.border}]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>App Version</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  aQRo 2.0.0
                </RegularText>
              </View>
            </View>
            
            <TouchableOpacity style={[styles.settingRow, {borderBottomWidth: 0}]}>
              <View style={styles.settingLabelContainer}>
                <MediumText style={{color: theme.text}}>Terms of Service</MediumText>
                <RegularText style={{color: theme.text + '80', fontSize: 12}}>
                  View our terms and conditions
                </RegularText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingLabelContainer: {
    flex: 1,
  },
  passwordInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  passwordToggle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 46,
    width: 40,
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

export default SettingsScreen;