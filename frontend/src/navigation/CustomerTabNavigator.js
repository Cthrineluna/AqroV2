import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Screens
import CustomerHomeScreen from '../screens/customer/CustomerHomeScreen';
import ContainersList from '../screens/customer/ContainersList';
import ActivityListScreen from '../screens/customer/ActivityListScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

// Side Menu
import SideMenu from '../components/SideMenu';

const Tab = createBottomTabNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const CustomerTabNavigator = () => {
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
            } else if (route.name === 'Activities') {
              iconName = focused ? 'newspaper' : 'newspaper-outline';
            } else if (route.name === 'Menu') {
              iconName = focused ? 'menu' : 'menu-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },    
        })}
      >
        <Tab.Screen name="Home" component={CustomerHomeScreen} />
        <Tab.Screen name="Containers" component={ContainersList} />
        <Tab.Screen name="Activities" component={ActivityListScreen} />
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

export default CustomerTabNavigator;