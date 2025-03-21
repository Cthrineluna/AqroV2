import React from 'react';
import { View, Animated, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RegularText, BoldText } from './StyledComponents';

const { width, height } = Dimensions.get('window');

const ActivityDetailModal = ({ activity, animation, closeModal }) => {
  const { theme } = useTheme();
  if (!activity) return null;

  const getActivityInfo = (type) => {
    switch (type) {
      case 'registration': return { icon: 'add-circle-outline', color: '#4CAF50', title: 'Container Registered' };
      case 'return': return { icon: 'repeat-outline', color: '#2196F3', title: 'Container Returned' };
      case 'rebate': return { icon: 'cash-outline', color: '#FF9800', title: 'Rebate Received' };
      case 'status_change': return { icon: 'sync-outline', color: '#9C27B0', title: 'Status Changed' };
      default: return { icon: 'ellipsis-horizontal-outline', color: '#757575', title: 'Activity' };
    }
  };

  const info = getActivityInfo(activity.type);
  return (
    <Animated.View style={[styles.modalContainer, { opacity: animation }]}>
      <View style={styles.modalHeader}>
        <BoldText style={{ fontSize: 20, color: theme.text }}>Activity Details</BoldText>
        <TouchableOpacity onPress={closeModal}>
          <Ionicons name="close-circle-outline" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.modalBody}>
        <View style={[styles.activityIcon, { backgroundColor: info.color }]}>
          <Ionicons name={info.icon} size={24} color="#fff" />
        </View>
        <BoldText style={{ fontSize: 24, color: theme.text }}>{info.title}</BoldText>
        <RegularText style={{ color: theme.text }}>Date: {new Date(activity.createdAt).toLocaleDateString()}</RegularText>
        <RegularText style={{ color: theme.text }}>Time: {new Date(activity.createdAt).toLocaleTimeString()}</RegularText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: { position: 'absolute', top: '50%', left: '50%', width: width * 0.85, marginLeft: -(width * 0.85) / 2, transform: [{ translateY: -height * 0.3 }], maxHeight: height * 0.75, borderRadius: 16, zIndex: 11, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalBody: { padding: 20, alignItems: 'center' },
  activityIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginVertical: 8 }
});

export default ActivityDetailModal;
