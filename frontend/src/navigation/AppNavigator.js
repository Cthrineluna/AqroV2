import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RetailRegisterScreen from '../screens/auth/RetailerRegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen'; // Add this import

// Shared screens
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
        // Unauthenticated flow
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="RetailRegister" component={RetailRegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        </>
      ) : !user?.isEmailVerified ? (
        // Email verification pending
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        </>
      ) : userType === 'staff' && !user?.isApproved ? (
        // Staff-specific: Approved pending
        <>
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : userType === 'customer' ? (
        // Customer flow
        <>
          <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
          <Stack.Screen name="Activities" component={ActivityListScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="SideMenu" component={SideMenu} />
        </>
      ) : userType === 'staff' ? (
        // Approved staff flow
        <>
          <Stack.Screen name="StaffTabs" component={StaffTabNavigator} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="StaffScanner" component={StaffScannerScreen} />
          <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
        </>
      ) : (
        // Admin flow
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