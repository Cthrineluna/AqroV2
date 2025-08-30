// OnboardingScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolateColor,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import SplashView from './SplashView';
import TopBackSkipView from '../../components/TopBackSkipView';
import CenterNextButton from '../../components/CenterNextButton';
import RenderItem from '../../components/RenderItem';
import * as NavigationBar from 'expo-navigation-bar';
import { useDerivedValue } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define onboarding data with different background colors
const onboardingData = [
  {
    id: 1,
    title: 'Scan with aQRo',
    description: 'Scan, save, and make a difference with our simple QR code solution. Join our community in making sustainable choices easier.',
    backgroundColor: '#F6D18F', // Light green
    textColor: '#543310',
    mediaType: 'image',
    imageSource: require('../../../assets/images/scan.png'),
  },
  {
    id: 2,
    title: 'Save With aQRo',
    description: 'Save time, money, and resources with our innovative QR system. Track your savings and see the impact of your sustainable choices.',
    backgroundColor: '#F3DAAD', // Light blue
    textColor: '#543310',
    mediaType: 'image',
    imageSource: require('../../../assets/images/save.png'),
  },
  {
    id: 3,
    title: 'Sustain With aQRo',
    description: 'Join our mission to create a cleaner planet. Reusable containers have never been easier or more rewarding. Start making a difference today!',
    backgroundColor: '#EBC684', // Light orange/brown
    textColor: '#543310',
    mediaType: 'image',
    imageSource: require('../../../assets/images/sustain.png'),
  },
];

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

