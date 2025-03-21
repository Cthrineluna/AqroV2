import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screens
import StaffHomeScreen from '../screens/staff/StaffHomeScreen';
import StaffContainerList from '../screens/staff/StaffContainerList';
import StaffActivityListScreen from '../screens/staff/StaffActivityListScreen';
import StaffScannerScreen from '../screens/staff/StaffScannerScreen';
import ProfileScreen from '../screens/customer/ProfileScreen';
import SettingsScreen from '../screens/customer/SettingsScreen';

// Side Menu
import SideMenu from '../components/SideMenu';

const Tab = createBottomTabNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const StaffTabNavigator = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: 'transparent', 
            height: Platform.OS === 'android' ? 60 : 80,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 0, 
            shadowOpacity: 0, 
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.text + '80', 
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Containers') {
              iconName = focused ? 'logo-dropbox' : 'cube-outline';
            } else if (route.name === 'Scanner') {
              iconName = focused ? 'qr-code' : 'qr-code-outline';
            } else if (route.name === 'Activities') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Menu') {
              iconName = focused ? 'menu' : 'menu-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },    
        })}
      >
        <Tab.Screen name="Home" component={StaffHomeScreen} />
        <Tab.Screen name="Containers" component={StaffContainerList} />
        <Tab.Screen name="Scanner" component={StaffScannerScreen} />
        <Tab.Screen name="Activities" component={StaffActivityListScreen} />
        <Tab.Screen 
          name="Menu" 
          component={EmptyScreen} 
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); 
              toggleMenu();
            },
          }}
        />
      </Tab.Navigator>
      
      {/* Side Menu Modal */}
      <SideMenu 
        key={menuVisible}
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        theme={theme}
        user={user}
      />
    </>
  );
};

export default StaffTabNavigator;