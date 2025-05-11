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
  Dimensions,
  TextInput
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { approveStaff, getPendingStaff, getStaffDocuments, rejectStaff  } from '../../services/approvalService';
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StorageAccessFramework } from 'expo-file-system';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Animated } from 'react-native';

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
  const helpButtonOpacity = new Animated.Value(1);
  const [debouncedHelpVisible, setDebouncedHelpVisible] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedHelpVisible(selectedStaffIds.length === 0);
  }, 0); 

  return () => clearTimeout(timer); // Cleanup
}, [selectedStaffIds.length]);

  


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

   setRejectionReason(''); // Clear previous reason
  setRejectionModalVisible(true);

  // Use Alert.prompt or a modal to get the rejection reason
  Alert.prompt(
    'Rejection Reason',
    'Please provide a reason for rejection (will be included in email):',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async (reason) => {
          try {
            setButtonLoading(true);
            // Process rejections sequentially
            for (const staffId of selectedStaffIds) {
              await rejectStaff(staffId, reason);
            }
            
            Alert.alert('Success', `${selectedStaffIds.length} staff member(s) rejected`);
            // Update the list after rejection
            setPendingStaff(pendingStaff.filter(staff => !selectedStaffIds.includes(staff._id)));
            // Clear selection
            setSelectedStaffIds([]);
          } catch (error) {
            Alert.alert('Error', 'Failed to reject staff');
            console.error(error);
          } finally {
            setButtonLoading(false);
          }
        }
      }
    ],
    'plain-text'
  );
};

