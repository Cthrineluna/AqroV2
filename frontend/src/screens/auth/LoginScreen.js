import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo or have installed react-native-vector-icons
import { login } from '../../services/authService'; // Keep your existing auth service
import { useAuth } from '../../context/AuthContext'; // Keep your existing auth context
import * as Font from 'expo-font';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    
    // Basic validation
    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);
      console.log('Login response:', response);
      
      // Only refresh auth state if login was successful
      await checkAuthState();
      // Navigate to home screen after successful login
      // navigation.navigate('Home');
    } catch (err) {
      console.error('Login error details:', err);
      
      // Make sure to set a meaningful error message
      if (err.message) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(err);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearLoginFields = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
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
          onPress={() => navigation.navigate('Landing')}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#030f0f" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.loginSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/images/aqro-logo.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.heading}>
              <Text style={styles.headingTitle}>Welcome!</Text>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.loginForm}>
              <View style={styles.formInput}>
                <View style={styles.circularIcon}>
                  <Ionicons name="mail-outline" size={18} color="#030f0f" />
                </View>
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

              <View style={styles.formInput}>
                <View style={styles.circularIcon}>
                  <Ionicons name="lock-closed-outline" size={18} color="#030f0f" />
                </View>
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
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'SIGN IN'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
              
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.signupLinkText}>Sign-Up!</Text>
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
    backgroundColor: '#F0F8FF', // Off-white background
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
  loginSection: {
    flex: 1,
    paddingHorizontal: 30, // Increased padding so content doesn't hug sides
    paddingVertical: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 40, // Add padding around logo
  },
  logo: {
    width: 160,
    height: 160,
  },
  heading: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#030f0f', // Dark theme color
    marginBottom: 8,
  },
  headingSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#030f0f',
    opacity: 0.7,
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
  loginForm: {
    marginBottom: 35,
  },
  formInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  circularIcon: {
    width: 24,
    height: 24,
    borderRadius: 18,
    borderWidth: 0.2, // Thickness of the black outline
    borderColor: 'black', // Color of the outline
    backgroundColor: 'transparent', // No fill color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    padding: 8, // Increased touch target
  },
  actionButtons: {
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#00df82', // Theme green color
    borderRadius: 30, // More rounded button
    paddingVertical: 15,
    width: '80%', // Less wide as requested
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#030f0f',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  forgotPasswordText: {
    color: '#030f0f',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    marginBottom: 30,
    opacity: 0.8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#030f0f',
    opacity: 0.8,
  },
  signupLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#00df82',
  }
});

export default LoginScreen;