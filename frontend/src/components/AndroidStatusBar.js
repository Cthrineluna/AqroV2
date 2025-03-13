// src/components/AndroidStatusBar.js
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { NavigationBar } from 'expo-navigation-bar';

const AndroidStatusBar = ({ color, translucent = false, lightContent = false }) => {
  const { theme, isDark } = useTheme();
  const backgroundColor = color || theme.background;
  const barStyle = lightContent ? 'light-content' : isDark ? 'light-content' : 'dark-content';

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Set navigation bar color (bottom gesture bar)
      NavigationBar.setBackgroundColorAsync(backgroundColor);
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [backgroundColor, isDark]);

  return (
    <StatusBar
      backgroundColor={translucent ? 'transparent' : backgroundColor}
      barStyle={barStyle}
      translucent={translucent}
    />
  );
};

export default AndroidStatusBar;