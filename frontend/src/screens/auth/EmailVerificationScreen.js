import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { verifyEmail, resendVerification } from '../../services/authService';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText 
} from '../../components/StyledComponents';
import * as NavigationBar from 'expo-navigation-bar';

const EmailVerificationScreen = ({ navigation, route }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const { user, updateEmailVerification, checkAuthState } = useAuth();
  const { theme, isDark } = useTheme();
  
  const userEmail = route.params?.email || user?.email;

  useEffect(() => {
    const setNavBarColor = async () => {
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(theme.background);
      }
    };
    
    setNavBarColor();
  }, [theme.background]);

  useEffect(() => {
    // Initial message
    setMessage(`We've sent a verification code to ${userEmail}. Please enter it below to verify your email address.`);
  }, [userEmail]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleVerify = async () => {
    setError('');
    setMessage('');
    
    if (!verificationCode) {
      setError('Please enter verification code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyEmail(userEmail, verificationCode);
      
      setMessage('Email verified successfully!');
      updateEmailVerification(true);
      
      // Refresh auth state to reflect verified status
      await checkAuthState();
      
      // Navigate to the appropriate screen after successful verification

    } catch (err) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackPress = () => {
    // If user is logged in but not verified, prevent going back to protected screens
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'EmailVerification' }],
      });
    } else {
      navigation.goBack();
    }
  };
  const handleResendCode = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      await resendVerification(userEmail);
      setMessage(`A new verification code has been sent to ${userEmail}`);
      // Disable resend button for 60 seconds
      setResendDisabled(true);
      setCountdown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          onPress={handleBackPress} 
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.contentContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={isDark 
                ? require('../../../assets/images/aqro-logo-dark.png') 
                : require('../../../assets/images/aqro-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.titleContainer}>
            <BoldText style={styles.title}>Verify Your Email</BoldText>
          </View>
          
          {message ? (
            <View style={styles.messageContainer}>
              <MediumText style={styles.messageText}>{message}</MediumText>
            </View>
          ) : null}
          
          {error ? (
            <View style={styles.errorContainer}>
              <RegularText style={styles.errorText}>{error}</RegularText>
            </View>
          ) : null}
          
          <View style={styles.formContainer}>
            <MediumText style={styles.inputLabel}>VERIFICATION CODE</MediumText>
            <TextInput
              style={[styles.input, {color: theme.text, borderColor: theme.border}]}
              value={verificationCode}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) { 
                  setVerificationCode(text);
                }
              }}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#9e9e9e"
              keyboardType="number-pad"
              maxLength={6}
            />
            
            <TouchableOpacity 
              style={styles.verifyButton}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#030f0f" size="small" />
              ) : (
                <BoldText style={styles.verifyButtonText}>VERIFY</BoldText>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <TouchableOpacity 
                style={[
                  styles.resendButton, 
                  resendDisabled && styles.resendButtonDisabled
                ]}
                onPress={handleResendCode}
                disabled={resendDisabled || isLoading}
              >
                <MediumText style={styles.resendButtonText}>
                  {countdown > 0 ? `Resend code (${countdown}s)` : "Resend verification code"}
                </MediumText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  contentContainer: {
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
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  messageContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00df82',
  },
  messageText: {
    fontSize: 14,
    color: '#424242',
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
  formContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  verifyButton: {
    backgroundColor: '#00df82',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#030f0f',
    fontSize: 18,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#00df82',
    fontSize: 16,
  },
});

export default EmailVerificationScreen;