// Function for linear interpolation between colors
const lerpColor = (colorA, colorB, t) => {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  
  const r = Math.round(rgbA.r + (rgbB.r - rgbA.r) * t);
  const g = Math.round(rgbA.g + (rgbB.g - rgbA.g) * t);
  const b = Math.round(rgbA.b + (rgbB.b - rgbA.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
};

const OnboardingScreen = ({ navigation, onComplete, skipSplash = false }) => {
  const { theme, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const x = useSharedValue(0);
  const flatListIndex = useSharedValue(0);
  const scrollDirection = useSharedValue(0);

  // Handle platform-specific layout adjustments
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  
  // Create derived value for navigation bar color
  const navBarColor = useDerivedValue(() => {
    // Get current position and calculate the progress between pages
    const position = x.value / SCREEN_WIDTH;
    const currentIndex = Math.floor(position);
    const nextIndex = Math.min(currentIndex + 1, onboardingData.length - 1);
    const progress = position - currentIndex;
    
    // Get colors for interpolation
    const currentColor = onboardingData[currentIndex]?.backgroundColor || '#FFFFFF';
    const nextColor = onboardingData[nextIndex]?.backgroundColor || '#FFFFFF';
    
    // Return interpolated color
    return { currentColor, nextColor, progress };
  });
  
  // Effect to update navigation bar color based on scroll position
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Update navigation bar color when navBarColor changes
      const updateNavBarColor = async () => {
        const { currentColor, nextColor, progress } = navBarColor.value;
        const interpolatedColor = lerpColor(currentColor, nextColor, progress);
        await NavigationBar.setBackgroundColorAsync(interpolatedColor);
      };
      
      // Create a frame-based update for smooth transitions
      const interval = setInterval(updateNavBarColor, 16); // ~60fps
      return () => clearInterval(interval);
    }
  }, [navBarColor]);
  
  // Initialize navbar color on mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      const initNavBarColor = async () => {
        await NavigationBar.setBackgroundColorAsync(onboardingData[0].backgroundColor);
      };
      initNavBarColor();
    }
  }, []);

  // Create an animated background style using interpolateColor
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    // Create input and output arrays for color interpolation
    const inputRange = onboardingData.map((_, index) => index * SCREEN_WIDTH);
    const outputRange = onboardingData.map((item) => item.backgroundColor);
    
    const backgroundColor = interpolateColor(
      x.value,
      inputRange,
      outputRange
    );
    
    return {
      backgroundColor,
    };
  });
  
  // Get current page text color
  const getCurrentPageColor = () => {
    const index = Math.min(Math.max(Math.round(activeIndex), 0), onboardingData.length - 1);
    return onboardingData[index].textColor;
  };

  const finishOnboarding = async () => {
    try {
      // Set navigation bar color to match Landing screen before navigating
      if (Platform.OS === 'android') {
        await NavigationBar.setBackgroundColorAsync(theme.background);
        
        // Add a small delay to ensure the color change completes
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
      console.log('Onboarding completed, token saved');
      if (onComplete) {
        console.log('Calling onComplete callback');
        onComplete();
      } else {
        // If no onComplete callback, navigate directly
        navigation.navigate('Landing');
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const onNextClick = () => {
    if (showSplash) {
      setShowSplash(false);
      return;
    }
    
    if (flatListIndex.value < onboardingData.length - 1) {
      scrollDirection.value = 1; // Going right
      const nextIndex = flatListIndex.value + 1;
      setActiveIndex(nextIndex);
      
      // Ensure smooth scrolling to the correct page
      flatListRef.current?.scrollToOffset({ 
        offset: nextIndex * SCREEN_WIDTH,
        animated: true 
      });
      
      // Force update flatListIndex in case the scroll event doesn't trigger properly
      setTimeout(() => {
        flatListIndex.value = nextIndex;
      }, 100);
      
    } else {
      finishOnboarding();
    }
  };

  const onBackClick = () => {
    if (flatListIndex.value > 0) {
      scrollDirection.value = -1; // Going left
      const prevIndex = flatListIndex.value - 1;
      setActiveIndex(prevIndex);
      
      flatListRef.current?.scrollToOffset({ 
        offset: prevIndex * SCREEN_WIDTH, 
        animated: true 
      });
      
      // Force update flatListIndex in case the scroll event doesn't trigger properly
      setTimeout(() => {
        flatListIndex.value = prevIndex;
      }, 100);
      
    } else if (!skipSplash) {
      setShowSplash(true);
    }
  };

  const onSkipClick = async () => {
    console.log('Skip button clicked');
    
    // Update navigation bar color before navigating
    if (Platform.OS === 'android') {
      await NavigationBar.setBackgroundColorAsync(theme.background);
      
      // Add a small delay to ensure the color change completes
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    finishOnboarding();
  };

  // Improved scroll handler
  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      // Track direction
      if (event.contentOffset.x > x.value) {
        scrollDirection.value = 1; // Going right
      } else if (event.contentOffset.x < x.value) {
        scrollDirection.value = -1; // Going left
      }
      
      x.value = event.contentOffset.x;
      
      // Update index during scrolling for smoother transitions
      flatListIndex.value = event.contentOffset.x / SCREEN_WIDTH;
    },
    onMomentumEnd: event => {
      const index = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      flatListIndex.value = index;
    },
  });
  
  // Update the active index for UI color changes
  useEffect(() => {
    const updateIndex = () => {
      const newIndex = Math.round(flatListIndex.value);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    };
    
    const interval = setInterval(updateIndex, 100);
    return () => clearInterval(interval);
  }, [flatListIndex.value, activeIndex]);

  // Cleanup when leaving the screen
  useEffect(() => {
    return () => {
      if (Platform.OS === 'android') {
        // Set navigation bar color to match landing screen when unmounting
        NavigationBar.setBackgroundColorAsync(theme.background);
      }
    };
  }, [theme.background]);

  // Manually ensure FlatList is properly sized for web
  useEffect(() => {
    if (isWeb) {
      const timer = setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isWeb]);

  if (showSplash) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <SplashView onNextClick={onNextClick} />
      </SafeAreaView>
    );
  }

  const textColor = getCurrentPageColor();

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        
        <TopBackSkipView
          onBackClick={onBackClick}
          onSkipClick={onSkipClick}
          flatListIndex={flatListIndex}
          dataLength={onboardingData.length}
          x={x}
          color={textColor}
        />

        <Animated.FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={({ item, index }) => (
            <RenderItem 
              item={item} 
              index={index} 
              x={x} 
              isWeb={isWeb}
              isIOS={isIOS}
              screenHeight={SCREEN_HEIGHT}
              // Pass a flag to disable individual background colors in items
              useTransparentBackground={true}
            />
          )}
          keyExtractor={item => item.id.toString()}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={SCREEN_WIDTH}
          decelerationRate="fast"
          snapToAlignment="center"
          contentContainerStyle={styles.flatListContent}
        />
        
        <CenterNextButton
          onNextClick={onNextClick}
          flatListIndex={flatListIndex}
          dataLength={onboardingData.length}
          x={x}
          color={textColor}
        />
      </SafeAreaView>
    </Animated.View>
  );
};


    
  

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flatListContent: {
    // Adjust to move content higher
    paddingTop: 0,
  },
});

export default OnboardingScreen;