import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig'; 
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText 
} from '../../components/StyledComponents';

const StaffScannerScreen = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const { theme, isDark } = useTheme();
  const [facing, setFacing] = useState('back');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const isProcessing = useRef(false);
  const lastScannedCode = useRef('');
  const lastScanTime = useRef(0);
  const SCAN_COOLDOWN = 3000;
  const { action } = route.params; // 'rebate' or 'return'

  const screenWidth = Dimensions.get('window').width;
  const scanAreaSize = screenWidth * 0.7; 
  
  // Define the scan area bounds
  const scanBounds = {
    x: (screenWidth - scanAreaSize) / 2,
    y: (Dimensions.get('window').height - scanAreaSize) / 2,
    width: scanAreaSize,
    height: scanAreaSize,
  };

  const toggleFlash = () => {
    setFlashEnabled(prev => !prev);
  };

  // Check if the barcode is within our scan area
  const isWithinScanArea = (cornerPoints) => {
    // If cornerPoints is not available, we can't determine position
    if (!cornerPoints || !Array.isArray(cornerPoints) || cornerPoints.length < 4) {
      return false;
    }
    
    // Get the center point of the QR code
    let totalX = 0;
    let totalY = 0;
    
    for (const point of cornerPoints) {
      totalX += point.x;
      totalY += point.y;
    }
    
    const centerX = totalX / cornerPoints.length;
    const centerY = totalY / cornerPoints.length;
    
    // Check if the center point is within our scan area
    return (
      centerX >= scanBounds.x &&
      centerX <= scanBounds.x + scanBounds.width &&
      centerY >= scanBounds.y &&
      centerY <= scanBounds.y + scanBounds.height
    );
  };

  const processRebate = async (qrCode, token) => {
    try {
      // First, get container details by QR code
      const containerResponse = await axios.get(
        `${getApiUrl('/containers/details')}`,
        { 
          params: { qrCode },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      const container = containerResponse.data;
      
      // Comprehensive null checks
      if (!container) {
        throw new Error('Container not found');
      }
      
      // Debug logging
      console.log('Container Details:', JSON.stringify(container, null, 2));
      
      if (!container.customerId) {
        throw new Error('This container is not registered to any customer');
      }
      
      // Check if container status is active
      if (container.status !== 'active') {
        throw new Error('This container is no longer active');
      }
      
      // Ensure required references exist
      if (!container.containerTypeId) {
        throw new Error('Container type information is missing');
      }
      
      // Fetch current user's restaurant
      const profileResponse = await axios.get(
        `${getApiUrl('/users/profile')}`,
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      const currentUser = profileResponse.data;
      
      if (!currentUser.restaurantId) {
        throw new Error('You are not associated with a restaurant');
      }
      
      // Fetch restaurant-specific rebate mappings
      const rebateMappingsResponse = await axios.get(
        `${getApiUrl(`/containers/rebate-mappings/${currentUser.restaurantId}`)}`,
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      // Debug logging for rebate mappings
      console.log('Rebate Mappings:', JSON.stringify(rebateMappingsResponse.data, null, 2));
      
      // Find the rebate mapping for this specific container type
      const rebateMapping = rebateMappingsResponse.data.find(
        mapping => mapping.containerTypeId._id === container.containerTypeId._id
      );
      
      // If no specific rebate mapping found, throw an error
      if (!rebateMapping) {
        throw new Error('No rebate value found for this container type at this restaurant');
      }
      
      const rebateValue = rebateMapping.rebateValue;
      
      // Confirm with user (now including current use count and rebate value)
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Process Rebate',
          `Process rebate of ₱${rebateValue.toFixed(2)} for this container?\n\nCurrent uses: ${container.usesCount}/${container.containerTypeId.maxUses}`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                navigation.navigate('StaffTabs', { screen: 'Home' });
              }
            },
            { 
              text: 'Confirm', 
              onPress: async () => {
                try {
                  // Process the rebate
                  const rebateResponse = await axios.post(
                    `${getApiUrl('/containers/process-rebate')}`,
                    { 
                      containerId: container._id 
                      // Note: amount is now determined server-side based on restaurant-specific mapping
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  
                  resolve(rebateResponse.data);
                } catch (error) {
                  console.error('Rebate Processing Error:', error.response ? error.response.data : error);
                  reject(error);
                }
              } 
            }
          ]
        );
      });
    } catch (error) {
      console.error('Full Rebate Processing Error:', error.response ? error.response.data : error);
      throw error;
    }
  };
  
  const processReturn = async (qrCode, token) => {
    try {
      // First, get container details by QR code
      const containerResponse = await axios.get(
        `${getApiUrl('/containers/details')}`,
        { 
          params: { qrCode },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      const container = containerResponse.data;
      
      // Check if container exists and has a valid customer
      if (!container) {
        throw new Error('Container not found');
      }
      
      if (!container.customerId) {
        throw new Error('This container is not registered to any customer');
      }
      
     if (container.status === 'returned') {
      Alert.alert(
        'Already Returned',
        'This container has already been returned.',
        [{ text: 'OK', onPress: resetScanState }] 
      );
      return null; 
    }

      
      // Check if container status is active
      if (container.status !== 'active') {
        throw new Error('Only containers with "active" status can be returned');
      }
      
      // Confirm with user
      return new Promise((resolve, reject) => {
        Alert.alert(
          'Process Return',
          `Mark this container as returned?`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                navigation.navigate('StaffTabs', { screen: 'Home' });
            }
          },
            { 
              text: 'Confirm', 
              onPress: async () => {
                try {
                  // Process the return
                  const returnResponse = await axios.post(
                    `${getApiUrl('/containers/process-return')}`,
                    { containerId: container._id },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  
                  resolve(returnResponse.data);
                } catch (error) {
                  reject(error);
                }
              } 
            }
          ]
        );
      });
    } catch (error) {
      throw error;
    }
  };

  const resetScanState = () => {
    setScanned(false);
    setScanning(true);
    isProcessing.current = false;
  };
  
  const handleBarCodeScanned = async (result) => {
    const { data, cornerPoints } = result;
    const currentTime = Date.now();
  
    if (!isWithinScanArea(cornerPoints)) return;
    if (isProcessing.current || scanned || data === lastScannedCode.current || currentTime - lastScanTime.current < SCAN_COOLDOWN) {
      return;
    }
  
    isProcessing.current = true;
    lastScannedCode.current = data;
    lastScanTime.current = currentTime;
  
    setScanned(true);
    setScanning(false);
  
    try {
      console.log(`QR code scanned with data: ${data}`);
  
      if (!data.startsWith('AQRO-')) {
        Alert.alert('Invalid QR Code', 'This does not appear to be an aQRo container QR code.', [{ text: 'Try Again', onPress: resetScanState }]);
        return;
      }
  
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please log in again.', [{ text: 'OK', onPress: resetScanState }]);
        return;
      }
  
      if (action === 'rebate') {
        try {
          const result = await processRebate(data, token);
      
          if (result === null) return; 
      
          Alert.alert(
            'Rebate Processed',
            `Rebate of ₱${result.amount.toFixed(2)} has been processed successfully.`,
            [{ text: 'OK', onPress: () => navigation.navigate('StaffTabs', { screen: 'Home' }) }]
          );
        } catch (error) {
          if (error.message === 'Usage Limit Reached') return; 
      
          console.error('Error processing rebate:', error);
          let errorMessage = 'Failed to process rebate. Please try again.';
      
          if (error.response?.status === 404) {
            errorMessage = 'This container does not exist in the system.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
      
          Alert.alert('Rebate Error', errorMessage, [
            { text: 'Try Again', onPress: resetScanState },
            { text: 'Cancel', onPress: () => navigation.navigate('StaffTabs', { screen: 'Home' }) }
          ]);
        }
      }
       else if (action === 'return') {
        try {
          const result = await processReturn(data, token);
      
          if (result === null) return; 
      
          Alert.alert(
            'Return Processed',
            'Container has been successfully marked as returned.',
            [{ text: 'OK', onPress: () => navigation.navigate('StaffTabs', { screen: 'Home' }) }]
          );
        } catch (error) {
          if (error.message === 'This container has already been returned') return;
      
          console.error('Error processing return:', error);
          let errorMessage = 'Failed to process return. Please try again.';
      
          if (error.response?.status === 404) {
            errorMessage = 'This container does not exist in the system.';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
      
          Alert.alert('Return Error', errorMessage, [
            { text: 'Try Again', onPress: resetScanState },
            { text: 'Cancel', onPress: () => navigation.navigate('StaffTabs', { screen: 'Home' }) }
          ]);
        }
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert('Scan Error', 'An unexpected error occurred. Please try again.', [
        { text: 'Try Again', onPress: resetScanState },
        { text: 'Cancel', onPress: () => navigation.navigate('StaffTabs', { screen: 'Home' }) }
      ]);
    } finally {
      isProcessing.current = false;
    }
  };
  

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <RegularText style={{ color: theme.text }}>Loading camera permissions...</RegularText>
      </SafeAreaView>
    );
  }
  
  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <RegularText style={{ color: theme.text, textAlign: 'center', marginBottom: 20 }}>
          We need your permission to use the camera for scanning QR codes
        </RegularText>
        <TouchableOpacity 
          style={styles.scanAgainButton}
          onPress={requestPermission}
        >
          <RegularText style={styles.scanAgainText}>Grant Permission</RegularText>
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
        <BoldText style={[styles.headerText, { color: theme.text }]}>
          {action === 'rebate' ? 'Process Rebate' : 'Process Return'}
        </BoldText>

      </View>
      
      <View style={styles.scannerContainer}>
        {scanning && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            flashMode={flashEnabled ? 'torch' : 'off'}
          />
        )}
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={[styles.focusedContainer, { width: scanAreaSize }]}>
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
        <RegularText style={[styles.instructions, { color: theme.text }]}>
          {action === 'rebate' 
            ? 'Scan container QR code to process rebate'
            : 'Scan container QR code to process return'
          }
        </RegularText>
        
        <View style={styles.buttonRow}>  
          <TouchableOpacity
            style={styles.flipCameraButton}
            onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')}
          >
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
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
  flashButton: {
    position: 'absolute',
    right: 15,
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
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  unfocusedContainer: {
    flex: 1,
  },
  middleContainer: {
    flexDirection: 'row',
    height: 'auto',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusedContainer: {
    aspectRatio: 1, 
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.2)', 
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 60,
    width: 60,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00df82',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 60,
    width: 60,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00df82',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 60,
    width: 60,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00df82',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 60,
    width: 60,
    borderBottomWidth: 4,
    borderRightWidth: 4,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 15,
  },
  scanAgainButton: {
    backgroundColor: '#00df82',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  flipCameraButton: {
    backgroundColor: '#2e7d32',
    padding: 12,
    borderRadius: 25,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StaffScannerScreen;