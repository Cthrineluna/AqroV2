import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/apiConfig';

// Screens
import ReportsScreen from '../screens/shared/ReportsScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminRestaurantsScreen from '../screens/admin/AdminRestaurantsScreen';
import AdminApprovalScreen from '../screens/admin/AdminApprovalScreen';
import AdminContainerScreen from '../screens/admin/AdminContainerScreen';
import SideMenu from '../components/SideMenu';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const EmptyScreen = () => <View style={{ flex: 1 }} />;

const AdminTabNavigator = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  // 🔁 Real-time fetching of pending approvals count every 10s
  const fetchPendingApprovals = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const res = await axios.get(`${getApiUrl()}/restaurants/pending-approvals/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingCount(res.data.count || 0);
    } catch (error) {
      console.log('Error fetching pending approvals:', error.message);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    const interval = setInterval(fetchPendingApprovals, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

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
          tabBarActiveTintColor: isDark ? '#e0e8afff' : '#677324',
          tabBarInactiveTintColor: theme.text + '80',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
              case 'Users': iconName = focused ? 'people' : 'people-outline'; break;
              case 'Cups': iconName = focused ? 'cafe' : 'cafe-outline'; break;
              case 'Coffee Shop': iconName = focused ? 'storefront' : 'storefront-outline'; break;
              case 'Approvals': iconName = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline'; break;
              case 'Menu': iconName = focused ? 'menu' : 'menu-outline'; break;
            }

            // Red dot badge for Approvals
            if (route.name === 'Approvals' && pendingCount > 0) {
              return (
                <View>
                  <Ionicons name={iconName} size={size} color={color} />
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -6,
                      backgroundColor: 'red',
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: 'white',
                    }}
                  />
                </View>
              );
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={ReportsScreen} initialParams={{ isAdminHome: true }} />
        <Tab.Screen name="Users" component={AdminUsersScreen} />
        <Tab.Screen name="Cups" component={AdminContainerScreen} />
        <Tab.Screen name="Coffee Shop" component={AdminRestaurantsScreen} />
        <Tab.Screen name="Approvals" component={AdminApprovalScreen} />
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