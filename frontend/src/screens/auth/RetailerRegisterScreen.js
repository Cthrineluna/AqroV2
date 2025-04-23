import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { registerStaff } from '../../services/approvalService';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText 
} from '../../components/StyledComponents';
import * as NavigationBar from 'expo-navigation-bar';

const RetailerRegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [businessPermit, setbusinessPermit] = useState(null);
  const [restaurantLogo, setRestaurantLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme, isDark } = useTheme();
  const [birRegistration, setBirRegistration] = useState(null);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const isValidPhoneNumber = (number) => {
    const digits = number.replace(/\D/g, '');
    return /^639\d{9}$/.test(digits); 
  };


const pickBirDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true
    });
    
    if (!result.canceled) {
      const fileAsset = result.assets[0];
      const fileSizeInMB = fileAsset.size / (1024 * 1024);
      if (fileSizeInMB > 5) {
        setError('BIR registration file size must be less than 5MB');
        return;
      }
      
      setBirRegistration(fileAsset);
      setError('');
    }
  } catch (err) {
    console.error('Error picking BIR document:', err);
    setError('Failed to select BIR document: ' + (err.message || 'Unknown error'));
  }
};

const pickDocument = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true // Ensure file is cached for React Native access
    });
    
    if (!result.canceled) {
      const fileAsset = result.assets[0];
      console.log('Selected business permit:', fileAsset);
      
      // Add file size validation
      const fileSizeInMB = fileAsset.size / (1024 * 1024);
      if (fileSizeInMB > 5) { // 5MB limit
        setError('Business permit file size must be less than 5MB');
        return;
      }
      
      setbusinessPermit(fileAsset);
      setError(''); // Clear any previous errors
    }
  } catch (err) {
    console.error('Error picking document:', err);
    setError('Failed to select document: ' + (err.message || 'Unknown error'));
  }
};

