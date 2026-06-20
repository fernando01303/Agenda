import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addRoutineActivity } from '../database/storage';
import { useTheme } from '../context/ThemeContext';

type ParamList = {
  AddRoutine: {
    selectedDate: string;
  };
};

export function AddRoutineScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AddRoutine'>>();
  const { colors } = useTheme();
  
  const selectedDateStr = route.params?.selectedDate || new Date().toISOString().split('T')[0];
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [useTime, setUseTime] = useState(false);
  
  // Set initial dateObj using the selected date from the calendar
  const initialDate = new Date(`${selectedDateStr}T12:00:00`);
  const [timeObj, setTimeObj] = useState(initialDate);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newDate = new Date(timeObj);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setTimeObj(newDate);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'A atividade precisa ter um nome.');
      return;
    }

    const now = new Date();
    now.setSeconds(0, 0);

    // Validate if the user is trying to add to a past date
    const routineDate = new Date(`${selectedDateStr}T00:00:00`);
    
    // If they picked a time, validate the exact time
    if (useTime) {
      const selectedDateTime = new Date(`${selectedDateStr}T${timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}:00`);
      selectedDateTime.setSeconds(0, 0);

      if (selectedDateTime.getTime() < now.getTime()) {
        Alert.alert('Data Inválida', 'Não é possível marcar atividades em horas e minutos que já se passaram.');
        return;
      }
    } else {
      // If no time is picked, just check if the date itself is strictly in the past
      // (e.g. yesterday). If it's today, it's fine.
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (routineDate.getTime() < today.getTime()) {
        Alert.alert('Data Inválida', 'Não é possível marcar atividades em dias anteriores.');
        return;
      }
    }

    const timeStr = useTime ? timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined;

    try {
      await addRoutineActivity({
        title,
        date: selectedDateStr,
        time: timeStr,
        duration: duration.trim() ? duration : undefined,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a atividade.');
    }
  };

  const formattedTime = timeObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const displayDate = selectedDateStr.split('-').reverse().join('/');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Nova Atividade</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Adicionando para o dia {displayDate}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>O que você vai fazer?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: Leitura, Academia, Meditação..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Duração Estimada (Opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: 30 min, 1 hora"
              value={duration}
              onChangeText={setDuration}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={[styles.inputGroup, styles.switchRow]}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Definir Horário?</Text>
            <Switch
              value={useTime}
              onValueChange={setUseTime}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
            />
          </View>

          {useTime && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Selecione o Horário</Text>
              <TouchableOpacity 
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.text }]}>{formattedTime}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={timeObj}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Adicionar à Rotina</Text>
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
