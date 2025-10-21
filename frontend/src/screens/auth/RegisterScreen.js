import React, { useState } from 'react';
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
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText,
  ThemedView,
  ThemeToggle
} from '../../components/StyledComponents';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

// //added
// // place this near the top of the file (replace your existing formatter)
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

//   // Format: 912 345 6789 -> return "+63 912 345 6789" (spaces optional)
//   const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
//   if (!match) return '+63 ' + digits;

//   const [, part1, part2, part3] = match;
//   return '+63 ' + [part1, part2, part3].filter(Boolean).join(' ');
// };

// //added

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { checkAuthState } = useAuth();
  const { theme, isDark } = useTheme();
  const iconColor = isDark ? '#677325' : theme.text;
  //added
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatchMessage, setPasswordMatchMessage] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  //added
  //const [phoneNumber, setPhoneNumber] = useState('');
  //added
  const validateName = (text, type) => {
  // Check if text contains invalid characters
  const hasInvalid = /[^A-Za-z\s]/.test(text);
  const cleanedText = text.replace(/[^A-Za-z\s]/g, '');

  if (type === 'first') {
    setFirstName(cleanedText);

    if (hasInvalid) {
      setFirstNameError('Only letters are allowed in the first name.');
    } else {
      setFirstNameError('');
    }

  } else if (type === 'last') {
    setLastName(cleanedText);

    if (hasInvalid) {
      setLastNameError('Only letters are allowed in the last name.');
    } else {
      setLastNameError('');
    }
  }
};

  const validatePassword = (text) => {
  setPassword(text);

  // Regex checks
  const hasUpper = /[A-Z]/.test(text);
  const hasLower = /[a-z]/.test(text);
  const hasNumber = /\d/.test(text);
  const hasSpecial = /[^A-Za-z0-9]/.test(text);
  const isLongEnough = text.length >= 8;

  // Combine feedback
  if (!isLongEnough) {
    setPasswordMessage('Password must be at least 8 characters.');
    setPasswordStrength('weak');
  } else if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    setPasswordMessage('Password must include uppercase, lowercase, number, and special character.');
    setPasswordStrength('medium');
  } else {
    setPasswordMessage('Strong password!');
    setPasswordStrength('strong');
  }
};

const validateConfirmPassword = (text) => {
  setConfirmPassword(text);

  if (text.length === 0) {
    setPasswordMatchMessage('');
    setPasswordsMatch(false);
    return;
  }

  if (text !== password) {
    setPasswordMatchMessage("Passwords don't match");
    setPasswordsMatch(false);
  } else {
    setPasswordMatchMessage('Passwords match!');
    setPasswordsMatch(true);
  }
};


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  //added
// const isValidPhoneNumber = (number) => {
//   if (!number) return false;

//   // Remove all non-digits
//   let digits = number.replace(/\D/g, '');

//   // If it starts with "63", strip it
//   if (digits.startsWith('63')) {
//     digits = digits.slice(2);
//   }

//   // If it starts with "0", strip it
//   if (digits.startsWith('0')) {
//     digits = digits.slice(1);
//   }

//   // Must be 10 digits, starting with 9 (PH mobile standard)
//   return /^9\d{9}$/.test(digits);
// };
//added


  const handleRegister = async () => {
    setError('');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

  //   if (!isValidPhoneNumber(phoneNumber)) {
  //   setError('Please enter a valid Philippine phone number (e.g., +639123456789)');
  //   return;
  // }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

//added
    if (password.length < 8) {
    setError('Password must be at least 8 characters');
    return;
  }

  // ✅ Strong password regex: at least one lowercase, one uppercase, one number, one special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    setError('Password must include uppercase, lowercase, number, and special character');
    return;
  }
