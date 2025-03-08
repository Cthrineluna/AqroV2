import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Customer screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import ScannerScreen from '../screens/customer/ScannerScreen';

// Staff screens
import StaffDashboardScreen from '../screens/staff/DashboardScreen';

// Admin screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen';

const Stack = createStackNavigator();



const AppNavigator = () => {
  const { userToken, userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }



  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userToken ? (
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