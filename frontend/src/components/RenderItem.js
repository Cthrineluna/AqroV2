import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Image } from 'react-native';
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
  // Determine media type
  const hasImage = !!item?.imageSource || item?.mediaType === 'image';
  const hasAnimation = !!item?.animationSource && !hasImage; // image takes precedence if both are set

  // Animation reference (only used for Lottie)
  const animationRef = useRef(null);

  // Function to restart animation (needs to run on JS thread)
  const restartAnimation = () => {
    if (hasAnimation && animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  };
  
  // Detect when this slide becomes active and (if Lottie) restart animation
  useAnimatedReaction(
    () => Math.round(x.value / SCREEN_WIDTH),
    (currentIndex, previousIndex) => {
      if (hasAnimation && currentIndex === index && previousIndex !== index) {
        runOnJS(restartAnimation)();
      }
    },
    [index, hasAnimation]
  );

  // Slide-in / fade animation for content
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
    const backgroundColor = useTransparentBackground ? 'transparent' : item.backgroundColor;
    const baseStyle = [
      styles.container, 
      { width: SCREEN_WIDTH, backgroundColor }
    ];
    if (isWeb) return [...baseStyle, styles.webContainer];
    if (isIOS) return [...baseStyle, styles.iosContainer];
    return baseStyle;
  };

  // Initial play when component mounts (only for Lottie)
  useEffect(() => {
    if (hasAnimation && Math.round(x.value / SCREEN_WIDTH) === index && animationRef.current) {
      animationRef.current.play();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={getContainerStyle()}>
      <View style={styles.contentWrapper}>
        {/* Media */}
        <Animated.View style={[styles.mediaContainer, contentAnimationStyle]}>
          {hasImage ? (
            <Image
              source={item.imageSource}
              resizeMode="contain"
              style={[
                styles.media,
                { height: Math.min(600, screenHeight * 0.38) },
              ]}
              accessible
              accessibilityLabel={item.title}
            />
          ) : hasAnimation ? (
            <LottieView
              ref={animationRef}
              source={item.animationSource}
              style={[
                styles.media,
                { height: Math.min(320, screenHeight * 0.35) },
              ]}
              autoPlay={false} // control playback manually
              loop
              resizeMode="contain"
            />
          ) : null}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  webContainer: {
    height: '100%',
    minHeight: 1000,
  },
  iosContainer: {
    paddingTop: 20,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 80,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  media: {
    width: 500,
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
    color: '#151515b1',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RenderItem;

