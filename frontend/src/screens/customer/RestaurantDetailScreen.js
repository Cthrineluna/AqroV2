import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  RegularText,
  MediumText,
  BoldText,
  SemiBoldText,
} from '../../components/StyledComponents';
import axios from 'axios';
import { getApiUrl } from '../../services/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const InfoCard = ({ icon, title, value, theme }) => (
  <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
    <View style={[styles.infoCardIcon, { backgroundColor: theme.primary + '20' }]}>
      <Ionicons name={icon} size={24} color={theme.primary} />
    </View>
    <View style={styles.infoCardContent}>
      <RegularText style={[styles.infoCardTitle, { color: theme.text }]}>{title}</RegularText>
      <SemiBoldText style={[styles.infoCardValue, { color: theme.text }]}>{value}</SemiBoldText>
    </View>
  </View>
);

const RestaurantDetailScreen = ({ route, navigation }) => {
  const { restaurantId } = route.params;
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantDetails();
  }, [restaurantId]);

  const fetchRestaurantDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await axios.get(
        `${getApiUrl(`/restaurants/${restaurantId}`)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setRestaurant(response.data);
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (restaurant?.contactNumber) {
      Linking.openURL(`tel:${restaurant.contactNumber}`);
    }
  };

  const handleOpenMaps = () => {
    if (restaurant?.location?.coordinates) {
      const { lat, lng } = restaurant.location.coordinates;
      const url = Platform.select({
        ios: `maps:${lat},${lng}?q=@${lat},${lng}`,
        android: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });
      Linking.openURL(url);
    }
  };

  const handleSocialMediaPress = (platform) => {
    const url = restaurant.socialMedia?.[platform];
    if (url && url.trim() !== '') {
      Linking.openURL(url);
    } else {
      Alert.alert(
        'No Link Available',
        `This restaurant hasn't added their ${platform} link yet.`,
        [{ text: 'OK' }]
      );
    }
  };

  if (loading || !restaurant) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <RegularText style={{ color: theme.text }}>Loading...</RegularText>
        </View>
      </SafeAreaView>
    );
  }

  const formatOperatingHours = () => {
    if (restaurant.operatingHours) {
      return `${restaurant.operatingHours.open} - ${restaurant.operatingHours.close}`;
    }
    return '9:00 AM - 10:00 PM';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image with Gradient Overlay */}
        <View style={styles.bannerContainer}>
          <Image
            source={
              restaurant.banner
                ? { uri: restaurant.banner }
                : require('../../../assets/images/placeholder-bg.jpg')
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.gradientOverlay} />
          
          <View style={styles.bannerContent}>
            <BoldText style={[styles.restaurantName, { color: '#FFFFFF' }]}>
              {restaurant.name}
            </BoldText>
          </View>
        </View>

        {/* Restaurant Info */}
        <View style={[styles.infoContainer, { backgroundColor: theme.background }]}>
          {/* Quick Info Cards */}
          <View style={styles.infoCardsContainer}>
            <InfoCard
              icon="time-outline"
              title="Open Hours"
              value={formatOperatingHours()}
              theme={theme}
            />
          </View>

          {/* Contact & Location */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Contact & Location
            </SemiBoldText>
            
            <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color={theme.primary} />
              <RegularText style={[styles.infoText, { color: theme.text }]}>
                {restaurant.contactNumber}
              </RegularText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoRow} onPress={handleOpenMaps}>
              <Ionicons name="location-outline" size={20} color={theme.primary} />
              <RegularText style={[styles.infoText, { color: theme.text }]}>
                {restaurant.location.address}, {restaurant.location.city}
              </RegularText>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              About
            </SemiBoldText>
            <RegularText style={[styles.description, { color: theme.text }]}>
              {restaurant.description || 'No description available.'}
            </RegularText>
          </View>

          {/* Social Media Links */}
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <SemiBoldText style={[styles.sectionTitle, { color: theme.text }]}>
              Connect With Us
            </SemiBoldText>
            <View style={styles.socialLinks}>
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleSocialMediaPress('facebook')}
              >
                <Ionicons name="logo-facebook" size={24} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleSocialMediaPress('instagram')}
              >
                <Ionicons name="logo-instagram" size={24} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialButton, { backgroundColor: theme.primary + '20' }]}
                onPress={() => handleSocialMediaPress('twitter')}
              >
                <Ionicons name="logo-twitter" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    position: 'relative',
    height: 300,
    marginTop: -StatusBar.currentHeight,
  },
  bannerImage: {
    width: width,
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    position: 'absolute',
    top: StatusBar.currentHeight + 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 2,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  headerRight: {
    width: 40,
  },
  bannerContent: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  restaurantName: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  infoContainer: {
    padding: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -25,
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 12,
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
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RestaurantDetailScreen; 