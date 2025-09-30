import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ProductForm = ({ navigation, route }) => {
  const { theme } = useTheme();
  const existing = route.params?.product;

  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [price, setPrice] = useState(existing?.price ? String(existing.price) : '0');
  const [image, setImage] = useState(existing?.image || '');
  const [localImage, setLocalImage] = useState(null); // { uri, name, type }

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const onSave = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        Alert.alert('Not Authorized', 'You must be logged in as staff to add or edit products.');
        return;
      }

      const userStr = await AsyncStorage.getItem('aqro_user');
      const user = JSON.parse(userStr || '{}');

      if (!user.restaurantId) {
        Alert.alert('Error', 'Your account is not linked to a restaurant.');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', parseFloat(price) || 0);

      if (existing) {
        // update product
        if (localImage) {
          formData.append('image', {
            uri: localImage.uri,
            name: localImage.name,
            type: localImage.type,
          });
        }

        await axios.put(getApiUrl(`/products/${existing._id}`), formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // create product
        formData.append('restaurantId', user.restaurantId);

        if (localImage) {
          formData.append('image', {
            uri: localImage.uri,
            name: localImage.name,
            type: localImage.type,
          });
        }

        await axios.post(getApiUrl('/products'), formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      navigation.navigate('Products');
    } catch (err) {
      console.error('Save product error:', err.response?.data || err.message);
      Alert.alert('Save Error', err.response?.data?.message || 'Failed to save product.');
    }
  };

  const onDelete = async () => {
    if (!existing) return;
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      if (!token) {
        Alert.alert('Not Authorized', 'You must be logged in as staff to delete products.');
        return;
      }

      await axios.delete(getApiUrl(`/products/${existing._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigation.navigate('Products');
    } catch (err) {
      console.error('Delete product error:', err.response?.data || err.message);
      Alert.alert('Delete Error', err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos to select a product image');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled) {
        const asset = result.assets ? result.assets[0] : result;
        const uri = asset.uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        setLocalImage({ uri, name: filename, type });
        setImage(uri);
      }
    } catch (err) {
      console.error('Image pick error', err);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {existing ? 'Edit Product' : 'Add Product'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.label, { color: theme.text }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        />

        <Text style={[styles.label, { color: theme.text }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={[styles.textarea, { backgroundColor: theme.card, color: theme.text }]}
        />

        <Text style={[styles.label, { color: theme.text }]}>Price</Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        />

        <Text style={[styles.label, { color: theme.text }]}>Image</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={pickImage}
            style={[
              styles.saveBtn,
              { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: theme.secondary },
            ]}
          >
            <Text style={{ color: '#fff' }}>Pick Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setLocalImage(null);
              setImage('');
            }}
            style={[styles.cancelBtn, { paddingVertical: 10, paddingHorizontal: 12 }]}
          >
            <Text style={{ color: theme.primary }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {image ? <Image source={{ uri: image }} style={styles.preview} /> : null}

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={onSave}>
          <Text style={{ color: '#fff' }}>{existing ? 'Update' : 'Add Product'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.primary }]}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={{ color: theme.primary }}>Cancel</Text>
        </TouchableOpacity>

        {existing ? (
          <TouchableOpacity style={[styles.deleteBtn]} onPress={onDelete}>
            <Text style={{ color: '#fff' }}>Delete Product</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { marginTop: 12, marginBottom: 6 },
  input: { padding: 12, borderRadius: 8 },
  textarea: { padding: 12, borderRadius: 8, minHeight: 100, textAlignVertical: 'top' },
  preview: { width: '100%', height: 180, borderRadius: 8, marginTop: 12 },
  saveBtn: { marginTop: 16, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  deleteBtn: { marginTop: 12, padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#d32f2f' },
});

export default ProductForm;