const confirmRejection = async () => {
  try {
    setButtonLoading(true);
    // Process rejections sequentially
    for (const staffId of selectedStaffIds) {
      await rejectStaff(staffId, rejectionReason);
    }
    
    Alert.alert('Success', `${selectedStaffIds.length} staff member(s) rejected`);
    // Update the list after rejection
    setPendingStaff(pendingStaff.filter(staff => !selectedStaffIds.includes(staff._id)));
    // Clear selection
    setSelectedStaffIds([]);
    setRejectionModalVisible(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to reject staff');
    console.error(error);
  } finally {
    setButtonLoading(false);
  }
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
  
  // Add this new function to handle document downloads
  const handleDownloadDocument = async (document) => {
    try {
      // Set download started
      setDocumentProcessing(true);
      
      // Create temp file with the right extension based on mimeType
      const fileExtension = document.mimeType.includes('pdf') ? 'pdf' : 
                           document.mimeType.includes('image') ? 
                           (document.mimeType.includes('png') ? 'png' : 'jpg') : 'file';
      
      // Create secure file name
      const fileName = document.fileName || `document.${fileExtension}`;
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Create file URI in app's cache directory
      const fileUri = `${FileSystem.cacheDirectory}${sanitizedFileName}`;
      
      // Write base64 data to file
      await FileSystem.writeAsStringAsync(
        fileUri,
        document.fileData,
        { encoding: FileSystem.EncodingType.Base64 }
      );
      
      if (Platform.OS === 'android') {
        try {
          // On Android, use StorageAccessFramework for Downloads access
          const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
          
          if (permissions.granted) {
            const destinationUri = await StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              sanitizedFileName,
              document.mimeType
            );
            
            const fileContent = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64
            });
            
            await FileSystem.writeAsStringAsync(
              destinationUri,
              fileContent,
              { encoding: FileSystem.EncodingType.Base64 }
            );
            
            Alert.alert('Success', `File saved as ${sanitizedFileName}`);
          } else {
            // Use sharing instead if permission not granted
            await Sharing.shareAsync(fileUri);
          }
        } catch (error) {
          console.error('Storage framework error:', error);
          // Fallback to sharing
          await Sharing.shareAsync(fileUri);
        }
      } else {
        // On iOS, use the sharing dialog
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert('Download Failed', error.message || 'Could not download the document');
    } finally {
      setDocumentProcessing(false);
    }
  };
  const handleToggleSelectAll = () => {
    if (selectedStaffIds.length === pendingStaff.length) {
      // Deselect all
      setSelectedStaffIds([]);
    } else {
      // Select all
      setSelectedStaffIds(pendingStaff.map(staff => staff._id));
    }
  };
  

  {/* Rejection Reason Modal */}

  


  // Now let's update the renderDocumentModal function
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
              <MediumText style={{ marginTop: 12 }}>
                {downloadProgress > 0 ? `Downloading... ${downloadProgress}%` : 'Loading document...'}
              </MediumText>
            </View>
          ) : documentData ? (
            <ScrollView style={styles.documentContainer}
            contentContainerStyle={{ flexGrow: 1 }} >
              {documentData.mimeType && documentData.mimeType.startsWith('image/') ? (
                 <View style={styles.imageZoomContainer}>
                 <ImageViewer
                   imageUrls={[{
                     url: `data:${documentData.mimeType};base64,${documentData.fileData}`,
                     props: {
                     }
                   }]}
                   enableImageZoom={true}
                   enableSwipeDown={true}
                   onSwipeDown={() => setDocumentModalVisible(false)}
                   swipeDownThreshold={50}
                   backgroundColor={theme.background}
                   renderIndicator={() => null} // Hide the default indicator
                   saveToLocalByLongPress={false}
                   style={styles.imageViewer}
                 />
                  <PrimaryButton 
                    style={{ marginTop: 12, marginBottom: 12 }}
                    onPress={() => handleDownloadDocument(documentData)}
                  >
                    Download Image
                  </PrimaryButton>
                </View>
              ) : documentData.mimeType && documentData.mimeType.includes('pdf') ? (
                <View style={styles.pdfContainer}>
                  <Ionicons name="document-text" size={64} color={theme.primary} />
                  <MediumText style={{ textAlign: 'center', marginTop: 12 }}>
                    {documentData.fileName || 'Document.pdf'}
                  </MediumText>
                  <RegularText style={{ textAlign: 'center', marginTop: 8, color: theme.text, opacity: 0.5, }}>
                    Download PDF to view on your device
                  </RegularText>
                  <PrimaryButton 
                    style={{ marginTop: 16 }}
                    onPress={() => handleDownloadDocument(documentData)}
                  >
                    Download PDF
                  </PrimaryButton>
                </View>
              ) : (
                <View style={styles.documentLoadingContainer}>
                  <Ionicons name="document" size={64} color={theme.primary} />
                  <MediumText style={{ marginTop: 12 }}>Document loaded</MediumText>
                  <RegularText style={{ textAlign: 'center', marginTop: 8, color: theme.secondaryText }}>
                    File type: {documentData.mimeType || 'Unknown'}
                  </RegularText>
                  <PrimaryButton 
                    style={{ marginTop: 16 }}
                    onPress={() => handleDownloadDocument(documentData)}
                  >
                    Download File
                  </PrimaryButton>
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
        { 
          backgroundColor: selectedStaffIds.includes(item._id) 
            ? theme.card || '#e3f2fd'  
            : theme.card || '#ffffff',
            borderColor: theme?.border || '#E0E0E0' 
                   
        },
        selectedStaffIds.includes(item._id) && { 
          borderColor: theme.primary, 
          borderWidth: 2 
        }
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
            color={selectedStaffIds.includes(item._id) ? theme.primary : theme.background} 
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
                 Approvals
                </SemiBoldText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RegularText style={{ marginRight: 10 }}>
                {selectedStaffIds.length} selected
              </RegularText>
              {pendingStaff.length > 0 && (
                <TouchableOpacity 
                  onPress={handleToggleSelectAll}
                  style={{ padding: 5 }}
                >
                  <MediumText style={{ color: theme.primary }}>
                    {selectedStaffIds.length === pendingStaff.length ? 'Deselect All' : 'Select All'}
                  </MediumText>
                </TouchableOpacity>
              )}
            </View>
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
        {debouncedHelpVisible && (
        <TouchableOpacity 
          style={[styles.helpButton, { backgroundColor: theme.primary }]}
          onPress={() => Alert.alert('Help', 'Tap a staff card to select for approval/rejection. Hold a card to view their documents. You can select multiple staff members to approve or reject in batch.')}
        >
          <Ionicons name="help" size={24} color="white" />
        </TouchableOpacity>
)}
{/* Rejection Reason Modal */}
<Modal
  visible={rejectionModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setRejectionModalVisible(false)}
>
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  }}>
    <View style={{
      width: '80%',
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderRadius: 10,
      padding: 20,
      elevation: 5
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: isDark ? '#ffffff' : '#000000',
        marginBottom: 15
      }}>
        Rejection Reason
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: isDark ? '#444444' : '#cccccc',
          borderRadius: 5,
          padding: 10,
          color: isDark ? '#ffffff' : '#000000',
          backgroundColor: isDark ? '#333333' : '#f5f5f5',
          marginBottom: 20,
          textAlignVertical: 'top'
        }}
        multiline
        numberOfLines={4}
        placeholder="Please provide a reason for rejection (will be included in email)"
        placeholderTextColor={isDark ? '#aaaaaa' : '#777777'}
        value={rejectionReason}
        onChangeText={setRejectionReason}
      />
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: isDark ? '#444444' : '#dddddd',
            width: '45%',
            alignItems: 'center'
          }}
          onPress={() => setRejectionModalVisible(false)}
        >
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#ff6b6b',
            width: '45%',
            alignItems: 'center'
          }}
          onPress={confirmRejection}
          disabled={buttonLoading}
        >
          {buttonLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff' }}>Reject</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
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
    borderWidth: 1,
    borderRadius: 10,
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
    paddingHorizontal: 16,
    paddingBottom: 80,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: Platform.select({
      ios: 16,
      android: 8,
    }),
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    maxHeight: Platform.select({
      ios: '80%',
      android: '90%', // Slightly taller on Android
    }),
    width: '100%',
    marginHorizontal: Platform.select({
      android: 8, // Add some margin on Android
    }),
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
    padding: 8,
    maxHeight: Platform.select({
      ios: 500,
      android: Dimensions.get('window').height * 0.6, // Responsive height based on screen
    }),
  },
  documentLoadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentImage: {
    width: '100%',
    height: Platform.select({
      ios: 500,
      android: Dimensions.get('window').height * 0.5, // Responsive height
    }),
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  pdfContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.select({
      android: 200,
      ios: 150,
    }),
  },
  imageZoomContainer: {
    flex: 1,
    width: '100%',
    height: Platform.select({
      ios: 500,
      android: Dimensions.get('window').height * 0.6,
    }),
  },
  imageViewer: {
    flex: 1,
  },
  closeZoomButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Add to your StyleSheet
selectAllText: {
  fontSize: 14,
},
});

export default AdminApprovalScreen;