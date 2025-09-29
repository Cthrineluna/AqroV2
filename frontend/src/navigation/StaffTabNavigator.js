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
import ProductsScreen from '../screens/staff/ProductsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

// Side Menu
import SideMenu from '../components/SideMenu';

const Tab = createBottomTabNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const StaffTabNavigator = () => {
  const { theme,isDark } = useTheme();
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
            backgroundColor: isDark ? '#677324' : '#BBC191', 
            borderTopColor: 'transparent', 
            height: Platform.OS === 'android' ? 60 : 80,
            paddingBottom: 10,
            paddingTop: 10,
            elevation: 0, 
            shadowOpacity: 0, 
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: isDark ?  '#e0e8afff':'#677324', 
          tabBarInactiveTintColor: theme.text + '80', 
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cups') {
              iconName = focused ? 'cafe' : 'cafe-outline';
            } else if (route.name === 'Scanner') {
              iconName = focused ? 'qr-code' : 'qr-code-outline';
        } else if (route.name === 'Products') {
          iconName = focused ? 'pricetag' : 'pricetag-outline';
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
        <Tab.Screen name="Cups" component={StaffContainerList} />
        <Tab.Screen 
          name="Scanner" 
          component={StaffScannerScreen} 
          initialParams={{ action: 'rebate' }} 
        />
        <Tab.Screen name="Products" component={ProductsScreen} />

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