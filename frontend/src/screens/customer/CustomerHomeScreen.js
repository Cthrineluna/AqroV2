// src/screens/customer/DashboardScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const CustomerHomeScreen = ({ navigation }) => {
  const dashboardItems = [
    { 
      title: 'My Containers', 
      screen: 'MyContainers',
      icon: '🥡'
    },
    { 
      title: 'Scan QR Code', 
      screen: 'QRScanner',
      icon: '📱'
    },
    { 
      title: 'Rewards', 
      screen: 'Rewards',
      icon: '🏆'
    },
    { 
      title: 'Participating Pansiterias', 
      screen: 'PansiteriaList',
      icon: '🍽️'
    },
    { 
      title: 'Environmental Impact', 
      screen: 'EnvironmentalImpact',
      icon: '🌍'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Customer!</Text>
      
      <ScrollView contentContainerStyle={styles.dashboardGrid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.dashboardItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.dashboardItemIcon}>{item.icon}</Text>
            <Text style={styles.dashboardItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  dashboardItem: {
    width: '45%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  dashboardItemIcon: {
    fontSize: 50,
    marginBottom: 10
  },
  dashboardItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default CustomerHomeScreen;