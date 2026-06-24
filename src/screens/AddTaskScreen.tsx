import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { addTask } from '../database/storage';
import { scheduleTaskNotification } from '../utils/notifications';
import { useTheme } from '../context/ThemeContext';

export function AddTaskScreen() {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateObj, setDateObj] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(0);
  const [category, setCategory] = useState('Trabalho');
  const [color, setColor] = useState('#3b82f6');

  const reminderOptions = [
    { label: 'Na hora exata', value: 0 },
    { label: '5 minutos antes', value: 5 },
    { label: '10 minutos antes', value: 10 },
    { label: '15 minutos antes', value: 15 },
    { label: '20 minutos antes', value: 20 },
    { label: '25 minutos antes', value: 25 },
    { label: '30 minutos antes', value: 30 },
    { label: '35 minutos antes', value: 35 },
    { label: '40 minutos antes', value: 40 },
    { label: '45 minutos antes', value: 45 },
    { label: '50 minutos antes', value: 50 },
    { label: '55 minutos antes', value: 55 },
    { label: '60 minutos antes (1 hora)', value: 60 },
  ];

  const categories = [
    { name: 'Trabalho', color: '#3b82f6' }, // blue
    { name: 'Pessoal', color: '#10b981' },  // green
    { name: 'Estudo', color: '#8b5cf6' },   // purple
    { name: 'Saúde', color: '#ef4444' },    // red
    { name: 'Outros', color: '#f59e0b' },   // orange
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDate = new Date(dateObj);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDateObj(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDate = new Date(dateObj);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setDateObj(newDate);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'O título da tarefa é obrigatório.');
      return;
    }

    const now = new Date();
    now.setSeconds(0, 0);
    
    const selectedDateTime = new Date(dateObj);
    selectedDateTime.setSeconds(0, 0);

    if (selectedDateTime.getTime() < now.getTime()) {
      Alert.alert('Data Inválida', 'Não é possível marcar atividades em dias anteriores ou em horas e minutos que já se passaram.');
      return;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      await addTask({
        title,
        description,
        date: dateStr,
        time: timeStr,
        category,
        color,
        reminderMinutesBefore,
      });
      await scheduleTaskNotification(title, description, dateStr, timeStr, reminderMinutesBefore);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
    }
  };

  const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Nova Tarefa</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Preencha os detalhes abaixo</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Título</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: Reunião de alinhamento"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Descrição (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Detalhes adicionais da tarefa"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Data</Text>
              <TouchableOpacity 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>{formattedDate}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="date"
                  display="calendar"
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Hora</Text>
              <TouchableOpacity 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>{formattedTime}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={dateObj}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Alarme / Lembrete</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Picker
                selectedValue={reminderMinutesBefore}
                onValueChange={(itemValue) => setReminderMinutesBefore(itemValue)}
                style={{ color: colors.text }}
                dropdownIconColor={colors.text}
              >
                {reminderOptions.map(opt => (
                  <Picker.Item 
                    key={opt.value} 
                    label={opt.label} 
                    value={opt.value} 
                    color={isDarkMode ? '#ffffff' : '#000000'} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    category === cat.name && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  onPress={() => {
                    setCategory(cat.name);
                    setColor(cat.color);
                  }}
                >
                  <Text 
                    style={[
                      styles.categoryChipText,
                      { color: colors.textSecondary },
                      category === cat.name && styles.categoryChipTextSelected
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Salvar Tarefa</Text>
          </TouchableOpacity>
          
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    minHeight: 52,
  },
  dateText: {
    fontSize: 16,
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
    marginRight: 10,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
