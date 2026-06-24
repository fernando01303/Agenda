import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTasks, toggleTaskCompletion, deleteTask, Task } from '../database/storage';
import { useTheme } from '../context/ThemeContext';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors, isDarkMode } = useTheme();

  const loadTasks = async () => {
    setLoading(true);
    const loadedTasks = await getTasks();
    // Sort tasks: pending first, then by date/time
    loadedTasks.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
    });
    setTasks(loadedTasks);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const handleToggle = async (id: string) => {
    await toggleTaskCompletion(id);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
    loadTasks();
  };

  const renderItem = ({ item }: { item: Task }) => (
    <View style={[styles.taskCard, { backgroundColor: colors.card, borderLeftColor: item.color || colors.primary, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => handleToggle(item.id)}
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, item.isCompleted && { backgroundColor: item.color || colors.primary, borderColor: item.color || colors.primary }]}>
          {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, { color: colors.text }, item.isCompleted && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>
          {item.title}
        </Text>
        <Text style={[styles.taskTime, { color: colors.textSecondary }]}>{item.date.split('-').reverse().join('/')} às {item.time}</Text>
        {item.description ? <Text style={[styles.taskDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text> : null}
        <View style={[styles.categoryBadge, { backgroundColor: item.color + '20' }]}>
           <Text style={[styles.categoryText, { color: item.color }]}>{item.category}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Text style={[styles.deleteText, { color: colors.danger }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sua Agenda</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Tudo limpo por aqui! 🎉</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Adicione sua primeira tarefa tocando no botão abaixo.</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
          onPress={() => navigation.navigate('AddTask')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskTime: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
    lineHeight: 34,
  },
});
