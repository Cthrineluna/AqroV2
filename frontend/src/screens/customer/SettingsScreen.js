import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { 
  ThemedView, 
  BoldText, 
  RegularText 
} from '../../components/StyledComponents';

const SettingsScreen = () => {
  const { theme, isDark, toggleTheme, followSystem, setFollowSystem } = useTheme();

  return (
    <ThemedView style={styles.container}>
      <BoldText style={styles.title}>Settings</BoldText>
      
      <View style={styles.section}>
        <BoldText style={styles.sectionTitle}>Appearance</BoldText>
        
        <View style={styles.settingRow}>
          <RegularText>Follow system theme</RegularText>
          <Switch
            value={followSystem}
            onValueChange={setFollowSystem}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
        
        {!followSystem && (
          <View style={styles.settingRow}>
            <RegularText>Dark Mode</RegularText>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor="#f4f3f4"
            />
          </View>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
});

export default SettingsScreen;