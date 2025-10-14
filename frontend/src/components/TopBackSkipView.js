import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const TopBackSkipView = ({
  onBackClick,
  onSkipClick,
  flatListIndex,
  dataLength,
  x,
  color = '#677324',
}) => {
  // Animation for the back button visibility (without color transition)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      flatListIndex.value,
      [0, 0.1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
    };
  });

  // Animation for the skip button visibility (without color transition)
  const skipAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      flatListIndex.value,
      [dataLength - 1, dataLength - 0.9],
      [0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: 1 - opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backContainer, backAnimatedStyle]}>
        <TouchableOpacity onPress={onBackClick}>
          <Ionicons name="chevron-back" size={24} color={color} />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View style={[styles.skipContainer, skipAnimatedStyle]}>
        <TouchableOpacity onPress={onSkipClick}>
          <Text style={[styles.skipText, { color }]}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Reduced from 40 to fix the iOS positioning issue
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, // Ensure it's above other content
  },
  backContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  skipContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TopBackSkipView;