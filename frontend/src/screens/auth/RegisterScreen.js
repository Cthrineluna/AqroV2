import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

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
  
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async () => {
    setError('');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
  
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    setLoading(true);
  
    try {
      const userData = { firstName, lastName, email, password, userType: 'customer' };
  
      const response = await register(userData);
      setLoading(false);
  
      if (response) {
        console.log("User registered successfully:", response);
  
        // Show success message on UI
        setSuccessMessage("Registration successful! Redirecting to login...");
  
        // Automatically navigate to Login after 2 seconds
        setTimeout(() => {
          navigation.replace('Login'); // `replace` prevents going back to Register screen
        }, 2000);
        
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f8f8f5" barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#030f0f" />
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
                source={require('../../../assets/images/aqro-logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.heading}>
              <Text style={styles.headingTitle}>Register!</Text>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.registerForm}>
              {/* First Name Input */}
              <View style={styles.formInput}>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your first name"
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              {/* Last Name Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your last name"
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9e9e9e"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>PASSWORD</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#9e9e9e"
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={togglePasswordVisibility}
                    >
                      <Ionicons 
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={18} 
                        color="#030f0f" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.formInput}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      secureTextEntry={!showConfirmPassword}
                      placeholderTextColor="#9e9e9e"
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle} 
                      onPress={toggleConfirmPasswordVisibility}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                        size={18} 
                        color="#030f0f" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Registering...' : 'SIGN UP'}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLinkText}>Sign-In!</Text>
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
    backgroundColor: '#F0F8FF', // Off-white background to match login screen
  },
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 50 : 60,
    backgroundColor: '#F0F8FF',
    zIndex: 10,
    elevation: 2,
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
    width: 180,
    height: 180,
  },
  heading: {
    marginBottom: 30,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#030f0f',
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
    fontFamily: 'Poppins-Regular',
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
    fontFamily: 'Poppins-Medium',
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
    fontFamily: 'Poppins-Medium',
    color: '#030f0f',
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#030f0f',
    paddingVertical: 8,
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
    backgroundColor: '#00df82', // Theme green color
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
    fontFamily: 'Poppins-Bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#030f0f',
    opacity: 0.8,
  },
  loginLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#00df82',
  }
});

export default RegisterScreen;