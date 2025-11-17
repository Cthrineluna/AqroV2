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
import { requestPasswordReset } from '../../services/authService';
import RNChatWidget from "../../components/RNChatWidget";

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handlePasswordReset = async () => {
    // Simple email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await requestPasswordReset(email);
      
      // Navigate to reset password screen
      navigation.navigate('ResetPassword', { email });
      
      // Show info alert
      Alert.alert(
        'Reset Email Sent',
        'If an account with this email exists, you will receive a code to reset your password. Please check your email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      // Don't expose if email exists or not for security
      console.error('Error requesting password reset:', error);
      // Still show success message for security (don't reveal if email exists)
      navigation.navigate('ResetPassword', { email });
      
      Alert.alert(
        'Reset Email Sent',
        'If an account with this email exists, you will receive a code to reset your password. Please check your email.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              Forgot Password
            </SemiBoldText>
          </View>

          <ThemedView style={[styles.contentContainer, {height: keyboardVisible ? 'auto' : null}]}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open-outline" size={60} color={theme.primary} />
            </View>
            
            <MediumText style={[styles.subtitle, { color: theme.text }]}>
              Reset Your Password
            </MediumText>
            
            <RegularText style={[styles.description, { color: theme.text }]}>
              Enter your email address and we'll send you instructions to reset your password.
            </RegularText>

            <View style={[styles.inputContainer, { borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.text} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email Address"
                placeholderTextColor="#9e9e9e"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
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
              onPress={handlePasswordReset}
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
    <RNChatWidget isLoggedIn={false} />
    </>
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

export default ForgotPasswordScreen;