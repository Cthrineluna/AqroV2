import React from 'react';
import { StyleSheet, View, Text, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

const RecycleView = () => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Replace with your actual recycle image */}
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>Recycle Image</Text>
        </View>
      </View>
      <View style={styles.textContainer}>
        <Animated.View>
          <Text style={styles.title}>Sustain With aQRo</Text>
          <Text style={styles.description}>
            Join our mission to create a cleaner planet. 
            Reusable containers have never been easier or more rewarding.
            Start making a difference today!
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height: '100%',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    paddingHorizontal: 20,
    paddingTop: 60, // Add top padding to avoid content being hidden by navigation elements
    paddingBottom: 100, // Add bottom padding to avoid content being hidden by next button
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#E0F2EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#25AF90',
    fontSize: 18,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#25AF90',
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

export default RecycleView;