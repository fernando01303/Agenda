import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getTags, addTag, deleteTag, getDayLogs, deleteDayLog, getFilteredDayLogs, ActivityTag, DayLog } from '../database/storage';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type RegistroNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddDayLog'>;

const TAG_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'];

export function RegistroScreen() {
  const navigation = useNavigation<RegistroNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const isFocused = useIsFocused();

  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Add tag modal
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Filter/Stats
  const [showStats, setShowStats] = useState(false);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<number>(30);
  const [filteredLogs, setFilteredLogs] = useState<DayLog[]>([]);

  const loadData = useCallback(async () => {
    const [loadedTags, loadedLogs] = await Promise.all([getTags(), getDayLogs()]);
    setTags(loadedTags);
    setDayLogs(loadedLogs);
  }, []);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  // --- TAG MANAGEMENT ---
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a etiqueta.');
      return;
    }
    await addTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
    setShowAddTagModal(false);
    loadData();
  };

  const handleDeleteTag = (tag: ActivityTag) => {
    Alert.alert(
      'Excluir Etiqueta',
      `Excluir "${tag.name}"? Todos os registros associados também serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: async () => { await deleteTag(tag.id); loadData(); } },
      ]
    );
  };

  // --- CALENDAR LOGIC ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sunday

  const changeMonth = (delta: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const getDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getLogsForDay = (dateStr: string) => dayLogs.filter(l => l.date === dateStr);

  const handleDayPress = (day: number) => {
    const dateStr = getDateString(day);
    setSelectedDate(dateStr);
  };

  const handleAddLogForSelectedDay = () => {
    if (!selectedDate) return;
    if (tags.length === 0) {
      Alert.alert('Sem Etiquetas', 'Crie pelo menos uma etiqueta antes de registrar uma atividade.');
      return;
    }
    navigation.navigate('AddDayLog', { selectedDate, tags });
  };

  const handleDeleteLog = async (logId: string) => {
    await deleteDayLog(logId);
    loadData();
  };

  // --- STATS / FILTER ---
  const runFilter = async () => {
    if (!filterTagId) {
      Alert.alert('Selecione', 'Escolha uma etiqueta para filtrar.');
      return;
    }
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - filterPeriod);
    const startDate = startDateObj.toISOString().split('T')[0];

    const results = await getFilteredDayLogs(filterTagId, startDate, endDate);
    // Deduplicate by date
    const uniqueDates = [...new Set(results.map(r => r.date))];
    setFilteredLogs(results);
  };

  const getUniqueDaysCount = () => {
    const uniqueDates = [...new Set(filteredLogs.map(l => l.date))];
    return uniqueDates.length;
  };

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedDayLogs = selectedDate ? getLogsForDay(selectedDate) : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Registro</Text>
        </View>

        {/* Tag Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Suas Etiquetas</Text>
            <TouchableOpacity 
              onPress={() => setShowAddTagModal(true)} 
              style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {tags.length === 0 ? (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Crie etiquetas como "Trabalho", "Academia", "Estudo"...
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tagPill, { backgroundColor: tag.color + '20', borderColor: tag.color }]}
                  onLongPress={() => handleDeleteTag(tag)}
                >
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={[styles.tagPillText, { color: tag.color }]}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calNavBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.calMonthLabel, { color: colors.text }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calNavBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map(d => (
              <Text key={d} style={[styles.weekDayLabel, { color: colors.textSecondary }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateString(day);
              const logsForDay = getLogsForDay(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isToday && [styles.todayCell, { borderColor: colors.primary }],
                    isSelected && [styles.selectedCell, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text style={[
                    styles.dayText, 
                    { color: colors.text },
                    isSelected && { color: '#ffffff' },
                  ]}>
                    {day}
                  </Text>
                  {logsForDay.length > 0 && (
                    <View style={styles.dotsRow}>
                      {logsForDay.slice(0, 3).map((log, idx) => (
                        <View key={idx} style={[styles.logDot, { backgroundColor: isSelected ? '#ffffff' : log.tagColor }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Details */}
        {selectedDate && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {selectedDate.split('-').reverse().join('/')}
              </Text>
              <TouchableOpacity 
                onPress={handleAddLogForSelectedDay}
                style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {selectedDayLogs.length === 0 ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Nenhum registro para este dia. Toque no "+" para adicionar.
              </Text>
            ) : (
              selectedDayLogs.map(log => (
                <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: log.tagColor }]}>
                  <View style={styles.logContent}>
                    <View style={[styles.logTagBadge, { backgroundColor: log.tagColor + '20' }]}>
                      <Text style={[styles.logTagText, { color: log.tagColor }]}>{log.tagName}</Text>
                    </View>
                    {log.description && (
                      <Text style={[styles.logDesc, { color: colors.textSecondary }]}>{log.description}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteLog(log.id)} style={styles.logDeleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.statsToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowStats(!showStats)}
          >
            <View style={styles.statsToggleLeft}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
              <Text style={[styles.statsToggleText, { color: colors.text }]}>Filtro e Estatísticas</Text>
            </View>
            <Ionicons name={showStats ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {showStats && (
            <View style={[styles.statsPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Selecione a etiqueta:</Text>
              <View style={styles.filterTagsRow}>
                {tags.map(tag => {
                  const isActive = filterTagId === tag.id;
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.filterTagChip,
                        { borderColor: tag.color },
                        isActive && { backgroundColor: tag.color },
                      ]}
                      onPress={() => setFilterTagId(tag.id)}
                    >
                      <Text style={[styles.filterTagText, { color: tag.color }, isActive && { color: '#ffffff' }]}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Período:</Text>
              <View style={styles.periodRow}>
                {[7, 15, 30, 60, 90].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.periodChip,
                      { borderColor: colors.border },
                      filterPeriod === p && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setFilterPeriod(p)}
                  >
                    <Text style={[
                      styles.periodText, 
                      { color: colors.textSecondary }, 
                      filterPeriod === p && { color: '#ffffff' },
                    ]}>
                      {p}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.filterBtn, { backgroundColor: colors.primary }]} 
                onPress={runFilter}
              >
                <Ionicons name="search" size={18} color="#ffffff" />
                <Text style={styles.filterBtnText}>Filtrar</Text>
              </TouchableOpacity>

              {filteredLogs.length > 0 && (
                <View style={[styles.resultCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.resultTitle, { color: colors.primary }]}>
                    {getUniqueDaysCount()} {getUniqueDaysCount() === 1 ? 'dia' : 'dias'}
                  </Text>
                  <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
                    nos últimos {filterPeriod} dias
                  </Text>
                  <View style={styles.resultDaysList}>
                    {[...new Set(filteredLogs.map(l => l.date))].sort().map(date => (
                      <View key={date} style={[styles.resultDayPill, { borderColor: colors.border }]}>
                        <Text style={[styles.resultDayText, { color: colors.text }]}>
                          {date.split('-').reverse().join('/')}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />

      </ScrollView>

      {/* Add Tag Modal */}
      <Modal visible={showAddTagModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nova Etiqueta</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder="Nome da etiqueta"
              value={newTagName}
              onChangeText={setNewTagName}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <Text style={[styles.label, { color: colors.text }]}>Escolha uma cor:</Text>
            <View style={styles.colorGrid}>
              {TAG_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    newTagColor === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewTagColor(c)}
                >
                  {newTagColor === c && <Ionicons name="checkmark" size={18} color="#ffffff" />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalCancelBtn, { borderColor: colors.border }]} 
                onPress={() => { setShowAddTagModal(false); setNewTagName(''); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleAddTag}
              >
                <Text style={styles.modalSaveText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addTagBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    gap: 6,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Calendar
  calendarCard: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 4,
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderRadius: 12,
  },
  selectedCell: {
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  logDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Day Logs
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 10,
  },
  logContent: {
    flex: 1,
  },
  logTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  logTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  logDeleteBtn: {
    padding: 8,
  },

  // Stats
  statsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsPanel: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterTagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  filterBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 36,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  resultDaysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    justifyContent: 'center',
  },
  resultDayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultDayText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
