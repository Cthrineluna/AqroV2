import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminContainerScreen from '../screens/admin/AdminContainerScreen';
import StaffActivityListScreen from '../screens/staff/StaffActivityListScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import ViewQRScreen from '../screens/admin/ViewQRScreen';
// Side Menu
import SideMenu from '../components/SideMenu';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;


const AdminTabNavigator = () => {
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
            } else if (route.name === 'Users') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Containers') {
              iconName = focused ? 'logo-dropbox' : 'cube-outline';
            } else if (route.name === 'Activities') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Menu') {
              iconName = focused ? 'menu' : 'menu-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },    
        })}
      >
        <Tab.Screen name="Home" component={AdminHomeScreen} />
        <Tab.Screen name="Users" component={AdminUsersScreen} />
        <Tab.Screen 
          name="Containers" 
          component={AdminContainerScreen} 
        />
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

export default AdminTabNavigator;