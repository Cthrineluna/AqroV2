import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';



export const RegularText = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[
        styles.regular, 
        { color: theme.text },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};


export const MediumText = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[
        styles.medium, 
        { color: theme.text },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const SemiBoldText = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[
        styles.semiBold, 
        { color: theme.text },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

export const BoldText = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <Text 
      style={[
        styles.bold, 
        { color: theme.text },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Styled container components
export const ThemedView = ({ style, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        { backgroundColor: theme.background },
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

// Styled button components
export const PrimaryButton = ({ style, textStyle, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.primaryButton,
        { backgroundColor: theme.primary },
        style
      ]} 
      {...props}
    >
      <BoldText style={[styles.buttonText, textStyle]}>
        {children}
      </BoldText>
    </TouchableOpacity>
  );
};

export const SecondaryButton = ({ style, textStyle, children, ...props }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.secondaryButton,
        { 
          borderColor: theme.text,
          backgroundColor: 'transparent' 
        },
        style
      ]} 
      {...props}
    >
      <BoldText style={[styles.buttonText, textStyle]}>
        {children}
      </BoldText>
    </TouchableOpacity>
  );
};

// Theme toggle component
export const ThemeToggle = ({ style }) => {
  const { isDark, toggleTheme, theme } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[
        styles.themeToggle, 
        { 
          backgroundColor: theme.secondary,
          borderColor: theme.border,
          borderWidth: 1,
        },
        style
      ]} 
      onPress={() => {
        console.log('Toggle theme pressed');
        toggleTheme();
      }}
      activeOpacity={0.7}
    >
      <BoldText style={{ color: theme.text }}>
        {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </BoldText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  regular: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  medium: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  semiBold: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  bold: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 24,
  },
  themeToggle: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});