//added

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    setLoading(true);
  
    try {
      const userData = { firstName, lastName, email, password, userType: 'customer'};
  
      const response = await register(userData);
      
      if (response) {
        console.log("User registered successfully:", response);
        setSuccessMessage('Registration successful! Redirecting to verification...');
        
        // No need to refresh auth state since user is not logged in yet
        
        // Navigate to email verification screen after short delay
        setTimeout(() => {
          navigation.navigate('EmailVerification', { email });
        }, 1500);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      const setNavBarColor = async () => {
        await NavigationBar.setBackgroundColorAsync(theme.background); 
      };
      setNavBarColor();
    }, [theme.background]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header with back button and theme toggle */}
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
                  ? require('../../../assets/images/aqro-dark.png') 
                  : require('../../../assets/images/aqro-light.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.heading}>
              <BoldText style={styles.headingTitle}>Register!</BoldText>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <RegularText style={styles.errorText}>{error}</RegularText>
              </View>
            ) : null}
            
            {successMessage ? (
              <View style={styles.successContainer}>
                <MediumText style={styles.successText}>{successMessage}</MediumText>
              </View>
            ) : null}

            <View style={styles.registerForm}>
              {/* First Name Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <MediumText style={styles.inputLabel}>FIRST NAME</MediumText>
                  <TextInput
                    style={[styles.input, {color: theme.text}]}
                    value={firstName}
                    onChangeText={(text) => validateName(text, 'first')}
                    placeholder="Enter your first name"
                    placeholderTextColor="#9e9e9e"
                  />

              {firstNameError !== '' && (
                    <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>
                      {firstNameError}
                    </Text>
                  )}
                </View>
              </View>

              {/* Last Name Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <MediumText style={styles.inputLabel}>LAST NAME</MediumText>
                  <TextInput
                    style={[styles.input, {color: theme.text}]}
                    value={lastName}
                    onChangeText={(text) => validateName(text, 'last')}
                    placeholder="Enter your last name"
                    placeholderTextColor="#9e9e9e"
                  />
              {/*added*/}
                  {lastNameError !== '' && (
                    <Text style={{ color: 'red', fontSize: 12, marginTop: 5 }}>
                      {lastNameError}
                    </Text>
                  )}

                </View>
              </View>

              {/* Email Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <MediumText style={styles.inputLabel}>EMAIL</MediumText>
                  <TextInput
                    style={[styles.input, {color: theme.text}]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              {/* added */}
              {/* Phone Number Input */}
              {/* <View style={styles.formInput}>
              <View style={styles.inputContainer}>
                <MediumText style={styles.inputLabel}>CONTACT NUMBER (PH)</MediumText>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    const formatted = formatPHPhoneNumber(text);
                    setPhoneNumber(formatted);
                    setError(''); // clear any previous phone error while typing
                  }}
                  placeholder="+63"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  placeholderTextColor="#9e9e9e"
                />
              </View>
            </View> */}


              {/* added */}


              {/* Password Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <MediumText style={styles.inputLabel}>PASSWORD</MediumText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, {color: theme.text}]}
                      value={password}
                      onChangeText={validatePassword}
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
                        color={iconColor} 
                      />
                    </TouchableOpacity>
                  </View>
                  {/* ✅ Real-time password feedback */}
                  {password.length > 0 && (
                    <RegularText
                     style={{
                        marginTop: 5,
                        fontSize: 12,
                        color:
                          passwordStrength === 'strong'
                            ? 'green'
                            : passwordStrength === 'medium'
                            ? 'orange'
                            : 'red',
                      }}
                    >
                      {passwordMessage}
                    </RegularText>
                  )}
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <MediumText style={styles.inputLabel}>CONFIRM PASSWORD</MediumText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, {color: theme.text}]}
                      value={confirmPassword}
                      onChangeText={validateConfirmPassword}
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
                        color={iconColor} 
                      />
                    </TouchableOpacity>
                  </View>
                  {/* Realtime match message */}
                  {passwordMatchMessage !== '' && (
                    <RegularText
                      style={{
                        marginTop: 5,
                        fontSize: 12,
                        color: passwordsMatch ? 'green' : 'red',
                      }}
                    >
                      {passwordMatchMessage}
                    </RegularText>
                  )}
                </View>
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
                <BoldText style={styles.registerButtonText}>SIGN UP</BoldText>
              )}
            </TouchableOpacity>
              
              <View style={styles.loginContainer}>
                <RegularText style={styles.loginText}>Already have an account? </RegularText>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <SemiBoldText style={styles.loginLinkText}>Sign-In!</SemiBoldText>
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
    // zIndex: 10,
    // elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between', 
  },
  backButton: {
    padding: 8,
  },
  themeToggle: {
    marginRight: 10,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  registerSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  logo: {
    width: 250,
    height: 250,
  },
  heading: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 28,
    marginBottom: 8,
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
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  registerForm: {
    marginBottom: 25,
  },
  formInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'Poppins-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    padding: 8,
  },
  actionButtons: {
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#525D13', // Theme green color
    borderRadius: 30,
    paddingVertical: 15,
    width: '80%',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#030f0f',
    fontSize: 24,
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
    color: '#525D13',
  },
loadingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
loadingText: {
  color: '#030f0f',
  fontSize: 20,
  marginLeft: 10,
},
});

export default RegisterScreen;