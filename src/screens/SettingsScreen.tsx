import React from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function SettingsScreen() {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Configurações</Text>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Modo Escuro</Text>
              <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                {isDarkMode ? 'Ativado' : 'Desativado'}
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f8fafc'}
              ios_backgroundColor="#cbd5e1"
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
  },
});
