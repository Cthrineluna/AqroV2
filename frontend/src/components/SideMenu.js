import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Dimensions, 
  Modal, 
  Platform,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { 
    RegularText, 
    MediumText, 
    BoldText, 
    SemiBoldText 
  } from './StyledComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.85;

const SideMenu = ({ visible, onClose, theme, user }) => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isDarkMode = theme.background === '#121212' || theme.isDark;

// In SideMenu.js



useEffect(() => {
  if (visible) {
    // Pre-calculate the end position to avoid layout calculations during animation
    const endPosition = width - MENU_WIDTH;
    
    // Reset the initial position before animating
    slideAnim.setValue(width);
    fadeAnim.setValue(0);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: endPosition,
        duration: 300,
        useNativeDriver: true, // Ensure this is true
      }),
      Animated.timing(fadeAnim, {
        toValue: isDarkMode ? 0.7 : 0.5,
        duration: 300,
        useNativeDriver: true, // Ensure this is true
      }),
    ]).start();
  } else {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [visible, isDarkMode, slideAnim, fadeAnim, width]);

  const navigateTo = (screen) => {
    if (!screen || typeof screen !== "string") {
      console.error("Invalid screen name:", screen);
      return;
    }
    onClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 300);
  };
  
  

  const handleLogout = () => {
    onClose();
    setTimeout(() => {
      logout();
    }, 300);
  };
  const isStaffOrAdmin = user?.userType === 'staff' || user?.userType === 'admin';

  const navigateToReports = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate('Reports', { userType: user?.userType });
    }, 300);
  };
 // Add this useEffect to SideMenu.js
useEffect(() => {
    // This will ensure the component re-renders when the user data changes
    if (user) {
      console.log('SideMenu received updated user data:', user.profilePicture ? 'Has profile picture' : 'No profile picture');
    }
  }, [user]);

  const renderProfileImage = () => {
    if (user?.profilePicture) {
      return (
        <Image
          source={{ uri: user.profilePicture }}
          style={styles.profileImage}
          onError={(e) => {
            console.log("Image loading error:", e.nativeEvent.error);
            // Fallback to placeholder on error
            setImageFailed(true);
          }}
        />
      );
    } else {
      return (
        <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="person" size={40} color={theme.primary} />
        </View>
      );
    }
  };
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Background Overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                backgroundColor: 'rgb(0, 0, 0)', 
                opacity: fadeAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Menu Content */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: theme.background,
              borderRightColor: theme.border,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slideAnim }]
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          {/* Profile Section */}
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => navigateTo('Profile')}
          >
            {renderProfileImage()}
            <View style={styles.profileTextContainer}>
              <BoldText style={[styles.profileName, { color: theme.text }]}>
                {user?.firstName || ''} {user?.lastName || ''}
              </BoldText>
              <RegularText style={{ color: theme.text + '80' }}>
                {user?.email || ''}
              </RegularText>
              <MediumText style={{ color: theme.primary, marginTop: 4 }}>View Profile</MediumText>
            </View>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={theme.text} />
              <MediumText style={[styles.menuItemText, { color: theme.text }]}>Settings & Privacy</MediumText>
            </TouchableOpacity>
            {isStaffOrAdmin && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={navigateToReports}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.text} />
              <MediumText style={[styles.menuItemText, { color: theme.text }]}>
                Reports
              </MediumText>
            </TouchableOpacity>
          )}

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={theme.error || '#ff4d4d'} />
              <MediumText style={[styles.menuItemText, { color: theme.error || '#ff4d4d' }]}>
                Logout
              </MediumText>
            </TouchableOpacity>
          </View>
          <View style={styles.footer}>
            <RegularText style={{ color: theme.text + '60', fontSize: 12 }}>
              App Version 1.0.0
            </RegularText>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MENU_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 15,
  },
  menuItems: {
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 40,
    left: 20,
  },
});

export default SideMenu;