// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SplashView from './src/screens/onboarding/SplashView';
import { View, ActivityIndicator, Animated } from 'react-native';
import * as Font from 'expo-font';

// Import these for Android compatibility
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';

const Stack = createStackNavigator();

// Separate component for the main app content
// This allows us to use hooks inside a component that's a child of ThemeProvider
const MainContent = () => {
  // We'll move the onboarding check and splash screen logic here
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);
  const animationController = useState(new Animated.Value(0))[0];

  // Function to check onboarding status
  const checkOnboarding = async () => {
    try {
      const value = await AsyncStorage.getItem('@has_seen_onboarding');
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.log(error);
      setHasSeenOnboarding(false);
    }
  };

  // Show splash screen on app startup
  useEffect(() => {
    // Start animation
    Animated.timing(animationController, {
      toValue: 1,
      duration: 2500, // Adjust duration as needed
      useNativeDriver: false,
    }).start(() => {
      // After splash animation completes, check onboarding and set loading to false
      checkOnboarding();
      setIsLoading(false);
    });
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1 }}>
        <SplashView 
          animationController={animationController} 
          onNextClick={() => {}} 
          isStandalone={true}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding">
            {props => (
              <OnboardingScreen 
                {...props} 
                skipSplash={true} // Indicate to skip the splash screen as we've already shown it
                onComplete={() => {
                  // This will refresh the app state when onboarding completes
                  setHasSeenOnboarding(true);
                }} 
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen 
            name="Main" 
            component={AppNavigator} 
          />
        )}
      </Stack.Navigator>
      <StatusBar translucent backgroundColor="transparent" />
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
        });
        console.log('Fonts loaded successfully!');
        // Set state to re-render your app
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Even if fonts fail to load, we should still show the app
        setFontsLoaded(true);
      }
    }
    
    loadFonts();
  }, []);

  // Show a simple loading indicator while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}