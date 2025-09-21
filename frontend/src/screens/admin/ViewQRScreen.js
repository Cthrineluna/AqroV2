import React from 'react';
import { View, StyleSheet, Image, SafeAreaView } from 'react-native';
import { BoldText } from '../../components/StyledComponents';
import { useTheme } from '../../context/ThemeContext';
import { getApiUrl } from '../../services/apiConfig'; // Add this import

const ViewQRScreen = ({ route }) => {
  const { theme } = useTheme();
  const { qrCode } = route.params;
  
  // Get the base URL of your API
  const baseUrl = getApiUrl('').replace('/api', '');
  const qrCodeUrl = `${baseUrl}/qr-codes/${qrCode}.png`; 
  console.log('QR Code URL:', qrCodeUrl);
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <BoldText style={[styles.title, { color: theme.text }]}>
          Cup QR Code
        </BoldText>
        <Image 
  source={{ uri: qrCodeUrl }} 
  style={styles.qrCode} 
  resizeMode="contain"
  onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
/>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
  qrCode: {
    width: 300,
    height: 300,
  },
});

export default ViewQRScreen;