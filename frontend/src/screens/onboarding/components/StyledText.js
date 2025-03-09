// components/StyledText.js
import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const RegularText = ({ style, children, ...props }) => (
  <Text style={[styles.regular, style]} {...props}>{children}</Text>
);

export const BoldText = ({ style, children, ...props }) => (
  <Text style={[styles.bold, style]} {...props}>{children}</Text>
);

export const SemiBoldText = ({ style, children, ...props }) => (
  <Text style={[styles.semiBold, style]} {...props}>{children}</Text>
);

const styles = StyleSheet.create({
  regular: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  bold: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
  },
  semiBold: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});