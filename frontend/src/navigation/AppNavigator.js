import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen.js';
import RegisterScreen from '../screens/auth/RegisterScreen.js';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen.js';

// Customer screens
import CustomerHomeScreen from '../screens/customer/HomeScreen.js';
import ScannerScreen from '../screens/customer/ScannerScreen.js';

// Staff screens
import StaffLoginScreen from '../screens/staff/LoginScreen';
import StaffDashboardScreen from '../screens/staff/DashboardScreen';

// Admin screens
import AdminLoginScreen from '../screens/admin/LoginScreen';
import AdminDashboardScreen from '../screens/admin/DashboardScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const isLoggedIn = false; // Simulate authentication status
  const userType = null; // Possible values: 'customer', 'staff', 'admin'

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : userType === 'customer' ? (
          // Customer screens
          <>
            <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} />
          </>
        ) : userType === 'staff' ? (
          // Staff screens
          <>
            <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
          </>
        ) : (
          // Admin screens
          <>
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