// Update the pickImage function
const pickImage = async () => {
  try {
    // Request permission first (optional but recommended)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.8,
      base64: true // Add this to get base64 data
    });

    if (!result.canceled) {
      const imageAsset = result.assets[0];
      console.log('Selected restaurant logo:', imageAsset);
      
      // Add file size validation
      const fileSizeInMB = imageAsset.fileSize / (1024 * 1024);
      if (fileSizeInMB > 2) {
        setError('Restaurant logo image size must be less than 2MB');
        return;
      }
      
      // Add the base64 string to the imageAsset object
      const base64String = `data:image/jpeg;base64,${imageAsset.base64}`;
      
      // Store both original asset data and the base64 string
      setRestaurantLogo({
        ...imageAsset,
        base64String: base64String
      });
      
      setError('');
    }
  } catch (err) {
    console.error('Error picking image:', err);
    setError('Failed to select image: ' + (err.message || 'Unknown error'));
  }
};
  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All personal information fields are required');
      return false;
    }

    if (!restaurantName.trim() || !address.trim() || !city.trim() || !contactNumber.trim()) {
      setError('All restaurant information fields are required');
      return false;
    }
    if (!isValidPhoneNumber(contactNumber)) {
      setError('Please enter a valid Philippine phone number (e.g., +639123456789)');
      return false;
    }

    if (!birRegistration) {
      setError('BIR registration document is required');
      return false;
    }
    if (!businessPermit) {
      setError('Business permit document is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
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
  
  const handleRegister = async () => {
    setError('');
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      // Create staff data object
      const staffData = {
        firstName,
        lastName,
        email,
        password,
        restaurantName,
        address,
        city,
        contactNumber,
        businessPermit,
        birRegistration
      };
  
      // Add the restaurant logo - either base64 string or file reference
      if (restaurantLogo) {
        if (restaurantLogo.base64String) {
          // Use the base64 string if available
          staffData.restaurantLogo = restaurantLogo.base64String;
        } else {
          // Otherwise use the file object
          staffData.restaurantLogo = restaurantLogo;
        }
      }
      console.log('Submitting registration with data:', {
        businessPermit: businessPermit ? `File: ${businessPermit.name}, Size: ${(businessPermit.size/1024).toFixed(2)}KB` : null,
        birRegistration: birRegistration ? `File: ${birRegistration.name}, Size: ${(birRegistration.size/1024).toFixed(2)}KB` : null,
      });
      console.log('Submitting registration with data:', {
        ...staffData,
        password: '[REDACTED]',
        businessPermit: businessPermit ? 
          `File: ${businessPermit.name}, Size: ${(businessPermit.size/1024).toFixed(2)}KB` : null,
        birRegistration: birRegistration ? 
          `File: ${birRegistration.name}, Size: ${(birRegistration.size/1024).toFixed(2)}KB` : null,
        restaurantLogo: restaurantLogo ? 
          (restaurantLogo.base64String ? 
            `Base64 Image (${(restaurantLogo.fileSize/1024).toFixed(2)}KB)` : 
            `File: ${restaurantLogo.name}, Size: ${(restaurantLogo.fileSize/1024).toFixed(2)}KB`) : null
      });
  
      const response = await registerStaff(staffData);
      
      console.log('Registration response:', response);
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please verify your email to continue.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EmailVerification', { email })
          }
        ]
      );
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setNavBarColor = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(theme.background);
      }
    };
    setNavBarColor();
  }, [theme.background]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      <View style={[styles.header, {backgroundColor: theme.background}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.registerSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={isDark 
                  ? require('../../../assets/images/aqro-logo-dark.png') 
                  : require('../../../assets/images/aqro-logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.heading}>
              <BoldText style={[styles.headingTitle, {color: theme.text}]}>Restaurant Registration</BoldText>
              <MediumText style={[styles.subtitle, {color: theme.text}]}>Create your staff account</MediumText>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <RegularText style={styles.errorText}>{error}</RegularText>
              </View>
            ) : null}

            {/* Personal Information Section */}
            <View style={[styles.section, { backgroundColor: theme.card}]}>
              <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Personal Information</BoldText>
              
              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>FIRST NAME</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border,}]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>LAST NAME</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>EMAIL</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>PASSWORD</MediumText>
                <View style={[styles.passwordContainer, {borderColor: theme.border}]}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, {color: theme.text}]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#9e9e9e"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle} 
                    onPress={togglePasswordVisibility}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={theme.text} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>CONFIRM PASSWORD</MediumText>
                <View style={[styles.passwordContainer, {borderColor: theme.border}]}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, {color: theme.text}]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#9e9e9e"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle} 
                    onPress={toggleConfirmPasswordVisibility}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={18} 
                      color={theme.text} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Restaurant Information Section */}
            <View style={[styles.section, { backgroundColor: theme.card}]}>
              <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Restaurant Information</BoldText>
              
              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>RESTAURANT NAME</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="Enter restaurant name"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>ADDRESS</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter restaurant address"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>CITY</MediumText>
                <TextInput
                  style={[styles.input, {color: theme.text, borderColor: theme.border}]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor="#9e9e9e"
                />
              </View>

              <View style={styles.formInput}>
                <MediumText style={styles.inputLabel}>CONTACT NUMBER</MediumText>
                <TextInput
  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
  value={contactNumber}
  onChangeText={(text) => {
    if (!text.startsWith('+63') && contactNumber.startsWith('+63')) return;

    const formatted = formatPHPhoneNumber(text);
    setContactNumber(formatted);
  }}
  placeholder="Enter contact number"
  keyboardType="phone-pad"
  placeholderTextColor="#9e9e9e"
/>

</View>

        <View style={styles.formInput}>
          <MediumText style={styles.inputLabel}>RESTAURANT LOGO (OPTIONAL)</MediumText>
          <TouchableOpacity 
            style={[styles.uploadButton, {borderColor: theme.border}]}
            onPress={pickImage}
          >
            {restaurantLogo ? (
              <Image 
                source={{ uri: restaurantLogo.uri }} 
                style={styles.uploadPreview}
                resizeMode="contain"
              />
            ) : (
              <MediumText style={[styles.uploadButtonText, {color: theme.text}]}>
                Select Logo Image
              </MediumText>
            )}
          </TouchableOpacity>
          <RegularText style={[styles.fileTypeText, {color: theme.text, fontSize: 12, marginTop: 8, opacity: 0.8}]}>
            Accepts JPG/PNG images (max 5MB)
          </RegularText>
        </View>

        <View style={styles.formInput}>
          <MediumText style={styles.inputLabel}>BUSINESS PERMIT*</MediumText>
          <TouchableOpacity 
            style={[styles.uploadButton, {borderColor: theme.border}]}
            onPress={pickDocument}
          >
            <MediumText style={[styles.uploadButtonText, {color: theme.text}]}>
              {businessPermit ? businessPermit.name : 'Select Document'}
            </MediumText>
          </TouchableOpacity>
          {businessPermit && (
            <MediumText style={[styles.fileSizeText, {color: theme.text}]}>
              {`${(businessPermit.size / 1024).toFixed(2)} KB`}
            </MediumText>
          )}
          <RegularText style={[styles.fileTypeText, {color: theme.text, fontSize: 12, marginTop: 8, opacity: 0.8}]}>
            Accepts PDF or JPG/PNG images (max 5MB)
          </RegularText>
        </View>

            <View style={styles.formInput}>
              <MediumText style={styles.inputLabel}>BIR REGISTRATION*</MediumText>
              <TouchableOpacity 
                style={[styles.uploadButton, {borderColor: theme.border}]}
                onPress={pickBirDocument}
              >
                <MediumText style={[styles.uploadButtonText, {color: theme.text}]}>
                  {birRegistration ? birRegistration.name : 'Select Document'}
                </MediumText>
              </TouchableOpacity>
              {birRegistration && (
                <MediumText style={[styles.fileSizeText, {color: theme.text,}]}>
                  {`${(birRegistration.size / 1024).toFixed(2)} KB`}
                </MediumText>
              )}
              <RegularText style={[styles.fileTypeText, {color: theme.text, fontSize: 12, marginTop: 8, opacity: 0.8}]}>
                Accepts PDF or JPG/PNG images (max 5MB)
              </RegularText>
            </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#030f0f" />
                    <BoldText style={styles.loadingText}>Creating Account...</BoldText>
                  </View>
                ) : (
                  <BoldText style={styles.registerButtonText}>REGISTER RESTAURANT</BoldText>
                )}
              </TouchableOpacity>
              
              <View style={styles.loginContainer}>
                <RegularText style={[styles.loginText, {color: theme.text}]}>Already have an account? </RegularText>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <SemiBoldText style={styles.loginLinkText}>Sign In</SemiBoldText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 50 : 70,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  registerSection: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 150,
  },
  heading: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
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
    color: '#d32f2f',
    fontSize: 14,
  },
  formInput: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    color: '#00df82',
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
  },
  passwordToggle: {
    padding: 8,
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  uploadButtonText: {
    fontSize: 14,
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  fileSizeText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  actionButtons: {
    alignItems: 'center',
    marginTop: 10,
  },
  registerButton: {
    backgroundColor: '#00df82',
    borderRadius: 30,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#030f0f',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    opacity: 0.8,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#00df82',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#030f0f',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default RetailerRegisterScreen;