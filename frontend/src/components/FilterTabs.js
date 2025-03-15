// components/FilterTabs.js
import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform 
} from 'react-native';
import { RegularText } from './StyledComponents';

const FilterTabs = ({ options, activeFilter, onFilterChange, theme }) => {
  return (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterTab,
              activeFilter === option.id && { backgroundColor: theme.primary },
              { borderColor: theme.primary }
            ]}
            onPress={() => onFilterChange(option.id)}
          >
            <RegularText 
              style={[
                styles.filterText,
                { color: activeFilter === option.id ? '#fff' : theme.primary }
              ]}
            >
              {option.label}
            </RegularText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterScrollContent: {
    paddingHorizontal: 0,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    
  },
});

export default FilterTabs;