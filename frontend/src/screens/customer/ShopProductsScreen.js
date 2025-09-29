import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ShopProductsScreen = ({ route, navigation }) => {
  const { restaurantId, name } = route.params;
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);

  useEffect(() => { navigation.setOptions({ title: name || 'Products' }); fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const res = await axios.get(getApiUrl(`/products?restaurantId=${restaurantId}`), { headers: { Authorization: `Bearer ${token}` } });
      setProducts(res.data || []);
    } catch (err) { console.error('Error fetching products:', err); }
  };

  const onRate = async (productId) => {
    Alert.prompt(
      'Rate product',
      'Enter a rating 1-5',
      async (text) => {
        const rating = parseInt(text, 10);
        if (!rating || rating < 1 || rating > 5) { Alert.alert('Invalid rating'); return; }
        try {
          const token = await AsyncStorage.getItem('aqro_token');
          await axios.post(getApiUrl(`/products/${productId}/rate`), { rating }, { headers: { Authorization: `Bearer ${token}` } });
          fetchProducts();
        } catch (err) { console.error('Error rating product:', err); }
      },
      'plain-text'
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <Image source={ item.image ? { uri: item.image } : require('../../../assets/images/placeholder-bg.jpg') } style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.desc, { color: theme.text }]}>{item.description}</Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color: theme.text }]}>₱{item.price?.toFixed(2)}</Text>
          <View style={styles.meta}>
            <Ionicons name="star" size={16} color="#f5c518" />
            <Text style={[styles.rating, { color: theme.text }]}>{item.ratingAverage ?? 0}</Text>
          </View>
          <TouchableOpacity style={styles.rateBtn} onPress={() => onRate(item._id)}>
            <Text style={{ color: '#fff' }}>Rate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList data={products} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  image: { width: 84, height: 84, borderRadius: 8, marginRight: 12 },
  content: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 6 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center' },
  rating: { marginLeft: 6 },
  rateBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }
});

export default ShopProductsScreen;
