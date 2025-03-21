import React from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchComponent = ({ onSearch, searchQuery, setSearchQuery, theme, placeholder = "Search..." }) => {
  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="search-outline" size={20} color={theme.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.text + '80'}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            onSearch(text);
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={theme.text + '90'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  }
});

export default SearchComponent;