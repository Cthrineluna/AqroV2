import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme, Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define your theme colors
export const lightTheme = {
  background: '#F2ECE1', // Alice Blue
  text: '#030f0f',       // Black-ish
  primary: '#5A3E29',    // Green
  secondary: '#677324',  // White
  card: '#ffffff',
  border: 'rgba(3, 15, 15, 0.1)',
  input: '#ffffff',
  danger: '#ff4444',     // Red for danger/warning
};

export const darkTheme = {
  background: '#1F1C19', // Dark roasted beans with a hint of charcoal
  text: '#F5E9DA',       // Creamy beige for strong readability
  primary: '#B07B4C',    // Caramel latte accent
  secondary: '#D8B26E',  // Honey-golden for highlights
  card: '#2A2622',       // Soft mocha, lighter than background
  border: 'rgba(245, 233, 218, 0.12)', // Creamy low-opacity borders
  input: '#2A2622',      // Same as card for uniformity
  danger: '#E45C5C',     // Warm muted red that fits the palette
};

// Create context
export const ThemeContext = createContext(null);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get the current device color scheme
  const deviceColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceColorScheme === 'dark');
  const [followSystem, setFollowSystem] = useState(true);
  
  // Function to save theme preference to AsyncStorage
  const saveThemePreference = async (darkMode, system) => {
    try {
      await AsyncStorage.setItem('themePreference', darkMode ? 'dark' : 'light');
      await AsyncStorage.setItem('followSystem', system.toString());
      console.log(`Saved theme: ${darkMode ? 'dark' : 'light'}, Follow system: ${system}`);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };
  
  // Load user's saved theme preference when app starts
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        const savedFollowSystem = await AsyncStorage.getItem('followSystem');
        
        // Handle follow system preference
        if (savedFollowSystem !== null) {
          const shouldFollowSystem = savedFollowSystem === 'true';
          setFollowSystem(shouldFollowSystem);
          
          if (shouldFollowSystem) {
            // If following system, use device theme
            setIsDark(deviceColorScheme === 'dark');
          } else if (savedTheme !== null) {
            // Otherwise use saved theme
            setIsDark(savedTheme === 'dark');
          }
        } else {
          // Default to following system if no preference is saved
          setIsDark(deviceColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
        // Default to system theme if there's an error
        setIsDark(deviceColorScheme === 'dark');
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Listen for system theme changes
  useEffect(() => {
    if (followSystem) {
      setIsDark(deviceColorScheme === 'dark');
    }
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (followSystem) {
        console.log('System theme changed to:', colorScheme);
        setIsDark(colorScheme === 'dark');
      }
    });
    
    return () => {
      // Clean up listener when component unmounts
      subscription.remove();
    };
  }, [followSystem, deviceColorScheme]);
  
  // Toggle theme function
  const toggleTheme = async () => {
    // Toggle the theme
    const newIsDark = !isDark;
    console.log('Toggling theme to:', newIsDark ? 'dark' : 'light');
    
    // Update state
    setIsDark(newIsDark);
    setFollowSystem(false);
    
    // Save preferences
    saveThemePreference(newIsDark, false);
  };
  
  // Function to set system theme following preference
  const setFollowSystemPreference = async (value) => {
    console.log('Setting follow system to:', value);
    setFollowSystem(value);
    
    if (value) {
      // If following system, update theme to match current device theme
      const currentSystemTheme = Appearance.getColorScheme();
      console.log('Current system theme:', currentSystemTheme);
      setIsDark(currentSystemTheme === 'dark');
      
      // Save preferences
      saveThemePreference(currentSystemTheme === 'dark', true);
    } else {
      // If not following system, keep current theme but update preference
      saveThemePreference(isDark, false);
    }
  };
  
  // Create the context value with the current theme and functions
  const theme = isDark ? darkTheme : lightTheme;
  const contextValue = {
    theme,
    isDark,
    toggleTheme,
    followSystem,
    setFollowSystem: setFollowSystemPreference,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};