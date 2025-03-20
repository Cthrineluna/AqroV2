import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Customer screens
import CustomerTabNavigator from './CustomerTabNavigator';
import ScannerScreen from '../screens/customer/ScannerScreen';
import SettingsScreen from '../screens/customer/SettingsScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SideMenu from '../components/SideMenu';

// Staff screens
import StaffDashboardScreen from '../screens/staff/DashboardScreen';
import GenerateQRScreen from '../screens/staff/GenerateQRScreen';

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : userType === 'customer' ? (
        <>
          <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="SideMenu" component={SideMenu} />
        </>
      ) : userType === 'staff' ? (
        <>
          <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
          <Stack.Screen name="StaffDashboard" component={StaffDashboardScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;