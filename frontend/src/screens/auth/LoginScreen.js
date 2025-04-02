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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext'; 
import { useTheme } from '../../context/ThemeContext';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  ThemedView, 
  SemiBoldText
} from '../../components/StyledComponents';
import AndroidStatusBar from '../../components/AndroidStatusBar';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuthState } = useAuth();
  const { theme, isDark } = useTheme();
  const iconColor = isDark ? '#00df82' : theme.text;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

 // LoginScreen.js
const handleLogin = async () => {
  setError('');
  
  if (!email.trim() || !password) {
    setError('Please enter both email and password');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError('Please enter a valid email address');
    return;
  }

  setLoading(true);

  try {
    const response = await login(email, password);
    console.log('Login successful, user data:', response.user);
    
    // Check if email is verified - now properly checking the response
    if (response.user && !response.user.isEmailVerified) {
      navigation.navigate('EmailVerification', { email: response.user.email });
      return;
    }
    
    // Only refresh auth state if login was successful and email is verified
    await checkAuthState();
  } catch (err) {
    console.error('Login error details:', err);
    
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

  useEffect(() => {
    const setNavBarColor = async () => {
      await NavigationBar.setBackgroundColorAsync(theme.background); 
    };
    setNavBarColor();
  }, [theme.background]);

<AndroidStatusBar color={theme.background} />
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      {/* Header with back button */}
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
          <View style={styles.loginSection}>
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
              <BoldText style={styles.headingTitle}>Welcome!</BoldText>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <RegularText style={styles.errorText}>{error}</RegularText>
              </View>
            ) : null}

            <View style={styles.loginForm}>
            <View style={styles.formInput}>
              <Ionicons 
                name="mail-outline" 
                size={18} 
                color={isDark ? '#00df82' : theme.text} 
                style={styles.inputIcon}
              />
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

            <View style={styles.formInput}>
              <Ionicons 
                name="lock-closed-outline" 
                size={18} 
                color={isDark ? '#00df82' : theme.text} 
                style={styles.inputIcon}
              />
              <View style={styles.inputContainer}>
                <MediumText style={styles.inputLabel}>PASSWORD</MediumText>
                <View style={styles.passwordContainer}>
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
                      color={isDark ? '#00df82' : theme.text} 
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
                <BoldText style={styles.loginButtonText}>
                  {loading ? 'Logging in...' : 'SIGN IN'}
                </BoldText>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <RegularText style={styles.forgotPasswordText}>Forgot password?</RegularText>
              </TouchableOpacity>
              
              <View style={styles.signupContainer}>
                <RegularText style={styles.signupText}>Don't have an account? </RegularText>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <SemiBoldText style={styles.signupLinkText}>Sign-Up!</SemiBoldText>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add this line
    // zIndex: 10,
    // elevation: 2,
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
    marginBottom: Platform.OS === 'ios' ? 40 : 10,
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
  inputIcon: {
    marginRight: 12,
    marginBottom: 40, 
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
    fontFamily: 'Poppins-Regular',
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
  },
  forgotPasswordText: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    opacity: 0.8,
  },
  signupLinkText: {
    fontSize: 16,
    color: '#00df82',
  }
});

export default LoginScreen;