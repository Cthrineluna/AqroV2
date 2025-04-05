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
  Modal,
  ScrollView,
  Image,
  Linking,
  Platform,
  Share,
  StatusBar,
  Text,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { approveStaff, getPendingStaff, getStaffDocuments } from '../../services/approvalService';
import { Ionicons } from '@expo/vector-icons';
import {
  RegularText,
  MediumText,
  BoldText,
  SemiBoldText,
  ThemedView,
  PrimaryButton,
  SecondaryButton,
} from '../../components/StyledComponents';


const AdminApprovalScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [pendingStaff, setPendingStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [documentType, setDocumentType] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [currentViewingStaff, setCurrentViewingStaff] = useState(null);
  const [documentOptions, setDocumentOptions] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [documentProcessing, setDocumentProcessing] = useState(false);

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

  const handleApproveSelected = async () => {
    if (selectedStaffIds.length === 0) {
      Alert.alert('Info', 'Please select at least one staff member to approve');
      return;
    }

    try {
      setButtonLoading(true);
      // Process approvals sequentially
      for (const staffId of selectedStaffIds) {
        await approveStaff(staffId);
      }
      
      Alert.alert('Success', `${selectedStaffIds.length} staff member(s) approved successfully`);
      // Remove approved staff from the list
      setPendingStaff(pendingStaff.filter(staff => !selectedStaffIds.includes(staff._id)));
      // Clear selection
      setSelectedStaffIds([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve staff');
      console.error(error);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleRejectSelected = async () => {
    if (selectedStaffIds.length === 0) {
      Alert.alert('Info', 'Please select at least one staff member to reject');
      return;
    }

    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to reject ${selectedStaffIds.length} staff member(s)?`,
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
            Alert.alert('Success', `${selectedStaffIds.length} staff member(s) rejected`);
            // Update the list after rejection
            setPendingStaff(pendingStaff.filter(staff => !selectedStaffIds.includes(staff._id)));
            // Clear selection
            setSelectedStaffIds([]);
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingStaff();
  };

  const handleSelectStaff = (staffId) => {
    setSelectedStaffIds(prevSelected => {
      if (prevSelected.includes(staffId)) {
        return prevSelected.filter(id => id !== staffId);
      } else {
        return [...prevSelected, staffId];
      }
    });
  };

  const handleLongPressStaff = (staff) => {
    setCurrentViewingStaff(staff);
    // Show document options
    Alert.alert(
      'View Documents',
      `Select document to view for ${staff.firstName} ${staff.lastName}`,
      [
        {
          text: 'Business Permit',
          onPress: () => handleViewDocument(staff._id, 'businessPermit')
        },
        {
          text: 'BIR Registration',
          onPress: () => handleViewDocument(staff._id, 'birRegistration')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleViewDocument = async (staffId, docType) => {
    try {
      setDocumentProcessing(true);
      setDocumentType(docType);
      setDocumentModalVisible(true);
      
      console.log(`Fetching ${docType} for staff ${staffId}...`);
      const documentResponse = await getStaffDocuments(staffId, docType);
      console.log(`Document received, mime type: ${documentResponse.mimeType}`);
      setDocumentData(documentResponse);
    } catch (error) {
      console.error('Error fetching document:', error);
      Alert.alert(
        'Document Error', 
        `${error.message || `Failed to load ${docType} document. Please try again.`}`,
        [{ text: 'OK' }]
      );
      setDocumentModalVisible(false);
    } finally {
      setDocumentProcessing(false);
    }
  };
  
  // Enhanced document viewer modal
  const renderDocumentModal = () => (
    <Modal
      visible={documentModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDocumentModalVisible(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <SemiBoldText style={{ fontSize: 18 }}>
              {documentType === 'businessPermit' ? 'Business Permit' : 'BIR Registration'}
            </SemiBoldText>
            <TouchableOpacity onPress={() => setDocumentModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {documentProcessing ? (
            <View style={styles.documentLoadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <MediumText style={{ marginTop: 12 }}>Loading document...</MediumText>
            </View>
          ) : documentData ? (
            <ScrollView style={styles.documentContainer}>
              {documentData.mimeType && documentData.mimeType.startsWith('image/') ? (
                <Image
                  source={{ uri: `data:${documentData.mimeType};base64,${documentData.fileData}` }}
                  style={styles.documentImage}
                  resizeMode="contain"
                />
              ) : documentData.mimeType && documentData.mimeType.includes('pdf') ? (
                <View style={styles.pdfContainer}>
                  <Ionicons name="document-text" size={64} color={theme.primary} />
                  <MediumText style={{ textAlign: 'center', marginTop: 12 }}>
                    {documentData.fileName || 'Document.pdf'}
                  </MediumText>
                  <RegularText style={{ textAlign: 'center', marginTop: 8, color: theme.text, opacity: 0.5, }}>
                    PDF viewing not available in this screen. 
                  </RegularText>
                  <PrimaryButton 
                    style={{ marginTop: 16 }}
                    onPress={() => {
                      // You would implement functionality to open/download PDF here
                      Alert.alert('Info', 'This would open the PDF file in device viewer');
                    }}
                  >
                    Open PDF
                  </PrimaryButton>
                </View>
              ) : (
                <View style={styles.documentLoadingContainer}>
                  <Ionicons name="document" size={64} color={theme.primary} />
                  <MediumText style={{ marginTop: 12 }}>Document loaded</MediumText>
                  <RegularText style={{ textAlign: 'center', marginTop: 8, color: theme.secondaryText }}>
                    File type: {documentData.mimeType || 'Unknown'}
                  </RegularText>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.documentLoadingContainer}>
              <Ionicons name="alert-circle" size={64} color={theme.error || '#ff6b6b'} />
              <MediumText style={{ marginTop: 12 }}>Failed to load document</MediumText>
            </View>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
  

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectStaff(item._id)}
      onLongPress={() => handleLongPressStaff(item)}
      delayLongPress={500} // 500ms long press to view documents
      activeOpacity={0.7}
    >
      <ThemedView style={[
        styles.card,
        selectedStaffIds.includes(item._id) && { borderColor: theme.primary, borderWidth: 2 }
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
            name={selectedStaffIds.includes(item._id) ? "checkmark-circle" : "ellipse"} 
            size={24} 
            color={selectedStaffIds.includes(item._id) ? theme.primary : theme.secondaryText} 
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
      <StatusBar 
              backgroundColor={theme?.background || '#FFFFFF'} 
              barStyle={isDark ? "light-content" : "dark-content"} 
            />
      <ThemedView style={styles.container}>
         <View style={[
                styles.header, 
                { backgroundColor: theme?.background || '#FFFFFF' }
              ]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Ionicons 
                    name="arrow-back" 
                    size={24} 
                    color={theme?.text || '#000000'} 
                  />
                </TouchableOpacity>
                
                <SemiBoldText style={[
                  styles.headerTitle, 
                  { color: theme?.text || '#000000' }
                ]}>
                  Retailer Approvals
                </SemiBoldText>
          <RegularText>{selectedStaffIds.length} selected</RegularText>
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
        
        {selectedStaffIds.length > 0 && (
          <View style={styles.actionContainer}>
            <View style={styles.actionButtons}>
              <SecondaryButton 
                style={[styles.rejectButton, { borderColor: '#ff6b6b' }]} 
                textStyle={{ color: '#ff6b6b', fontSize: 14 }}
                onPress={handleRejectSelected}
              >
                Reject Selected
              </SecondaryButton>
              
              <PrimaryButton 
                style={styles.approveButton} 
                textStyle={{ fontSize: 14 }}
                onPress={handleApproveSelected}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" />
                    <RegularText style={styles.loadingText}>Processing...</RegularText>
                  </View>
                ) : 'Approve Selected'}
              </PrimaryButton>
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.helpButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Help', 'Tap a staff card to select for approval/rejection. Hold a card to view their documents. You can select multiple staff members to approve or reject in batch.')}
        >
          <Ionicons name="help" size={24} color="white" />
        </TouchableOpacity>

        {/* Document Modal - No WebView */}
        {renderDocumentModal()}
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 2 : 10,
    height: Platform.OS === 'android' ? 76 : 56,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 0,
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
  actionContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionInfoContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 300,
  },
  modalFooter: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeButton: {
    width: '50%',
  },
  documentPlaceholder: {
    width: '100%',
    minHeight: 300,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  documentActions: {
    marginTop: 24,
    width: '100%',
    paddingHorizontal: 16,
  },
  documentActionButton: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  documentContainer: {
    padding: 16,
  },
  documentLoadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentImage: {
    width: '100%',
    height: 500,
    backgroundColor: '#f0f0f0',
  },
  pdfContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdminApprovalScreen;