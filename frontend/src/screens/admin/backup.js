import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
 
 const handleViewDocument = async (staffId, docType) => {
    try {
      setDocumentProcessing(true);
      console.log(`Fetching document ${docType} for staff ${staffId}`);
      // Check cache first
      const cacheDir = FileSystem.cacheDirectory + 'documents/';
      const cachePath = `${cacheDir}${staffId}_${docType}`;
      
      // Create directory if it doesn't exist
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
      
      // Check if cached file exists
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      
      let documentToDisplay;
      
      if (fileInfo.exists) {
        const cachedContent = await FileSystem.readAsStringAsync(cachePath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        documentToDisplay = {
          uri: `data:application/pdf;base64,${cachedContent}`,
          localUri: cachePath,
          mimeType: 'application/pdf',
          fileName: `${docType}_${staffId}.pdf`
        };
      } else {
        // Fetch from server
        const response = await getStaffDocuments(staffId, docType);
        console.log('Document response:', response); 
        
        // Save the base64 content to local file
        const base64Data = response.uri.split(',')[1];
        await FileSystem.writeAsStringAsync(cachePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        documentToDisplay = {
          ...response,
          localUri: cachePath
        };
      }
      
      setDocumentData(documentToDisplay);
      setDocumentType(docType);
      setDocumentModalVisible(true);
      console.log('Document data:', {
        mimeType: documentToDisplay.mimeType,
        fileName: documentToDisplay.fileName,
        uriStart: documentToDisplay.uri.substring(0, 50) + '...' // Just log the start of the URI
      });
      
    } catch (error) {
      console.error('Full document error:', error); // More detailed error
      Alert.alert('Error', `Failed to load ${docType} document: ${error.message}`);
    } finally {
      setDocumentProcessing(false);
    }
  };

  // Function to open the document with system viewer
  const openWithSystemViewer = async () => {
    try {
      if (!documentData?.localUri) {
        Alert.alert('Error', 'Document not available');
        return;
      }
      
      // On iOS, we need to use the Expo.FileSystem.downloadAsync to get a URI that can be opened
      if (Platform.OS === 'ios') {
        const tempFile = FileSystem.documentDirectory + `temp_${Date.now()}.pdf`;
        await FileSystem.copyAsync({
          from: documentData.localUri,
          to: tempFile
        });
        
        // Open the file with the system viewer
        await Linking.openURL(tempFile);
      } else {
        // For Android, we can use the file:// protocol
        await Linking.openURL(`file://${documentData.localUri}`);
      }
    } catch (error) {
      Alert.alert('Error', `Could not open the document: ${error.message}`);
      console.error('Open document error:', error);
    }
  };

  // Function to share the document
  const shareDocument = async () => {
    try {
      if (!documentData?.localUri) {
        Alert.alert('Error', 'Document not available for sharing');
        return;
      }
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
      
      await Sharing.shareAsync(documentData.localUri, {
        mimeType: documentData.mimeType || 'application/pdf',
        dialogTitle: `Share ${documentType === 'businessPermit' ? 'Business Permit' : 'BIR Registration'}`
      });
    } catch (error) {
      Alert.alert('Error', `Failed to share document: ${error.message}`);
      console.error('Share error:', error);
    }
  };

  const toggleDocumentOptions = () => {
    setDocumentOptions(!documentOptions);
  };

  const renderDocumentContent = () => {
    if (!documentData) return null;
  
    const isImage = documentData.mimeType?.startsWith('image/');
  
    return (
      <View style={styles.documentPlaceholder}>
        {isImage ? (
          <Image 
            source={{ uri: documentData.uri }}
            style={styles.documentImage}
            resizeMode="contain"
            onError={(e) => console.log('Image error:', e.nativeEvent.error)}
          />
        ) : (
          <>
            <Ionicons 
              name={documentType === 'businessPermit' ? "document-text" : "clipboard"} 
              size={64} 
              color={theme.primary} 
            />
            <MediumText style={{ marginTop: 10 }}>
              {documentType === 'businessPermit' ? 'Business Permit' : 'BIR Registration'}
            </MediumText>
          </>
        )}
        
        <RegularText style={{ marginTop: 5 }}>
          {documentData.fileName || 'Document'}
        </RegularText>
        
        <View style={styles.documentActions}>
          {!isImage && (
            <PrimaryButton 
              style={styles.documentActionButton}
              onPress={openWithSystemViewer}
            >
              Open Document
            </PrimaryButton>
          )}
          
          <SecondaryButton
            style={styles.documentActionButton}
            onPress={shareDocument}
          >
            Share {isImage ? 'Image' : 'Document'}
          </SecondaryButton>
        </View>
      </View>
    );
  };