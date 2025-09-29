import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Dimensions, Image, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { useTheme } from '../../context/ThemeContext';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const SplashView = ({ onNextClick }) => {
  const { theme, isDark } = useTheme();
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const qrAnimation = useRef(new Animated.Value(0)).current;
  const backgroundAnimation = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Blanka: require('../../../assets/fonts/Blanka-Regular.otf'),
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#25AF90'); 
    }
  }, []);
  

  useEffect(() => {
    if (Platform.OS === 'android') {
      const animationListener = backgroundAnimation.addListener(({ value }) => {

        const startColor = hexToRgb('#936541');
        const endColor = hexToRgb(isDark ? theme.background : '#F0F8FF');
        
        const r = Math.round(startColor.r + (endColor.r - startColor.r) * value);
        const g = Math.round(startColor.g + (endColor.g - startColor.g) * value);
        const b = Math.round(startColor.b + (endColor.b - startColor.b) * value);
        
        const interpolatedColor = `rgb(${r}, ${g}, ${b})`;
        NavigationBar.setBackgroundColorAsync(interpolatedColor);
      });
      
      return () => {
        backgroundAnimation.removeListener(animationListener);
      };
    }
  }, [backgroundAnimation, theme, isDark]);
  
  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(backgroundAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(qrAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(() => {
        onNextClick();
      }, 1200);
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; 
  }

  const logoScale = logoAnimation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.3, 1.05, 1],
  });

  const logoOpacity = logoAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.5, 1],
  });

  const fadeLogoOpacity = qrAnimation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [1, 0, 0],
  });

  const qrOpacity = qrAnimation.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });


  const backgroundColor = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#936541', isDark ? theme.background : '#F0F8FF'],
  });


  const textColorA = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1f3118', isDark ? '#F0F8FF' : '#030f0f'], // White to theme-dependent
  });
  
  const textColorQR = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffffff', '#1f3118'], // Always white to green
  });
  
  const textColorO = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1f3118', isDark ? '#F0F8FF' : '#030f0f'], // White to theme-dependent
  });
  
  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <View style={styles.contentContainer}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: Animated.multiply(logoOpacity, fadeLogoOpacity),
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Text style={styles.logoText}>
            <Animated.Text style={[styles.letter, { color: textColorA }]}>A</Animated.Text>
            <Animated.Text style={[styles.letter, { color: textColorQR }]}>QR</Animated.Text>
            <Animated.Text style={[styles.letter, { color: textColorO }]}>O</Animated.Text>
          </Text>
        </Animated.View>

        <Animated.View style={[styles.qrContainer, { opacity: qrOpacity }]}>
          <Image
            source={isDark 
              ? require('../../../assets/images/aqro-dark.png') 
              : require('../../../assets/images/aqro-light.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// Helper function to convert hex color to RGB object
const hexToRgb = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  
  return { r, g, b };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
  },
  logoText: {
    fontSize: 35,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'Arial',
    includeFontPadding: false,  // Force no extra padding (Android-only)
    textAlignVertical: 'center' // Ensure vertical alignment
  },
  qrContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 80,
  },
});

export default SplashView;