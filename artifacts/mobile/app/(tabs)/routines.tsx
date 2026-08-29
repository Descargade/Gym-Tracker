import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { Button, EmptyState, Field, Header, IconButton, Screen, SectionTitle } from '@/components/GymUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { RoutineExercise } from '@/types/models';

export default function RoutinesScreen() {
  const colors = useColors();
  const { routines, exercises, addRoutine, updateRoutine, deleteRoutine, duplicateRoutine, moveRoutineExercise } = useGym();
  const [editing, setEditing] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [menuRoutine, setMenuRoutine] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const current = routines.find((routine) => routine.id === editing);
  const menuTarget = routines.find((routine) => routine.id === menuRoutine);
  const deleteTarget = routines.find((routine) => routine.id === deleteConfirm);

  const openEditor = (id?: string) => { setEditing(id ?? null); setEditorVisible(true); };
  const closeEditor = () => { setEditing(null); setEditorVisible(false); };

  return <Screen>
    <Header title="Rutinas" subtitle={`${routines.length} rutinas listas para usar`} action="Añadir rutina" onAction={() => openEditor()} />
    {routines.length === 0 ? <EmptyState icon="list" title="Aún no tienes rutinas" description="Crea una rutina con tus ejercicios favoritos y empieza a entrenar." /> : routines.map((routine) => <View key={routine.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}><View style={[styles.routineIcon, { backgroundColor: colors.secondary }]}><Feather name="layers" size={20} color={colors.primary} /></View><View style={styles.cardCopy}><Text style={[styles.routineName, { color: colors.foreground }]}>{routine.name}</Text><Text style={[styles.routineMeta, { color: colors.mutedForeground }]}>{routine.exercises.length} ejercicios · {routine.exercises.reduce((sum, item) => sum + item.sets, 0)} series</Text></View><IconButton icon="more-horizontal" label="Más opciones" onPress={() => setMenuRoutine(routine.id)} /></View>
      <View style={styles.exercisePreview}>{routine.exercises.slice(0, 3).map((item, index) => { const exercise = exercises.find((candidate) => candidate.id === item.exerciseId); return <View style={styles.previewLine} key={item.id}><Text style={[styles.previewNumber, { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text><Text style={[styles.previewName, { color: colors.foreground }]}>{exercise?.name ?? 'Ejercicio eliminado'}</Text><Text style={[styles.previewSets, { color: colors.mutedForeground }]}>{item.sets} × {item.targetReps}</Text></View>; })}</View>
      <Button label="Comenzar" icon="play" onPress={() => router.push({ pathname: '/train', params: { routineId: routine.id } })} />
    </View>)}
    <Modal visible={editorVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeEditor}><RoutineEditor routineId={editing} onClose={closeEditor} /></Modal>
    <Modal visible={menuRoutine !== null} transparent animationType="fade" onRequestClose={() => setMenuRoutine(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.menuModal, { backgroundColor: colors.card }]}>
        <Text style={[styles.menuTitle, { color: colors.foreground }]}>{menuTarget?.name}</Text>
        <Pressable onPress={() => { setMenuRoutine(null); openEditor(menuRoutine!); }} style={[styles.menuOption, { backgroundColor: colors.secondary }]}><Feather name="edit-2" size={18} color={colors.foreground} /><Text style={[styles.menuOptionText, { color: colors.foreground }]}>Editar</Text></Pressable>
        <Pressable onPress={() => { setMenuRoutine(null); duplicateRoutine(menuRoutine!); }} style={[styles.menuOption, { backgroundColor: colors.secondary }]}><Feather name="copy" size={18} color={colors.foreground} /><Text style={[styles.menuOptionText, { color: colors.foreground }]}>Duplicar</Text></Pressable>
        <Pressable onPress={() => { setMenuRoutine(null); setDeleteConfirm(menuRoutine!); }} style={[styles.menuOption, { backgroundColor: colors.destructive + '18' }]}><Feather name="trash-2" size={18} color={colors.destructive} /><Text style={[styles.menuOptionText, { color: colors.destructive }]}>Eliminar</Text></Pressable>
        <Pressable onPress={() => setMenuRoutine(null)} style={[styles.menuOption, { backgroundColor: colors.secondary }]}><Text style={[styles.menuOptionText, { color: colors.mutedForeground, textAlign: 'center', width: '100%' }]}>Cancelar</Text></Pressable>
      </View></View>
    </Modal>
    <Modal visible={deleteConfirm !== null} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.menuModal, { backgroundColor: colors.card }]}>
        <Text style={[styles.menuTitle, { color: colors.foreground }]}>Eliminar rutina</Text>
        <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>¿Seguro que querés eliminar "{deleteTarget?.name}"? Esta acción no se puede deshacer.</Text>
        <View style={styles.menuActions}>
          <Button label="Cancelar" variant="ghost" onPress={() => setDeleteConfirm(null)} />
          <Button label="Eliminar" variant="danger" onPress={() => { deleteRoutine(deleteConfirm!); setDeleteConfirm(null); }} />
        </View>
      </View></View>
    </Modal>
  </Screen>;
}

function RoutineEditor({ routineId, onClose }: { routineId: string | null; onClose: () => void }) {
  const colors = useColors();
  const { routines, exercises, addRoutine, updateRoutine } = useGym();
  const existing = routines.find((routine) => routine.id === routineId);
  const [name, setName] = useState(existing?.name ?? '');
  const [selected, setSelected] = useState<RoutineExercise[]>(existing?.exercises ?? []);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => exercises.filter((exercise) => exercise.isActive && exercise.name.toLowerCase().includes(query.toLowerCase())), [exercises, query]);

  const save = () => {
    if (!name.trim()) return Alert.alert('Falta el nombre', 'Escribe un nombre para la rutina.');
    if (!selected.length) return Alert.alert('Añade un ejercicio', 'Selecciona al menos un ejercicio.');
    if (existing) updateRoutine(existing.id, name.trim(), selected); else addRoutine(name.trim(), selected);
    onClose();
  };
  const toggle = (exerciseId: string) => setSelected((current) => current.some((item) => item.exerciseId === exerciseId) ? current.filter((item) => item.exerciseId !== exerciseId) : [...current, { id: `re-${Date.now()}-${exerciseId}`, exerciseId, sets: 3, targetReps: '8-10', restSeconds: 90 }]);
  const updateItem = (id: string, patch: Partial<RoutineExercise>) => setSelected((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));

  return <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.editor, { backgroundColor: colors.background }]} bottomOffset={18}>
    <View style={styles.editorHeader}><View><Text style={[styles.editorTitle, { color: colors.foreground }]}>{existing ? 'Editar rutina' : 'Nueva rutina'}</Text><Text style={[styles.editorSub, { color: colors.mutedForeground }]}>Configura tu próxima sesión</Text></View><IconButton icon="x" label="Cerrar" onPress={onClose} /></View>
    <Field label="Nombre de la rutina" value={name} onChangeText={setName} placeholder="Ej. Torso completo" />
    <SectionTitle>Ejercicios seleccionados</SectionTitle>
    {selected.length === 0 ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>Selecciona ejercicios del catálogo de abajo.</Text> : selected.map((item, index) => { const exercise = exercises.find((candidate) => candidate.id === item.exerciseId); return <View key={item.id} style={[styles.selected, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.selectedTop}><Text style={[styles.selectedIndex, { color: colors.primary }]}>{index + 1}</Text><Text style={[styles.selectedName, { color: colors.foreground }]}>{exercise?.name}</Text><Pressable onPress={() => setSelected((current) => current.filter((candidate) => candidate.id !== item.id))}><Feather name="x-circle" size={19} color={colors.mutedForeground} /></Pressable></View><View style={styles.configRow}><View style={styles.configField}><Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Series</Text><Field label="" value={String(item.sets)} onChangeText={(value) => updateItem(item.id, { sets: Math.max(1, Number(value) || 1) })} keyboardType="numeric" /></View><View style={styles.configField}><Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Repeticiones</Text><Field label="" value={item.targetReps} onChangeText={(value) => updateItem(item.id, { targetReps: value })} placeholder="8-10" /></View><View style={styles.configField}><Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Descanso</Text><Field label="" value={String(item.restSeconds)} onChangeText={(value) => updateItem(item.id, { restSeconds: Math.max(0, Number(value) || 0) })} keyboardType="numeric" /></View></View><View style={styles.reorder}><Pressable disabled={index === 0} onPress={() => setSelected((current) => { const next = [...current]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} style={({ pressed }) => [styles.reorderBtn, { backgroundColor: colors.secondary, opacity: index === 0 ? 0.4 : pressed ? 0.7 : 1 }]}><Feather name="chevron-up" size={15} color={index === 0 ? colors.mutedForeground : colors.primary} /><Text style={[styles.reorderText, { color: index === 0 ? colors.mutedForeground : colors.primary }]}>Subir</Text></Pressable><Pressable disabled={index === selected.length - 1} onPress={() => setSelected((current) => { const next = [...current]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} style={({ pressed }) => [styles.reorderBtn, { backgroundColor: colors.secondary, opacity: index === selected.length - 1 ? 0.4 : pressed ? 0.7 : 1 }]}><Feather name="chevron-down" size={15} color={index === selected.length - 1 ? colors.mutedForeground : colors.primary} /><Text style={[styles.reorderText, { color: index === selected.length - 1 ? colors.mutedForeground : colors.primary }]}>Bajar</Text></Pressable></View></View>; })}
    <SectionTitle>Catálogo de ejercicios</SectionTitle>
    <Field label="" value={query} onChangeText={setQuery} placeholder="Buscar ejercicio" />
    {filtered.map((exercise) => { const active = selected.some((item) => item.exerciseId === exercise.id); return <Pressable key={exercise.id} onPress={() => toggle(exercise.id)} style={[styles.catalogRow, { backgroundColor: active ? colors.secondary : colors.card, borderColor: active ? colors.primary : colors.border }]}><View><Text style={[styles.catalogName, { color: colors.foreground }]}>{exercise.name}</Text><Text style={[styles.catalogMeta, { color: colors.mutedForeground }]}>{exercise.group} · {exercise.equipment}</Text></View><Feather name={active ? 'check-circle' : 'plus-circle'} size={23} color={active ? colors.primary : colors.mutedForeground} /></Pressable>; })}
    <View style={styles.editorActions}><Button label={existing ? 'Guardar cambios' : 'Crear rutina'} onPress={save} icon="check" /><Button label="Cancelar" onPress={onClose} variant="ghost" /></View>
  </KeyboardAwareScrollViewCompat>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 16, marginBottom: 13 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routineIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardCopy: { flex: 1 },
  routineName: { fontSize: 17, fontWeight: '700' },
  routineMeta: { fontSize: 12, marginTop: 5 },
  exercisePreview: { gap: 11, marginBottom: 17 },
  previewLine: { flexDirection: 'row', alignItems: 'center' },
  previewNumber: { fontSize: 11, fontWeight: '800', width: 28 },
  previewName: { fontSize: 13, flex: 1 },
  previewSets: { fontSize: 12 },
  editor: { padding: 20, paddingBottom: 40 },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  editorTitle: { fontSize: 25, fontWeight: '800' },
  editorSub: { marginTop: 5, fontSize: 13 },
  helper: { fontSize: 13, paddingBottom: 4 },
  selected: { borderRadius: 17, borderWidth: 1, padding: 13, marginBottom: 10 },
  selectedTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectedIndex: { fontSize: 12, fontWeight: '800' },
  selectedName: { flex: 1, fontWeight: '700', fontSize: 14 },
  configRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  configField: { flex: 1 },
  configLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  reorder: { flexDirection: 'row', gap: 10, marginTop: 6 },
  reorderBtn: { minHeight: 38, minWidth: 70, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12 },
  reorderText: { fontSize: 12, fontWeight: '700' },
  catalogRow: { borderRadius: 15, borderWidth: 1, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 56 },
  catalogName: { fontSize: 14, fontWeight: '600' },
  catalogMeta: { fontSize: 11, marginTop: 4 },
  editorActions: { gap: 10, marginTop: 19 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  menuModal: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  menuTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  menuDesc: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  menuOption: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 15, marginBottom: 8 },
  menuOptionText: { fontSize: 15, fontWeight: '600' },
  menuActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});