import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getRoutineActivities, toggleRoutineActivity, deleteRoutineActivity, RoutineActivity } from '../database/storage';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type RoutineScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddRoutine'>;

export function RoutineScreen() {
  const navigation = useNavigation<RoutineScreenNavigationProp>();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<RoutineActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    setLoading(true);
    const dateStr = selectedDate.toISOString().split('T')[0];
    const all = await getRoutineActivities();
    const forDay = all.filter(a => a.date === dateStr);
    
    // Sort by time if it exists, otherwise put at bottom
    forDay.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });

    setActivities(forDay);
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      loadActivities();
    }
  }, [isFocused, selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleToggle = async (id: string) => {
    await toggleRoutineActivity(id);
    loadActivities();
  };

  const handleDelete = async (id: string) => {
    await deleteRoutineActivity(id);
    loadActivities();
  };

  const formatDateLabel = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (selectedDate.toDateString() === today.toDateString()) return 'Hoje';
    if (selectedDate.toDateString() === tomorrow.toDateString()) return 'Amanhã';
    if (selectedDate.toDateString() === yesterday.toDateString()) return 'Ontem';
    
    return selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item }: { item: RoutineActivity }) => (
    <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => handleToggle(item.id)}
      >
        <View style={[styles.checkbox, { borderColor: colors.border }, item.isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: colors.text }, item.isCompleted && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>
          {item.title}
        </Text>
        
        {(item.time || item.duration) && (
          <View style={styles.metaRow}>
            {item.time && (
              <View style={[styles.badge, { backgroundColor: colors.background }]}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.time}</Text>
              </View>
            )}
            {item.duration && (
              <View style={[styles.badge, { backgroundColor: colors.background }]}>
                <Ionicons name="hourglass-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{item.duration}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sua Rotina</Text>
        </View>

        <View style={[styles.dateSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.dateLabelContainer}>
            <Text style={[styles.dateLabel, { color: colors.primary }]}>{formatDateLabel()}</Text>
            <Text style={[styles.dateSubLabel, { color: colors.textSecondary }]}>
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
            </Text>
          </View>

          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={60} color={colors.textSecondary} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum hábito para este dia</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Comece a construir sua rotina adicionando atividades.</Text>
          </View>
        ) : (
          <FlatList
            data={activities}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
          onPress={() => navigation.navigate('AddRoutine', { selectedDate: selectedDate.toISOString().split('T')[0] })}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  dateBtn: {
    padding: 8,
  },
  dateLabelContainer: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateSubLabel: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#cbd5e1', // default fallback
  },
  checkboxContainer: {
    paddingRight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
