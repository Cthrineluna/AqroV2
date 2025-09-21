import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TextInput } from 'react-native-gesture-handler';
import { 
  SemiBoldText, 
  RegularText, 
  MediumText, 
  ThemedView 
} from '../../components/StyledComponents';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';

const { width } = Dimensions.get('window');

const ResetPasswordScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { email } = route.params || {};
  
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Listen for keyboard events to prevent layout thrashing
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const validateInputs = () => {
    // Reset any previous errors
    setError('');

    // Check if all fields are filled
    if (!resetToken.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required');
      return false;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check password length (minimum 6 characters)
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }


    return true;
  };

  const handleResetPassword = async () => {
    if (!validateInputs()) return;
    
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${getApiUrl()}/auth/reset-password`,
        { email, token: resetToken, newPassword }
      );
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now log in with your new password.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
      
    } catch (error) {
      console.error('Error resetting password:', error);
      
      if (error.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else if (error.request) {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to reset password. Please try again.');
      }
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          bounces={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <SemiBoldText style={[styles.title, { color: theme.text }]}>
              Reset Password
            </SemiBoldText>
          </View>

          <ThemedView style={[styles.contentContainer, {height: keyboardVisible ? 'auto' : null}]}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={60} color={theme.primary} />
            </View>
            
            <MediumText style={[styles.subtitle, { color: theme.text }]}>
              Create New Password
            </MediumText>
            
            <RegularText style={[styles.description, { color: theme.text }]}>
              Enter the code sent to your email and create a new password
            </RegularText>

            {/* Reset Code Input */}
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="key-outline" size={20} color={theme.text} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Reset Code"
                placeholderTextColor="#9e9e9e"
                value={resetToken}
                onChangeText={setResetToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* New Password Input */}
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="New Password"
                placeholderTextColor="#9e9e9e"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons 
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.text} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Confirm Password"
                placeholderTextColor="#9e9e9e"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.text} 
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <RegularText style={styles.errorText}>
                {error}
              </RegularText>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                loading && { opacity: 0.7 }
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <SemiBoldText style={styles.buttonText}>
                  Reset Password
                </SemiBoldText>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              <RegularText style={{ color: theme.primary }}>
                Remember your password? Login
              </RegularText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    marginLeft: 15,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 50,
  },
  subtitle: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: width * 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 20,
    padding: 10,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;