import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

//Shared screens
import SettingsScreen from '../screens/shared/SettingsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

// Customer screens
import CustomerTabNavigator from './CustomerTabNavigator';
import ScannerScreen from '../screens/customer/ScannerScreen';
import SideMenu from '../components/SideMenu';
import ActivityListScreen from '../screens/customer/ActivityListScreen';

// Staff screens
import StaffTabNavigator from './StaffTabNavigator';
import GenerateQRScreen from '../screens/staff/GenerateQRScreen';
import StaffScannerScreen from '../screens/staff/StaffScannerScreen';

// Admin screens
import AdminTabNavigator from './AdminTabNavigator';
import ViewQRScreen from '../screens/admin/ViewQRScreen';



const Stack = createStackNavigator();

const AppNavigator = () => {
  const { userToken, userType, isLoading, user } = useAuth();

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
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        </>
      ) : !user?.isEmailVerified ? (
        // If user is logged in but email is not verified, show verification screen
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      ) : userType === 'customer' ? (
        <>
          <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
          <Stack.Screen name="Activities" component={ActivityListScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="SideMenu" component={SideMenu} />
        </>
      ) : userType === 'staff' ? (
        <>
          <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="StaffScanner" component={StaffScannerScreen} />
          <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
          <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
          <Stack.Screen name="ViewQr" component={ViewQRScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;