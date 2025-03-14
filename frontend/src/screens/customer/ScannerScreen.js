// frontend/src/screens/customer/ScannerScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig'; // Use your API config approach

const ScannerScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const { theme, isDark } = useTheme();
  const [facing, setFacing] = useState('back');

  const handleBarCodeScanned = async (data) => {
    try {
      if (scanned) return;
      
      setScanned(true);
      setScanning(false);
      
      console.log(`QR code scanned with data: ${data}`);
      
      // Verify the QR code format (you can implement your own validation logic)
      if (!data.startsWith('AQRO-')) {
        Alert.alert('Invalid QR Code', 'This does not appear to be an aQRo container QR code.');
        return;
      }
      
      // Get auth token
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }
      
      // Send QR code to backend
      const response = await axios.post(
        `${getApiUrl('/containers/register')}`,
        { qrCode: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 200) {
        Alert.alert(
          'Container Registered!',
          'The container has been successfully registered to your account.',
          [{ text: 'OK', onPress: () => navigation.navigate('CustomerHome') }]
        );
      }
    } catch (error) {
      console.error('Error registering container:', error);
      let errorMessage = 'Failed to register container. Please try again.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Registration Error', errorMessage, [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.navigate('CustomerHome') }
      ]);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Loading camera permissions...</Text>
      </SafeAreaView>
    );
  }
  
  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20 }}>
          We need your permission to use the camera for scanning QR codes
        </Text>
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={requestPermission}
        >
          <Text style={styles.scanAgainText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: theme.text }]}>Scan Container</Text>
      </View>
      
      <View style={styles.scannerContainer}>
        {scanning && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : (result) => handleBarCodeScanned(result.data)}
          />
        )}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {/* Scanner focus area */}
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.instructions, { color: theme.text }]}>
          Position the QR code within the frame to scan
        </Text>
        {scanned && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => {
              setScanned(false);
              setScanning(true);
            }}
          >
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'column',
  },
  unfocusedContainer: {
    flex: 1,
  },
  middleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  focusedContainer: {
    flex: 10,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 40,
    width: 40,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00df82',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 40,
    width: 40,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00df82',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 40,
    width: 40,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#00df82',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 40,
    width: 40,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#00df82',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanAgainButton: {
    backgroundColor: '#00df82',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScannerScreen;