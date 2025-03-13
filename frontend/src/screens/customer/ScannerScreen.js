// frontend/src/screens/customer/ScannerScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import * as Clipboard from 'expo-clipboard';

// Conditionally import BarCodeScanner
let BarCodeScanner;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  // BarCodeScanner not available
}

const ScannerScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [mockQRCode, setMockQRCode] = useState('AQRO-123456');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  
  // Determine if we're on iOS Expo Go where barcode scanner won't work
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const useNativeScanner = BarCodeScanner && (!isIOS || isWeb);

  useEffect(() => {
    if (useNativeScanner) {
      (async () => {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.log('Error requesting camera permissions:', error);
          setHasPermission(false);
        }
      })();
    }
  }, [useNativeScanner]);

  const handleBarCodeScanned = async ({ type, data }) => {
    try {
      setScanned(true);
      setScanning(false);
      
      console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
      processQRCode(data);
    } catch (error) {
      console.error('Error in scanning:', error);
    }
  };

  const processQRCode = async (data) => {
    try {
      // Verify the QR code format
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

  const handleMockSubmit = () => {
    processQRCode(mockQRCode);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setMockQRCode(text);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  if (useNativeScanner) {
    if (hasPermission === null) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.text, textAlign: 'center', margin: 20 }}>
            Requesting camera permission...
          </Text>
        </SafeAreaView>
      );
    }
    if (hasPermission === false) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.text, textAlign: 'center', margin: 20 }}>
            No access to camera. Please enable camera permissions.
          </Text>
        </SafeAreaView>
      );
    }
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
        <Text style={[styles.headerText, { color: theme.text }]}>
          {useNativeScanner ? 'Scan Container' : 'Manual Scanner'}
        </Text>
      </View>
      
      {useNativeScanner ? (
        // Real Scanner for Web and Android
        <View style={styles.scannerContainer}>
          {scanning && (
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer}></View>
              <View style={styles.focusedContainer}>
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
      ) : (
        // Mock Scanner for iOS Expo Go
        <View style={styles.mockScannerContainer}>
          <View style={[styles.mockScanner, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.mockText, { color: theme.text }]}>
              {isIOS ? 'Camera Scanner Not Available in iOS Expo Go' : 'Camera Not Available'}
            </Text>
            <Ionicons name="qr-code" size={100} color={isDark ? '#555' : '#ddd'} style={styles.qrIcon} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Enter a mock QR code for testing:
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#444' : '#fff',
                  color: theme.text,
                  borderColor: isDark ? '#555' : '#ddd'
                }]}
                value={mockQRCode}
                onChangeText={setMockQRCode}
                placeholder="AQRO-123456"
                placeholderTextColor={isDark ? '#aaa' : '#999'}
              />
              <TouchableOpacity style={styles.pasteButton} onPress={pasteFromClipboard}>
                <Ionicons name="clipboard-outline" size={24} color="#00df82" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.footer}>
        {useNativeScanner ? (
          <>
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
          </>
        ) : (
          <>
            <Text style={[styles.instructions, { color: theme.text }]}>
              {isIOS ? 
                'This is a manual entry mode for iOS Expo Go development.' : 
                'Camera is not available. Use manual entry instead.'}
            </Text>
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleMockSubmit}
            >
              <Text style={styles.scanAgainText}>Process QR Code</Text>
            </TouchableOpacity>
          </>
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
  mockScannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mockScanner: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mockText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrIcon: {
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  pasteButton: {
    position: 'absolute',
    right: 12,
    top: 9,
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