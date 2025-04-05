import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  TouchableOpacity, 
  Linking, 
  Animated,
  ScrollView,
  Text,
  Platform,
  StatusBar
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  RegularText, 
  MediumText, 
  BoldText, 
  SemiBoldText,
  ThemedView,
  PrimaryButton,
  ThemeToggle
} from '../../components/StyledComponents';
import { Ionicons } from '@expo/vector-icons';

const PendingApprovalScreen = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [countdown, setCountdown] = useState(48);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    // Animate the content when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    // Simulate countdown timer (in a real app this would be based on actual remaining time)
    const timer = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevCount - 1;
      });
    }, 3600000); // Update every hour

    return () => clearInterval(timer);
  }, []);

  const handleContactSupport = () => {
    Linking.openURL('mailto:aqroapp@gmail.com');
  };

  const toggleFAQ = () => {
    setExpanded(!expanded);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
         <View style={{ flexDirection: 'row' }}>
                   <Text style={[styles.headerLetter, { color: theme.text }]}>A</Text>
                   <Text style={[styles.headerLetter, { color: theme.primary }]}>Q</Text>
                   <Text style={[styles.headerLetter, { color: theme.primary }]}>R</Text>
                   <Text style={[styles.headerLetter, { color: theme.text }]}>O</Text>
                 </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.primary} />
            <RegularText style={[styles.logoutText, { color: theme.primary }]}>Logout</RegularText>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View 
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
                <Ionicons name="time-outline" size={35} color="white" />
              </View>
            </View>
            
            <BoldText style={styles.title}>Approval Pending</BoldText>
            
            <ThemedView style={styles.card}>
              <MediumText style={styles.message}>
                Thank you for verifying your email:
              </MediumText>
              
              <SemiBoldText style={[styles.email, { color: theme.primary }]}>
                {user?.email || 'user@example.com'}
              </SemiBoldText>
              
              <MediumText style={styles.message}>
                Your staff account registration is under review by our administration team.
              </MediumText>
              
              <View style={styles.timeContainer}>
                <Ionicons name="alarm-outline" size={18} color={theme.primary} />
                <MediumText style={[styles.timeText, { color: theme.primary }]}>
                  Estimated time: {countdown} hours remaining
                </MediumText>
              </View>
              
              <MediumText style={styles.message}>
                You'll receive an email notification once your account has been approved or rejected.
                Until then, you won't be able to access any staff features.
              </MediumText>
            </ThemedView>
            
            <TouchableOpacity style={styles.faqHeader} onPress={toggleFAQ}>
              <SemiBoldText style={{ fontSize: 18 }}>Frequently Asked Questions</SemiBoldText>
              <Ionicons 
                name={expanded ? "chevron-up-outline" : "chevron-down-outline"} 
                size={24} 
                color={theme.text} 
              />
            </TouchableOpacity>
            
            {expanded && (
              <ThemedView style={styles.faqContainer}>
                <View style={styles.faqItem}>
                  <SemiBoldText style={[styles.faqQuestion, {color: theme.primary}]}>How long does approval take?</SemiBoldText>
                  <RegularText style={styles.faqAnswer}>Typically 24-48 hours during business days.</RegularText>
                </View>
                
                <View style={styles.faqItem}>
                  <SemiBoldText style={[styles.faqQuestion, {color: theme.primary}]}>What if my approval is taking longer?</SemiBoldText>
                  <RegularText style={styles.faqAnswer}>Contact support if it's been more than 48 hours.</RegularText>
                </View>
                
                <View style={styles.faqItem}>
                  <SemiBoldText style={[styles.faqQuestion, {color: theme.primary}]}>Can I expedite the process?</SemiBoldText>
                  <RegularText style={styles.faqAnswer}>For urgent approvals, please contact our email.</RegularText>
                </View>
              </ThemedView>
            )}
            
            <PrimaryButton 
              style={styles.contactButton}
              textStyle={{ fontSize: 16 }}
              onPress={handleContactSupport}
            >
              Contact Support
            </PrimaryButton>
          </Animated.View>
        </ScrollView>
        
        <View style={styles.footer}>
          <RegularText style={styles.footerText}>
            © 2025 AQRO App • All Rights Reserved
          </RegularText>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
 header: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 16,
     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 4 : 10,
     marginBottom: 0  
   },
   headerLetter: {
     fontSize: 26,
     fontFamily: 'Blanka',
     lineHeight: 30,
   },
  headerTitle: {
    fontSize: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    fontSize: 14,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center'
  },
  card: {
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20
  },
  email: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center'
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600'
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 10,
  },
  faqContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 15,
  },
  faqQuestion: {
    fontSize: 16,
    marginBottom: 5,
  },
  faqAnswer: {
    fontSize: 14,
  },
  contactButton: {
    marginTop: 10,
    height: 50,
  },
  footer: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.7
  }
});

export default PendingApprovalScreen;