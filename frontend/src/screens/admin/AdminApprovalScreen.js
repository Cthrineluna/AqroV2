import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { approveStaff, getPendingStaff } from '../../services/approvalService';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  RegularText,
  MediumText,
  BoldText,
  SemiBoldText,
  ThemedView,
  PrimaryButton,
  SecondaryButton,
  ThemeToggle
} from '../../components/StyledComponents';

const AdminApprovalScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const fetchPendingStaff = async () => {
    try {
      const staff = await getPendingStaff();
      setPendingStaff(staff);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending staff');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingStaff();
  }, []);

  const handleApprove = async (staffId) => {
    try {
      setLoading(true);
      await approveStaff(staffId);
      Alert.alert('Success', 'Staff member approved successfully');
      fetchPendingStaff();
      setSelectedStaff(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve staff');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (staffId) => {
    // Implementation would be added here in a real app
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this staff member?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            // Rejection logic would go here
            Alert.alert('Success', 'Staff member rejected');
            // Update the list after rejection
            setPendingStaff(pendingStaff.filter(staff => staff._id !== staffId));
            setSelectedStaff(null);
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingStaff();
  };

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff._id === selectedStaff ? null : staff._id);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectStaff(item)}
      activeOpacity={0.7}
    >
      <ThemedView style={[
        styles.card,
        selectedStaff === item._id && { borderColor: theme.primary, borderWidth: 2 }
      ]}>
        <View style={styles.infoContainer}>
          <SemiBoldText style={styles.name}>
            {item.firstName} {item.lastName}
          </SemiBoldText>
          <RegularText style={[styles.email, { color: theme.primary }]}>
            {item.email}
          </RegularText>
          <MediumText style={styles.restaurant}>
            Restaurant: {item.restaurantId?.name || 'N/A'}
          </MediumText>
          <RegularText style={[styles.date, { color: theme.primary }]}>
            Registered: {new Date(item.createdAt).toLocaleDateString()}
          </RegularText>
        </View>

        <View style={styles.statusIndicator}>
          <Ionicons 
            name={selectedStaff === item._id ? "checkmark-circle" : "ellipse"} 
            size={24} 
            color={selectedStaff === item._id ? theme.primary : theme.secondaryText} 
          />
        </View>
      </ThemedView>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <BoldText style={styles.title}>Staff Approvals</BoldText>
        </View>
        
        <FlatList
          data={pendingStaff}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle" size={64} color={theme.primary} />
              <MediumText style={styles.emptyText}>
                No pending staff approvals
              </MediumText>
            </ThemedView>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
        
        {selectedStaff && (
          <View style={styles.actionButtons}>
            <SecondaryButton 
              style={[styles.rejectButton, { borderColor: '#ff6b6b' }]} 
              textStyle={{ color: '#ff6b6b', fontSize: 16 }}
              onPress={() => handleReject(selectedStaff)}
            >
              Reject
            </SecondaryButton>
            
            <PrimaryButton 
              style={styles.approveButton} 
              textStyle={{ fontSize: 16 }}
              onPress={() => handleApprove(selectedStaff)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Approve Staff'}
            </PrimaryButton>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.helpButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Help', 'Select a staff member to approve or reject their account request. Pull down to refresh the list.')}
        >
          <Ionicons name="help" size={24} color="white" />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    marginBottom: 0,
  },
  themeToggle: {
    height: 40,
    paddingHorizontal: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  restaurant: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statusIndicator: {
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
  },
  approveButton: {
    width: '48%',
    height: 48,
  },
  rejectButton: {
    width: '48%',
    height: 48,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  helpButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});

export default AdminApprovalScreen;