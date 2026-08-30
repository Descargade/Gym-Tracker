import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { Button, EmptyState, Field, Header, IconButton, Screen } from '@/components/GymUI';
import { Exercise, MuscleGroup } from '@/types/models';

type FilterGroup = MuscleGroup | 'Todos';
const groups: FilterGroup[] = ['Todos', 'Pecho', 'Espalda', 'Bíceps', 'Tríceps', 'Hombros', 'Piernas', 'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Gemelos', 'Abdomen', 'Antebrazos', 'Cardio', 'Otro'];
const equipmentOptions = ['Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Banda elástica', 'Otro'];

export default function ExercisesScreen() {
  const colors = useColors();
  const { exercises, workouts, deleteExercise, archiveExercise } = useGym();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<FilterGroup>('Todos');
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Exercise | null>(null);
  const activeExercises = useMemo(() => exercises.filter((e) => e.isActive), [exercises]);
  const filtered = useMemo(() => activeExercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase()) && (group === 'Todos' || exercise.group === group)), [activeExercises, query, group]);
  const isUsedInWorkouts = (id: string) => workouts.some((w) => w.exercises.some((e) => e.exerciseId === id));

  return <Screen>
    <Header title="Ejercicios" subtitle={`${activeExercises.length} movimientos en tu catálogo`} action="Añadir ejercicio" onAction={() => setEditing({ id: '', name: '', group: 'Pecho', equipment: '', description: '', notes: '', isCustom: true, isActive: true })} />
    <Field label="" value={query} onChangeText={setQuery} placeholder="Buscar por nombre" />
    <View style={styles.filters}>{groups.map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.filter, { backgroundColor: group === item ? colors.accent : colors.secondary }]}><Text style={[styles.filterText, { color: group === item ? colors.accentForeground : colors.mutedForeground }]}>{item}</Text></Pressable>)}</View>
    <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{filtered.length} resultados</Text>
    {filtered.length === 0 ? <EmptyState icon="search" title="Sin resultados" description="Prueba con otro nombre o grupo muscular." /> : filtered.map((exercise) => <View key={exercise.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}><View style={[styles.exerciseIcon, { backgroundColor: colors.secondary }]}><Feather name="activity" size={18} color={colors.primary} /></View><View style={styles.cardCopy}><Text style={[styles.name, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{exercise.group} · {exercise.equipment || 'Sin equipamiento'}</Text></View><IconButton icon="edit-2" label="Editar ejercicio" onPress={() => setEditing(exercise)} /></View>
      {exercise.description ? <Text style={[styles.description, { color: colors.mutedForeground }]}>{exercise.description}</Text> : null}
      <View style={styles.badgeRow}><Text style={[styles.badge, { color: exercise.isCustom ? colors.primary : colors.mutedForeground, backgroundColor: exercise.isCustom ? colors.secondary : colors.muted }]}>{exercise.isCustom ? 'Personalizado' : 'Predefinido'}</Text>{exercise.isCustom ? <Pressable onPress={() => {
        if (isUsedInWorkouts(exercise.id)) {
          setArchiveTarget(exercise);
        } else {
          setDeleteTarget(exercise);
        }
      }}><Text style={[styles.deleteText, { color: colors.destructive }]}>{isUsedInWorkouts(exercise.id) ? 'Archivar' : 'Eliminar'}</Text></Pressable> : null}</View>
    </View>)}
    {editing !== null ? <View style={styles.sheetOverlay}><View style={styles.sheetContainer}><ExerciseEditor exercise={editing} onClose={() => setEditing(null)} /></View></View> : null}
    {deleteTarget !== null ? <View style={styles.modalBackdrop}><View style={[styles.confirmModal, { backgroundColor: colors.card }]}>
      <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Eliminar ejercicio</Text>
      <Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>¿Seguro que querés eliminar "{deleteTarget?.name}"? Esta acción no se puede deshacer.</Text>
      <View style={styles.confirmActions}>
        <Button label="Cancelar" variant="ghost" onPress={() => setDeleteTarget(null)} />
        <Button label="Eliminar" variant="danger" onPress={() => { deleteExercise(deleteTarget!.id); setDeleteTarget(null); }} />
      </View>
    </View></View> : null}
    {archiveTarget !== null ? <View style={styles.modalBackdrop}><View style={[styles.confirmModal, { backgroundColor: colors.card }]}>
      <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Archivar ejercicio</Text>
      <Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>Este ejercicio se usó en entrenamientos anteriores. Se archivará para que no aparezca en nuevas rutinas, pero se mantendrá en el historial.</Text>
      <View style={styles.confirmActions}>
        <Button label="Cancelar" variant="ghost" onPress={() => setArchiveTarget(null)} />
        <Button label="Archivar" onPress={() => { archiveExercise(archiveTarget!.id); setArchiveTarget(null); }} />
      </View>
    </View></View> : null}
  </Screen>;
}

function ExerciseEditor({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const colors = useColors();
  const { addExercise, updateExercise, checkDuplicateExercise } = useGym();
  const [name, setName] = useState(exercise?.name ?? '');
  const [group, setGroup] = useState<MuscleGroup>(exercise?.group ?? 'Pecho');
  const [equipment, setEquipment] = useState(exercise?.equipment ?? '');
  const [description, setDescription] = useState(exercise?.description ?? '');
  const [notes, setNotes] = useState(exercise?.notes ?? '');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const isNew = !exercise?.id;

  const save = (force = false) => {
    if (!name.trim()) return setShowNameError(true);
    if (!force && isNew) {
      const existing = checkDuplicateExercise(name.trim());
      if (existing) {
        setShowDuplicateWarning(true);
        return;
      }
    }
    const value = { name: name.trim(), group, equipment: equipment.trim(), description: description.trim(), notes: notes.trim(), isCustom: exercise?.isCustom ?? true, isActive: true };
    if (exercise?.id) updateExercise(exercise.id, value); else addExercise(value);
    onClose();
  };

  return <View style={[styles.editor, { backgroundColor: colors.background }]}>
    <View style={styles.editorHeader}><View style={{ flex: 1 }}><Text style={[styles.editorTitle, { color: colors.foreground }]}>{exercise?.id ? 'Editar ejercicio' : 'Nuevo ejercicio'}</Text><Text style={[styles.editorSub, { color: colors.mutedForeground }]}>Añadilo a tu biblioteca personal</Text></View><IconButton icon="x" label="Cerrar" onPress={onClose} /></View>
    <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej. Peso muerto rumano" />
    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Grupo muscular</Text><View style={styles.groupGrid}>{groups.filter((item) => item !== 'Todos').map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[styles.groupChip, { backgroundColor: group === item ? colors.accent : colors.secondary }]}><Text style={{ color: group === item ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>{item}</Text></Pressable>)}</View>
    <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Equipamiento</Text><View style={styles.groupGrid}>{equipmentOptions.map((item) => <Pressable key={item} onPress={() => setEquipment(item)} style={[styles.groupChip, { backgroundColor: equipment === item ? colors.accent : colors.secondary }]}><Text style={{ color: equipment === item ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>{item}</Text></Pressable>)}</View>
    <Field label="Descripción" value={description} onChangeText={setDescription} placeholder="Cómo realizarlo (opcional)" multiline />
    <Field label="Notas" value={notes} onChangeText={setNotes} placeholder="Consejos personales (opcional)" multiline />
    <View style={styles.editorActions}><Button label="Guardar ejercicio" icon="check" onPress={() => save()} /><Button label="Cancelar" variant="ghost" onPress={onClose} /></View>
    {showDuplicateWarning ? <View style={styles.modalBackdrop}><View style={[styles.confirmModal, { backgroundColor: colors.card }]}><Text style={[styles.confirmTitle, { color: colors.foreground }]}>¿Ejercicio duplicado?</Text><Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>Ya existe un ejercicio con un nombre similar. ¿Querés crearlo igual?</Text><View style={styles.duplicateActions}><Button label="Crear igualmente" onPress={() => { setShowDuplicateWarning(false); save(true); }} /><Button label="Cancelar" variant="ghost" onPress={() => setShowDuplicateWarning(false)} /></View></View></View> : null}
    {showNameError ? <View style={styles.modalBackdrop}><View style={[styles.confirmModal, { backgroundColor: colors.card }]}><Text style={[styles.confirmTitle, { color: colors.foreground }]}>Falta el nombre</Text><Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>Escribí un nombre para el ejercicio.</Text><Button label="Entendido" onPress={() => setShowNameError(false)} /></View></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  filter: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, minHeight: 38, justifyContent: 'center' },
  filterText: { fontSize: 12, fontWeight: '700' },
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
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 9999 },
  sheetContainer: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '92%' },
  editor: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  editorTitle: { fontSize: 25, fontWeight: '800' },
  editorSub: { marginTop: 5, fontSize: 13 },
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
  groupChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, minHeight: 38, justifyContent: 'center' },
  editorActions: { gap: 10, marginTop: 8, marginBottom: 20 },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10000 },
  confirmModal: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  confirmTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  confirmDesc: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', gap: 10 },
  duplicateActions: { gap: 10 },
});
