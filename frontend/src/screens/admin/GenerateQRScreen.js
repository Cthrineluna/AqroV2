// frontend/src/screens/staff/GenerateQRScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import { 
  RegularText, 
  BoldText, 
  SemiBoldText, 
  PrimaryButton 
} from '../../components/StyledComponents';

const GenerateQRScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [containerTypes, setContainerTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  
  useEffect(() => {
    fetchContainerTypes();
    fetchRestaurants();
  }, []);
  
  const fetchContainerTypes = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(
        `${getApiUrl('/containers/container-types')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContainerTypes(response.data);
      if (response.data.length > 0) {
        setSelectedType(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching container types:', error);
      Alert.alert('Error', 'Failed to load container types');
    }
  };
  const fetchRestaurants = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(
        `${getApiUrl('/containers/restaurants')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurants(response.data);
      if (response.data.length > 0) {
        setSelectedRestaurant(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    }
  };
  
  const generateQRCode = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.post(
        `${getApiUrl('/containers/generate')}`,
        { 
          containerTypeId: selectedType,
          restaurantId: selectedRestaurant 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get the base URL of your API
      const baseUrl = getApiUrl('').replace('/api', '');
      setQrCodeUrl(`${baseUrl}${response.data.qrCodeUrl}`);
      
      Alert.alert('Success', 'Container QR code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <BoldText style={[styles.title, { color: theme.text }]}>
          Generate Container QR Code
        </BoldText>
        <View style={styles.formSection}>
          <SemiBoldText style={[styles.label, { color: theme.text }]}>
            Restaurant
          </SemiBoldText>
          
          <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
            <Picker
              selectedValue={selectedRestaurant}
              onValueChange={(itemValue) => setSelectedRestaurant(itemValue)}
              style={[styles.picker, { color: theme.text }]}
            >
              {restaurants.map((restaurant) => (
                <Picker.Item 
                  key={restaurant._id} 
                  label={restaurant.name} 
                  value={restaurant._id} 
                />
              ))}
            </Picker>
          </View>
        </View>
        <View style={styles.formSection}>
          <SemiBoldText style={[styles.label, { color: theme.text }]}>
            Container Type
          </SemiBoldText>
          
          <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => setSelectedType(itemValue)}
              style={[styles.picker, { color: theme.text }]}
            >
              {containerTypes.map((type) => (
                <Picker.Item 
                  key={type._id} 
                  label={type.name} 
                  value={type._id} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Generate QR Button */}
        <PrimaryButton 
          style={styles.generateButton} 
          onPress={generateQRCode} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : 'Generate QR Code'}
        </PrimaryButton>

        {/* Display QR Code if available */}
        {qrCodeUrl ? (
          <View style={styles.qrCodeContainer}>
            <Image 
              source={{ uri: qrCodeUrl }} 
              style={styles.qrCode} 
              resizeMode="contain" 
            />
            <RegularText style={{ color: theme.text }}>
              Scan this QR Code to use the container
            </RegularText>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  generateButton: {
    width: '100%',
    marginTop: 20,
  },
  qrCodeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
});

export default GenerateQRScreen;
