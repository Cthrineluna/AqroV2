import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../services/apiConfig';
import { useTheme } from '../../context/ThemeContext';

const ShopsScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [shops, setShops] = useState([]);

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    try {
      const token = await AsyncStorage.getItem('aqro_token');
      const res = await axios.get(getApiUrl('/restaurants'), { headers: { Authorization: `Bearer ${token}` } });
      setShops(res.data || []);
    } catch (err) { console.error('Error fetching shops:', err); }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('ShopProducts', { restaurantId: item._id, name: item.name })}>
      <Image source={ item.logo ? { uri: item.logo } : require('../../../assets/images/placeholder-bg.jpg') } style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.loc, { color: theme.text }]}>{item.location?.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList data={shops} keyExtractor={(i) => i._id} renderItem={renderItem} contentContainerStyle={{ padding: 16 }} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  image: { width: 72, height: 72, borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  loc: { fontSize: 12, marginTop: 6 }
});

export default ShopsScreen;
