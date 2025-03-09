import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

//for debugging, clear storage
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    alert('Storage cleared!');
  } catch (e) {
    alert('Failed to clear storage');
  }
};

//

const { width, height } = Dimensions.get('window');

const LandingScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f8f8f5" barStyle="dark-content" />
      
      
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/images/aqro-logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>
        
        {/* Main Heading */}
        <View style={styles.contentContainer}>
        <View style={styles.headingContainer}>
          <Text style={styles.mainHeading}>Scan. Save. Sustain.</Text>
          <Text style={styles.subHeading}>Every scan leads to savings and sustainability</Text>
        </View>
        
      
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInText}>SIGN IN</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signUpButton} 
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signUpText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        {/* for debugging, clearing storage */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Button title="Clear Storage" onPress={clearStorage} />
        </View>
        
        {/* Bottom Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Join thousands of users making a difference with AQRO reusable containers
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logo: {
    width: 240,
    height: 240,
  },
  headingContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  mainHeading: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#030f0f',
    textAlign: 'center',
    marginBottom: 2,
  },
  subHeading: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#030f0f',
    opacity: 0.7,
    textAlign: 'center',
  },
  illustrationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: height * 0.25,
    width: width * 0.8,
  },
  scanCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 223, 130, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 223, 130, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  decorativeLeaf1: {
    position: 'absolute',
    top: 20,
    right: 50,
  },
  decorativeLeaf2: {
    position: 'absolute',
    bottom: 30,
    left: 60,
  },
  decorativeRecycle: {
    position: 'absolute',
    top: 50,
    left: 40,
  },
  buttonContainer: {
    width: '90%',
    marginTop: height * 0.05,
  },
  signInButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#030f0f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  signInText: {
    color: '#030f0f',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  signUpButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00df82',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpText: {
    color: '#030f0f',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#030f0f',
    opacity: 0.6,
    textAlign: 'center',
  },
});

export default LandingScreen;