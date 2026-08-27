import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { Button, EmptyState, Field, Header, IconButton, Screen } from '@/components/GymUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Exercise, MuscleGroup } from '@/types/models';

type FilterGroup = MuscleGroup | 'Todos';
const groups: FilterGroup[] = ['Todos', 'Pecho', 'Espalda', 'Bíceps', 'Tríceps', 'Hombros', 'Piernas', 'Glúteos', 'Abdomen', 'Cardio', 'Otro'];

export default function ExercisesScreen() {
  const colors = useColors();
  const { exercises, deleteExercise } = useGym();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<FilterGroup>('Todos');
  const [editing, setEditing] = useState<Exercise | null>(null);
  const filtered = useMemo(() => exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase()) && (group === 'Todos' || exercise.group === group)), [exercises, query, group]);
  return <Screen>
    <Header title="Ejercicios" subtitle={`${exercises.length} movimientos en tu catálogo`} action="Añadir ejercicio" onAction={() => setEditing({ id: '', name: '', group: 'Pecho', equipment: '', description: '', notes: '', isCustom: true })} />
    <Field label="" value={query} onChangeText={setQuery} placeholder="Buscar por nombre" />
    <View style={styles.filters}>{groups.map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.filter, { backgroundColor: group === item ? colors.accent : colors.secondary }]}><Text style={[styles.filterText, { color: group === item ? colors.accentForeground : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>
    <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{filtered.length} resultados</Text>
    {filtered.length === 0 ? <EmptyState icon="search" title="Sin resultados" description="Prueba con otro nombre o grupo muscular." /> : filtered.map((exercise) => <View key={exercise.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}><View style={[styles.exerciseIcon, { backgroundColor: colors.secondary }]}><Feather name="activity" size={18} color={colors.primary} /></View><View style={styles.cardCopy}><Text style={[styles.name, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{exercise.group} · {exercise.equipment || 'Sin equipamiento'}</Text></View><IconButton icon="edit-2" label="Editar ejercicio" onPress={() => setEditing(exercise)} /></View>
      {exercise.description ? <Text style={[styles.description, { color: colors.mutedForeground }]}>{exercise.description}</Text> : null}
      <View style={styles.badgeRow}><Text style={[styles.badge, { color: exercise.isCustom ? colors.primary : colors.mutedForeground, backgroundColor: exercise.isCustom ? colors.secondary : colors.muted }]}>{exercise.isCustom ? 'Personalizado' : 'Predefinido'}</Text>{exercise.isCustom ? <Pressable onPress={() => Alert.alert('Eliminar ejercicio', 'También se quitará de las rutinas que lo usen.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteExercise(exercise.id) }])}><Text style={[styles.deleteText, { color: colors.destructive }]}>Eliminar</Text></Pressable> : null}</View>
    </View>)}
    <Modal visible={editing !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}><ExerciseEditor exercise={editing} onClose={() => setEditing(null)} /></Modal>
  </Screen>;
}

function ExerciseEditor({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const colors = useColors();
  const { addExercise, updateExercise } = useGym();
  const [name, setName] = useState(exercise?.name ?? '');
  const [group, setGroup] = useState<MuscleGroup>(exercise?.group ?? 'Pecho');
  const [equipment, setEquipment] = useState(exercise?.equipment ?? '');
  const [description, setDescription] = useState(exercise?.description ?? '');
  const [notes, setNotes] = useState(exercise?.notes ?? '');
  const save = () => {
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Escribe un nombre para el ejercicio.');
    const value = { name: name.trim(), group, equipment: equipment.trim(), description: description.trim(), notes: notes.trim(), isCustom: exercise?.isCustom ?? true };
    if (exercise?.id) updateExercise(exercise.id, value); else addExercise(value);
    onClose();
  };
  return <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.editor, { backgroundColor: colors.background }]} bottomOffset={18}>
    <View style={styles.editorHeader}><View><Text style={[styles.editorTitle, { color: colors.foreground }]}>{exercise?.id ? 'Editar ejercicio' : 'Nuevo ejercicio'}</Text><Text style={[styles.editorSub, { color: colors.mutedForeground }]}>Añádelo a tu biblioteca personal</Text></View><IconButton icon="x" label="Cerrar" onPress={onClose} /></View>
    <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej. Peso muerto rumano" />
    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Grupo muscular</Text><View style={styles.groupGrid}>{groups.filter((item) => item !== 'Todos').map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.groupChip, { backgroundColor: group === item ? colors.accent : colors.secondary }]}><Text style={{ color: group === item ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>{item}</Text></Pressable>)}</View>
    <Field label="Equipamiento" value={equipment} onChangeText={setEquipment} placeholder="Ej. Mancuernas" />
    <Field label="Descripción" value={description} onChangeText={setDescription} placeholder="Cómo realizarlo" multiline />
    <Field label="Notas" value={notes} onChangeText={setNotes} placeholder="Consejos personales" multiline />
    <View style={styles.editorActions}><Button label="Guardar ejercicio" icon="check" onPress={save} /><Button label="Cancelar" variant="ghost" onPress={onClose} /></View>
  </KeyboardAwareScrollViewCompat>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  filter: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 11, fontWeight: '700' },
  resultCount: { fontSize: 12, marginBottom: 9 },
  card: { borderRadius: 19, borderWidth: 1, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  exerciseIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  cardCopy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 4 },
  description: { fontSize: 12, lineHeight: 18, marginTop: 13 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  badge: { fontSize: 10, fontWeight: '700', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  deleteText: { fontSize: 12, fontWeight: '700' },
  editor: { padding: 20, paddingBottom: 40 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  editorTitle: { fontSize: 25, fontWeight: '800' },
  editorSub: { marginTop: 5, fontSize: 13 },
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  groupChip: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12 },
  editorActions: { gap: 10, marginTop: 8 },
});