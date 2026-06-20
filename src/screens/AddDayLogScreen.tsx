import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ActivityTag, addDayLog } from '../database/storage';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type ParamList = {
  AddDayLog: {
    selectedDate: string;
    tags: ActivityTag[];
  };
};

export function AddDayLogScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AddDayLog'>>();
  const { colors } = useTheme();

  const selectedDate = route.params?.selectedDate || new Date().toISOString().split('T')[0];
  const availableTags: ActivityTag[] = route.params?.tags || [];

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async () => {
    if (selectedTagIds.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos uma etiqueta.');
      return;
    }

    try {
      for (const tagId of selectedTagIds) {
        const tag = availableTags.find(t => t.id === tagId);
        if (tag) {
          await addDayLog({
            date: selectedDate,
            tagId: tag.id,
            tagName: tag.name,
            tagColor: tag.color,
            description: description.trim() || undefined,
          });
        }
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o registro.');
    }
  };

  const displayDate = selectedDate.split('-').reverse().join('/');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Registrar Atividade</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Dia {displayDate}</Text>
        </View>

        {availableTags.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Você ainda não criou nenhuma etiqueta. Volte e crie uma primeiro.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Selecione as etiquetas</Text>
              <View style={styles.tagsGrid}>
                {availableTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagChip,
                        { backgroundColor: colors.card, borderColor: colors.border },
                        isSelected && { backgroundColor: tag.color, borderColor: tag.color },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <View style={[styles.tagDot, { backgroundColor: isSelected ? '#ffffff' : tag.color }]} />
                      <Text style={[styles.tagChipText, { color: colors.text }, isSelected && { color: '#ffffff' }]}>
                        {tag.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Descrição (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Como foi a atividade? O que você fez?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Salvar Registro</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  tagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  textArea: {
    height: 100,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
