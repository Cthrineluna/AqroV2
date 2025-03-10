import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import NextButtonArrow from './NextButtonArrow';
import { Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Make sure to install @expo/vector-icons if not already

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CenterNextButton = ({ onNextClick, flatListIndex, dataLength, x }) => {
  // Button size animation - expands on the last screen
  const buttonAnimationStyle = useAnimatedStyle(() => {
    // Calculate the current index based on x position
    const currentIndex = Math.round(x.value / SCREEN_WIDTH);
    const isLastScreen = currentIndex === dataLength - 1;
    
    return {
      width: isLastScreen
        ? withSpring(200, { damping: 12, stiffness: 100 })
        : withSpring(60, { damping: 12, stiffness: 100 }),
      height: 60,
    };
  });
  // Arrow icon animation - fades out on the last screen
  const arrowAnimationStyle = useAnimatedStyle(() => {
    const currentIndex = Math.round(x.value / SCREEN_WIDTH);
    const isLastScreen = currentIndex === dataLength - 1;
    
    return {
      opacity: isLastScreen
        ? withTiming(0, { duration: 200 })
        : withTiming(1, { duration: 200 }),
      transform: [{
        translateX: isLastScreen
          ? withTiming(100, { duration: 200 })
          : withTiming(0, { duration: 200 }),
      }],
    };
  });
  
  const textAnimationStyle = useAnimatedStyle(() => {
    const currentIndex = Math.round(x.value / SCREEN_WIDTH);
    const isLastScreen = currentIndex === dataLength - 1;
    
    return {
      opacity: isLastScreen
        ? withTiming(1, { duration: 200 })
        : withTiming(0, { duration: 200 }),
      transform: [{
        translateX: isLastScreen
          ? withTiming(0, { duration: 200 })
          : withTiming(-100, { duration: 200 }),
      }],
    };
  });

  // Button color animation based on the current screen
  const buttonColorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      x.value,
      [0, SCREEN_WIDTH, 2 * SCREEN_WIDTH],
      ['#25AF90', '#2591AF', '#AF7725'], // Match with the textColor in OnboardingScreen
    );

    return {
      backgroundColor,
    };
  });

  // Dots animation
  const renderDots = () => {
    const dots = [];

    for (let i = 0; i < dataLength; i++) {
      const dotStyle = useAnimatedStyle(() => {
        const widthAnimation = interpolate(
          x.value,
          [
            (i - 1) * SCREEN_WIDTH,
            i * SCREEN_WIDTH,
            (i + 1) * SCREEN_WIDTH,
          ],
          [8, 16, 8],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const opacityAnimation = interpolate(
          x.value,
          [
            (i - 1) * SCREEN_WIDTH,
            i * SCREEN_WIDTH,
            (i + 1) * SCREEN_WIDTH,
          ],
          [0.5, 1, 0.5],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Color animation for dots
        const backgroundColor = interpolateColor(
          x.value,
          [0, SCREEN_WIDTH, 2 * SCREEN_WIDTH],
          ['#25AF90', '#2591AF', '#AF7725'],
        );

        const index = Math.round(x.value / SCREEN_WIDTH);
        
        return {
          width: widthAnimation,
          opacity: opacityAnimation,
          backgroundColor: i === index ? backgroundColor : '#939aa3',
        };
      });

      dots.push(
        <Animated.View
          key={i}
          style={[styles.dot, dotStyle]}
        />
      );
    }

    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  return (
    <View style={styles.container}>
      {/* Page indicators moved to bottom left */}
      <View style={styles.dotsWrapper}>
        {renderDots()}
      </View>
      
      {/* Next button moved to bottom right */}
      <TouchableOpacity
        onPress={onNextClick}
        activeOpacity={0.8}
        style={styles.buttonWrapper}
      >
        <Animated.View style={[
          styles.buttonContainer, 
          buttonAnimationStyle, 
          buttonColorStyle
        ]}>
          <Animated.Text style={[styles.buttonText, textAnimationStyle]}>
            Get Started
          </Animated.Text>
          <Animated.View style={arrowAnimationStyle}>
            <NextButtonArrow />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dotsWrapper: {
    alignItems: 'flex-start',
  },
  buttonWrapper: {
    alignItems: 'flex-end',
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25AF90',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25AF90',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    position: 'absolute',
  },
});

export default CenterNextButton;