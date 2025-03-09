// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import SplashView from './src/screens/onboarding/SplashView';
import { View, ActivityIndicator, Animated } from 'react-native';
import * as Font from 'expo-font';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);
  const animationController = useState(new Animated.Value(0))[0];
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
        });
        console.log('Fonts loaded successfully!');
        // Set state to re-render your app
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    }
    
    loadFonts();

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
    <AuthProvider>
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
      </NavigationContainer>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}