import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { 
  BoldText, 
  RegularText, 
} from '../components/StyledComponents';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RenderItem = ({ 
  index, 
  x, 
  item, 
  isWeb, 
  isIOS, 
  screenHeight,
  useTransparentBackground = false 
}) => {
  // Animation reference
  const animationRef = useRef(null);

  // Function to restart animation (needs to run on JS thread)
  const restartAnimation = () => {
    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  };
  
  // Use Reanimated's useAnimatedReaction to detect when this slide becomes active
  useAnimatedReaction(
    () => {
      return Math.round(x.value / SCREEN_WIDTH);
    },
    (currentIndex, previousIndex) => {
      // Only restart if this slide just became active
      if (currentIndex === index && previousIndex !== index) {
        runOnJS(restartAnimation)();
      }
    },
    [index] // Dependencies array
  );

  // Animation for the content sliding in
  const contentAnimationStyle = useAnimatedStyle(() => {
    const translateYAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [200, 0, -200],
      Extrapolation.CLAMP,
    );

    const opacityAnimation = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity: opacityAnimation,
      transform: [{ translateY: translateYAnimation }],
    };
  });

  // Adjust styles based on platform and settings
  const getContainerStyle = () => {
    // Use transparent background when specified
    const backgroundColor = useTransparentBackground ? 'transparent' : item.backgroundColor;
    
    const baseStyle = [
      styles.container, 
      { width: SCREEN_WIDTH, backgroundColor }
    ];
    
    if (isWeb) {
      return [...baseStyle, styles.webContainer];
    }
    
    if (isIOS) {
      return [...baseStyle, styles.iosContainer];
    }
    
    return baseStyle;
  };

  // Initial play when component mounts
  useEffect(() => {
    // Check if this is the initial active slide
    if (Math.round(x.value / SCREEN_WIDTH) === index && animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  return (
    <View style={getContainerStyle()}>
      <View style={styles.contentWrapper}>
        {/* Lottie Animation */}
        <Animated.View style={[styles.animationContainer, contentAnimationStyle]}>
          <LottieView
            ref={animationRef}
            source={item.animationSource}
            style={styles.lottieAnimation}
            autoPlay={false} // Change to false so we control playback manually
            loop={true}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text Content */}
        <Animated.View style={[styles.textContainer, contentAnimationStyle]}>
          <BoldText style={[styles.title, { color: item.textColor }]}>
            {item.title}
          </BoldText>
          <RegularText style={styles.description}>
            {item.description}
          </RegularText>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center to flex-start
    alignItems: 'center',
  },
  webContainer: {
    height: '100%',
    minHeight: 500,
  },
  iosContainer: {
    paddingTop: 20,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    // Move content up
    paddingTop: 80, // Add space below the header
    justifyContent: 'flex-start', // Changed from center to flex-start
    alignItems: 'center',
  },
  animationContainer: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 280,
    height: 280,
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6F7F89',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RenderItem;