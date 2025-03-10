import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Dimensions, Image } from 'react-native';
import { useFonts } from 'expo-font';
import { useTheme } from '../../context/ThemeContext';

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
    return null; // Prevent rendering until fonts are loaded
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

  // Theme-aware interpolations
  const backgroundColor = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#25AF90', isDark ? theme.background : 'white'],
  });

  // Text color interpolations based on theme
  const textColorA = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F0F8FF', isDark ? '#F0F8FF' : '#030f0f'], // White to theme-dependent
  });
  
  const textColorQR = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#00df82'], // Always white to green
  });
  
  const textColorO = backgroundAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', isDark ? '#F0F8FF' : '#030f0f'], // White to theme-dependent
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
            <Animated.Text style={[styles.letter, { color: textColorA }]}>a</Animated.Text>
            <Animated.Text style={[styles.letter, { color: textColorQR }]}>qr</Animated.Text>
            <Animated.Text style={[styles.letter, { color: textColorO }]}>o</Animated.Text>
          </Text>
        </Animated.View>

        <Animated.View style={[styles.qrContainer, { opacity: qrOpacity }]}>
          <Image
            source={isDark 
              ? require('../../../assets/images/aqro-logo-dark.png') 
              : require('../../../assets/images/aqro-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
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
    top: '47.5%',
    left:'36.75%', 
  },
  logoText: {
    fontSize: 30,
    fontWeight: '500',
    letterSpacing: 6,
    fontFamily: 'Blanka', // Use the Blanka font here
  },
  qrContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
   
  },
  logo: {
    width: 160,
    height: 160,
  },
});

export default SplashView;