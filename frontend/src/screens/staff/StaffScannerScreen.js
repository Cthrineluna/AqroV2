import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions  } from 'react-native';
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

const StaffScannerScreen = ({ navigation }) => {
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


  const handleBarCodeScanned = async (result) => {
    const { data, cornerPoints } = result;
    const currentTime = Date.now();
    
    // Only process QR codes within our scan area
    if (!isWithinScanArea(cornerPoints)) {
      return; // Ignore QR codes outside the scan area
    }
    
    // Don't process if we're already handling a scan
    if (
      isProcessing.current || 
      scanned || 
      data === lastScannedCode.current ||
      currentTime - lastScanTime.current < SCAN_COOLDOWN
    ) {
      return;
    }
    
    isProcessing.current = true;
    lastScannedCode.current = data;
    lastScanTime.current = currentTime;

    setScanned(true);
    setScanning(false);
    
    try {
      
      console.log(`QR code scanned with data: ${data}`);
      
      // Your existing QR code processing logic
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
      const resetScanState = () => {
        setScanned(false);
        setScanning(true);
        isProcessing.current = false;
        // Don't reset lastScannedCode to prevent immediate re-scanning of the same code
        // The cooldown timer will still apply
      };
      if (response.status === 200) {
        // Handle different response scenarios
        if (response.data.alreadyRegistered) {
          if (response.data.ownedByCurrentUser) {
            Alert.alert(
              'Already Registered',
              'This container is already registered to your account.',
              [{ text: 'Try Again', onPress: () => {
                resetScanState();
              }}]
            );
          } else {
            Alert.alert(
              'Already Registered',
              'This container is already registered to another user.',
              [{ text: 'Try Again', onPress: () => {
                resetScanState();
              }}]
            );
          }
        } else {
          Alert.alert(
            'Container Registered!',
            'The container has been successfully registered to your account.',
            [{ text: 'OK', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Home' }) }]
          );
        }
      }
    } catch (error) {
      console.error('Error registering container:', error);
      let errorMessage = 'Failed to register container. Please try again.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Registration Error', errorMessage, [
        { text: 'Try Again', onPress: () => {
          resetScanState();
        }},
        { text: 'Cancel', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Home' }) }
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
        <BoldText style={[styles.headerText, { color: theme.text }]}>Staff Scan Container</BoldText>
        <TouchableOpacity 
          style={styles.flashButton} 
          onPress={toggleFlash}
        >
          <Ionicons 
            name={flashEnabled ? "flash" : "flash-off"} 
            size={24} 
            color={isDark ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
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
          Position the QR code within the frame to scan
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