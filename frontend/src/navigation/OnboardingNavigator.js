import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import LandingScreen from '../screens/auth/LandingScreen';
import RNChatWidget from "../components/RNChatWidget"; 

const Stack = createStackNavigator();

const OnboardingNavigator = () => {
  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Landing" component={LandingScreen} />
      </Stack.Navigator>
      <RNChatWidget isLoggedIn={false} />
    </>
  );
};

export default OnboardingNavigator;
