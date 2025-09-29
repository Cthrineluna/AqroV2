import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import { Ionicons } from '@expo/vector-icons';

const ProductsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchProducts());
    fetchProducts();
    return unsub;
  }, []);

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const response = await axios.get(getApiUrl('/products'), { headers: { Authorization: `Bearer ${token}` } });
      setProducts(response.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('ProductForm', { product: item })}>
      <Image source={ item.image ? { uri: item.image } : require('../../../assets/images/placeholder-bg.jpg') } style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.price, { color: theme.text }]}>₱{item.price?.toFixed(2)}</Text>
        <View style={styles.meta}>
          <Ionicons name="star" size={16} color="#f5c518" />
          <Text style={[styles.rating, { color: theme.text }]}>{item.ratingAverage ?? 0} ({item.ratingCount ?? 0})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  card: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  image: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  price: { marginTop: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  rating: { marginLeft: 6 }
});

export default ProductsScreen;
