import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Text,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  RegularText,
  MediumText,
  BoldText,
  ThemedView,
  PrimaryButton,
  SecondaryButton,
  SemiBoldText,
} from '../../components/StyledComponents';
import { uploadDocuments, getRevisionDetails } from '../../services/documentService';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

const DocumentResubmissionScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [businessPermit, setBusinessPermit] = useState(null);
  const [birRegistration, setBirRegistration] = useState(null);
  const [revisionDetails, setRevisionDetails] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRevisionDetails();
  }, []);

  const fetchRevisionDetails = async () => {
    try {
      const details = await getRevisionDetails();
      console.log('Fetched revision details:', details);
      
      if (!details) {
        throw new Error('No revision details found');
      }

      setRevisionDetails(details);
      updateTimeRemaining(details.revisionDeadline);
    } catch (error) {
      console.error('Error fetching revision details:', error);
      Alert.alert(
        'Error',
        'Failed to fetch revision details. Please try again or contact support.',
        [{ text: 'OK', onPress: () => logout() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0) {
      setTimeRemaining('Deadline has passed');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`);
  };

  const pickDocument = async (type) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const fileAsset = result.assets[0];
        const fileSizeInMB = fileAsset.size / (1024 * 1024);
        
        if (fileSizeInMB > 5) {
          setError(`${type === 'businessPermit' ? 'Business permit' : 'BIR registration'} file size must be less than 5MB`);
          return;
        }

        if (type === 'businessPermit') {
          setBusinessPermit(fileAsset);
        } else {
          setBirRegistration(fileAsset);
        }
        setError('');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      setError('Failed to select document: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      setError(null);

      // Check if any required documents are missing
      const missingDocuments = revisionDetails.documentsToRevise.filter(doc => {
        if (doc === 'businessPermit' && !businessPermit) return true;
        if (doc === 'birRegistration' && !birRegistration) return true;
        return false;
      });

      if (missingDocuments.length > 0) {
        const formattedDocuments = missingDocuments.map(doc => {
          if (doc === 'businessPermit') return 'Business Permit';
          if (doc === 'birRegistration') return 'BIR Registration';
          return doc;
        });
        setError(`Please upload all required documents: ${formattedDocuments.join('/')}`);
        return;
      }

      const formData = new FormData();
      if (businessPermit && revisionDetails.documentsToRevise.includes('businessPermit')) {
        formData.append('businessPermit', {
          uri: businessPermit.uri,
          name: businessPermit.name,
          type: businessPermit.mimeType || businessPermit.type || 'application/pdf'
        });
      }
      if (birRegistration && revisionDetails.documentsToRevise.includes('birRegistration')) {
        formData.append('birRegistration', {
          uri: birRegistration.uri,
          name: birRegistration.name,
          type: birRegistration.mimeType || birRegistration.type || 'application/pdf'
        });
      }

      await uploadDocuments(formData);
      Alert.alert(
        'Success',
        'Documents submitted successfully. Please wait for admin review.',
        [{ 
          text: 'OK', 
          onPress: () => logout()
        }]
      );
    } catch (error) {
      console.error('Error submitting documents:', error);
      setError(error.message || 'Failed to submit documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!revisionDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No revision details found. Please contact support.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar 
        backgroundColor={theme.background} 
        barStyle={isDark ? "light-content" : "dark-content"} 
      />
      
      <View style={[styles.header, {backgroundColor: theme.background}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => logout()}
        >
          <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.resubmissionSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={isDark 
                  ? require('../../../assets/images/aqro-dark.png') 
                  : require('../../../assets/images/aqro-light.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>

            <View style={styles.heading}>
              <BoldText style={[styles.headingTitle, {color: theme.text}]}>Document Resubmission</BoldText>
              <MediumText style={[styles.subtitle, {color: theme.text}]}>Please update your documents</MediumText>
            </View>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: '#ffebee' }]}>
                <RegularText style={[styles.errorText, { color: '#d32f2f' }]}>{error}</RegularText>
              </View>
            ) : null}

            {revisionDetails?.revisionReason && (
              <View style={[styles.section, { backgroundColor: theme.card}]}>
                <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Revision Required</BoldText>
                <RegularText style={[styles.reasonText, {color: theme.text}]}>
                  {revisionDetails.revisionReason}
                </RegularText>
                <View style={styles.timeContainer}>
                  <Ionicons name="alarm-outline" size={18} color={theme.primary} />
                  <MediumText style={[styles.timeText, { color: theme.primary }]}>
                    {timeRemaining}
                  </MediumText>
                </View>
              </View>
            )}

            <View style={[styles.section, { backgroundColor: theme.card}]}>
              <BoldText style={[styles.sectionTitle, {color: theme.text}]}>Upload Documents</BoldText>

              {revisionDetails?.documentsToRevise?.includes('businessPermit') && (
                <View style={styles.formInput}>
                  <MediumText style={styles.inputLabel}>BUSINESS PERMIT*</MediumText>
                  <TouchableOpacity 
                    style={[styles.uploadButton, {borderColor: theme.border}]}
                    onPress={() => pickDocument('businessPermit')}
                  >
                    <MediumText style={[styles.uploadButtonText, {color: theme.text}]}>
                      {businessPermit ? businessPermit.name : 'Select Document'}
                    </MediumText>
                  </TouchableOpacity>
                  {businessPermit && (
                    <MediumText style={[styles.fileSizeText, {color: theme.text}]}>
                      {`${(businessPermit.size / 1024).toFixed(2)} KB`}
                    </MediumText>
                  )}
                  <RegularText style={[styles.fileTypeText, {color: theme.text, fontSize: 12, marginTop: 8, opacity: 0.8}]}>
                    Accepts PDF or JPG/PNG images (max 5MB)
                  </RegularText>
                </View>
              )}

              {revisionDetails?.documentsToRevise?.includes('birRegistration') && (
                <View style={styles.formInput}>
                  <MediumText style={styles.inputLabel}>BIR REGISTRATION*</MediumText>
                  <TouchableOpacity 
                    style={[styles.uploadButton, {borderColor: theme.border}]}
                    onPress={() => pickDocument('birRegistration')}
                  >
                    <MediumText style={[styles.uploadButtonText, {color: theme.text}]}>
                      {birRegistration ? birRegistration.name : 'Select Document'}
                    </MediumText>
                  </TouchableOpacity>
                  {birRegistration && (
                    <MediumText style={[styles.fileSizeText, {color: theme.text}]}>
                      {`${(birRegistration.size / 1024).toFixed(2)} KB`}
                    </MediumText>
                  )}
                  <RegularText style={[styles.fileTypeText, {color: theme.text, fontSize: 12, marginTop: 8, opacity: 0.8}]}>
                    Accepts PDF or JPG/PNG images (max 5MB)
                  </RegularText>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={uploading || timeRemaining === 'Deadline has passed'}
              >
                {uploading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#030f0f" />
                    <BoldText style={styles.loadingText}>Uploading Documents...</BoldText>
                  </View>
                ) : (
                  <BoldText style={styles.submitButtonText}>SUBMIT DOCUMENTS</BoldText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    height: Platform.OS === 'ios' ? 50 : 70,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  resubmissionSection: {
    flex: 1,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 150,
  },
  heading: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headingTitle: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  formInput: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    color: '#00df82',
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  uploadButtonText: {
    fontSize: 14,
  },
  fileSizeText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  actionButtons: {
    alignItems: 'center',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#00df82',
    borderRadius: 30,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#030f0f',
    fontSize: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#030f0f',
    fontSize: 16,
    marginLeft: 10,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  fileTypeText: {
    fontSize: 12,
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DocumentResubmissionScreen; 