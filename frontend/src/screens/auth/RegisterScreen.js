// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { register } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkAuthState } = useAuth();
  const [successMessage, setSuccessMessage] = useState('');


  const handleRegister = async () => {
    setError('');
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
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
  
    setLoading(true);
  
    try {
      const userData = { firstName, lastName, email, password, userType: 'customer' };
  
      const response = await register(userData);
      setLoading(false);
  
      if (response) {
        console.log("User registered successfully:", response);
  
        // ✅ Show success message on UI
        setSuccessMessage("Registration successful! Redirecting to login...");
  
        // ✅ Automatically navigate to Login after 2 seconds
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
  
  

  return (

    
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>aQRo</Text>
        <Text style={styles.tagline}>Reusable Containers for a Better Future</Text>
      </View>

      <View style={styles.formContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {successMessage ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}
      
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        )}

        <View style={styles.optionsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.optionText}>Already have an account? Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

      

    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  tagline: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#2e7d32',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  optionText: {
    color: '#2e7d32',
    fontSize: 16,
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: 'bold',
  },  
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  loader: {
    marginVertical: 15,
  },
});

export default RegisterScreen;