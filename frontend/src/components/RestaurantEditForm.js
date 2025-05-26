import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  RegularText,
  MediumText,
  BoldText,
  SemiBoldText,
} from './StyledComponents';
import { getApiUrl } from '../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const RestaurantEditForm = ({ restaurant, onUpdate }) => {
  const { theme } = useTheme();
  const [operatingHours, setOperatingHours] = useState({
    open: restaurant.operatingHours?.open || '9:00 AM',
    close: restaurant.operatingHours?.close || '10:00 PM',
  });
  const [socialMedia, setSocialMedia] = useState({
    facebook: restaurant.socialMedia?.facebook || '',
    instagram: restaurant.socialMedia?.instagram || '',
    twitter: restaurant.socialMedia?.twitter || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('aqro_token');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await axios.put(
        `${getApiUrl(`/restaurants/${restaurant._id}`)}`,
        {
          operatingHours,
          socialMedia,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
          Operating Hours
        </SemiBoldText>
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInput}>
            <RegularText style={[styles.label, { color: theme.text }]}>Open</RegularText>
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => {
                // TODO: Implement time picker
              }}
            >
              <RegularText style={[styles.timeText, { color: theme.text }]}>
                {operatingHours.open}
              </RegularText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.timeInput}>
            <RegularText style={[styles.label, { color: theme.text }]}>Close</RegularText>
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: theme.primary + '20' }]}
              onPress={() => {
                // TODO: Implement time picker
              }}
            >
              <RegularText style={[styles.timeText, { color: theme.text }]}>
                {operatingHours.close}
              </RegularText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
          Social Media Links
        </SemiBoldText>
        
        <View style={styles.socialInput}>
          <Ionicons name="logo-facebook" size={24} color={theme.primary} />
          <RegularText style={[styles.socialText, { color: theme.text }]}>
            {socialMedia.facebook || 'Add Facebook link'}
          </RegularText>
        </View>
        
        <View style={styles.socialInput}>
          <Ionicons name="logo-instagram" size={24} color={theme.primary} />
          <RegularText style={[styles.socialText, { color: theme.text }]}>
            {socialMedia.instagram || 'Add Instagram link'}
          </RegularText>
        </View>
        
        <View style={styles.socialInput}>
          <Ionicons name="logo-twitter" size={24} color={theme.primary} />
          <RegularText style={[styles.socialText, { color: theme.text }]}>
            {socialMedia.twitter || 'Add Twitter link'}
          </RegularText>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
        disabled={loading}
      >
        <SemiBoldText style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </SemiBoldText>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  timeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  socialText: {
    marginLeft: 12,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default RestaurantEditForm; 