import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym, notifyRestFinished } from '@/context/GymContext';
import { Button, Field, IconButton, Screen } from '@/components/GymUI';
import { WorkoutSet } from '@/types/models';

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const duration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

export default function TrainScreen() {
  const colors = useColors();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const { activeWorkout, routines, startWorkout } = useGym();
  const startedRef = useRef(false);
  useEffect(() => {
    if (routineId && !activeWorkout && !startedRef.current) {
      startedRef.current = true;
      startWorkout(routineId);
    }
  }, [routineId, activeWorkout, startWorkout]);

  if (!activeWorkout) {
    return <Screen scroll={false}><View style={styles.loadingScreen}><Feather name="activity" size={34} color={colors.primary} /><Text style={[styles.loadingTitle, { color: colors.foreground }]}>Preparando tu entrenamiento</Text><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Elige una rutina para comenzar.</Text>{routines.map((routine) => <Pressable key={routine.id} onPress={() => startWorkout(routine.id)} style={[styles.routineChoice, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.routineChoiceName, { color: colors.foreground }]}>{routine.name}</Text><Text style={[styles.routineChoiceMeta, { color: colors.mutedForeground }]}>{routine.exercises.length} ejercicios</Text><Feather name="chevron-right" size={19} color={colors.primary} /></Pressable>)}<Button label="Volver" variant="ghost" icon="arrow-left" onPress={() => router.back()} /></View></Screen>;
  }
  return <TrainingSession />;
}

function TrainingSession() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeWorkout, routines, exercises, settings, getPreviousSets, getBestWeight, completeSet, editSet, deleteSet, setCurrentExercise, startRest, pauseRest, addRestSeconds, skipRest, finishWorkout } = useGym();
  const [now, setNow] = useState(Date.now());
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; set: WorkoutSet } | null>(null);
  const workout = activeWorkout!;
  const routine = routines.find((item) => item.id === workout.routineId);
  const current = workout.exercises[workout.currentExerciseIndex];
  const currentExercise = exercises.find((item) => item.id === current?.exerciseId);
  const routineItem = routine?.exercises.find((item) => item.exerciseId === current?.exerciseId);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - workout.startedAt) / 1000));
  const restRemaining = workout.restTimer?.endAt ? Math.max(0, Math.ceil((workout.restTimer.endAt - now) / 1000)) : workout.restTimer?.remainingSeconds ?? 0;
  const restFinishedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!workout.restTimer) {
      restFinishedRef.current = null;
      return;
    }
    if (workout.restTimer && restRemaining === 0 && restFinishedRef.current !== workout.restTimer.exerciseId) {
      restFinishedRef.current = workout.restTimer.exerciseId;
      notifyRestFinished(settings);
      skipRest();
    }
  }, [restRemaining, workout.restTimer, settings, skipRest]);
  const totalSets = workout.exercises.reduce((sum, item) => sum + item.sets.length, 0);
  const plannedSets = routine?.exercises.reduce((sum, item) => sum + item.sets, 0) ?? 0;
  const previousSets = current ? getPreviousSets(current.exerciseId) : [];
  const defaultWeight = previousSets[0]?.weight ?? 0;
  const [weight, setWeight] = useState(String(defaultWeight || ''));
  const [reps, setReps] = useState('');

  if (!current || !currentExercise || !routineItem) return null;

  const complete = () => {
    const parsedWeight = Number(weight.replace(',', '.'));
    const parsedReps = Number(reps);
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0 || !Number.isFinite(parsedReps) || parsedReps <= 0) return Alert.alert('Completa la serie', 'Ingresa un peso y una cantidad de repeticiones válidos.');
    const previousBest = getBestWeight(current.exerciseId);
    completeSet(current.exerciseId, parsedWeight, parsedReps);
    startRest(current.exerciseId, routineItem.restSeconds || settings.defaultRestSeconds);
    setReps('');
    if (parsedWeight > previousBest) Alert.alert('Nuevo récord personal', `${currentExercise.name}: ${parsedWeight} ${settings.weightUnit}`, [{ text: 'Seguir entrenando' }]);
  };
  const finish = () => {
    const pending = plannedSets > totalSets;
    const action = () => {
      const summary = `${workout.routineName}\n${duration(elapsed)} · ${totalSets} series`;
      finishWorkout();
      Alert.alert('Entrenamiento guardado', summary, [{ text: 'Ver historial', onPress: () => router.replace('/history') }]);
    };
    if (pending) Alert.alert('Hay ejercicios pendientes', 'Todavía quedan series sin registrar. ¿Finalizar de todos modos?', [{ text: 'Continuar entrenando', style: 'cancel' }, { text: 'Finalizar', style: 'destructive', onPress: action }]); else action();
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}><IconButton icon="x" label="Salir" onPress={() => Alert.alert('Salir del entrenamiento', 'Tu sesión actual se perderá.', [{ text: 'Seguir', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: () => { skipRest(); router.back(); } }])} /><View style={styles.topCopy}><Text style={[styles.topTitle, { color: colors.foreground }]}>{workout.routineName}</Text><Text style={[styles.topMeta, { color: colors.mutedForeground }]}>{clock(elapsed)} · {totalSets}/{plannedSets} series</Text></View><Pressable onPress={finish} style={({ pressed }) => [styles.finishBtn, { opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.finishText, { color: colors.primary }]}>Finalizar</Text></Pressable></View>
    {workout.restTimer ? <RestPanel remaining={restRemaining} paused={workout.restTimer.isPaused} onPause={pauseRest} onAdd={() => addRestSeconds(15)} onSkip={skipRest} /> : <Screen><View style={styles.exerciseHeader}><Text style={[styles.exerciseGroup, { color: colors.primary }]}>{currentExercise.group.toUpperCase()}</Text><Text style={[styles.exerciseName, { color: colors.foreground }]}>{currentExercise.name}</Text><Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>{workout.currentExerciseIndex + 1} de {workout.exercises.length} · {routineItem.sets} series objetivo · {routineItem.restSeconds}s descanso</Text></View>
      <View style={[styles.previousCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.previousHeading}><Feather name="rotate-ccw" size={15} color={colors.primary} /><Text style={[styles.previousTitle, { color: colors.foreground }]}>Último entrenamiento</Text></View>{previousSets.length ? <View style={styles.previousSets}>{previousSets.map((set) => <Text style={[styles.previousSet, { color: colors.mutedForeground }]} key={set.id}>{set.weight} {settings.weightUnit} × {set.reps}</Text>)}</View> : <Text style={[styles.previousSet, { color: colors.mutedForeground }]}>No hay registros anteriores.</Text>}</View>
      <View style={styles.inputRow}><View style={styles.inputHalf}><Field label={`Peso (${settings.weightUnit})`} value={weight} onChangeText={setWeight} placeholder="0" keyboardType="decimal-pad" /></View><View style={styles.inputHalf}><Field label="Repeticiones" value={reps} onChangeText={setReps} placeholder={routineItem.targetReps} keyboardType="numeric" /></View></View>
      <Button label={`Completar serie ${current.sets.length + 1}`} icon="check" onPress={complete} />
      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Toca una serie registrada para editarla</Text>
      <View style={styles.setList}>{current.sets.map((set) => <Pressable key={set.id} onPress={() => setEditingSet({ exerciseId: current.exerciseId, set })} style={[styles.setRow, { backgroundColor: colors.secondary }]}><View style={[styles.setNumber, { backgroundColor: colors.accent }]}><Text style={[styles.setNumberText, { color: colors.accentForeground }]}>{set.setNumber}</Text></View><Text style={[styles.setValue, { color: colors.foreground }]}>{set.weight} {settings.weightUnit}</Text><Text style={[styles.setValue, { color: colors.foreground }]}>{set.reps} reps</Text><Feather name="edit-2" size={14} color={colors.mutedForeground} /></Pressable>)}</View>
      <View style={styles.exerciseNav}>{<Button label="Anterior" icon="chevron-left" variant="ghost" disabled={workout.currentExerciseIndex === 0} onPress={() => setCurrentExercise(workout.currentExerciseIndex - 1)} />}{<Button label={workout.currentExerciseIndex === workout.exercises.length - 1 ? 'Repetir ejercicio' : 'Siguiente'} icon="chevron-right" variant="secondary" onPress={() => setCurrentExercise((workout.currentExerciseIndex + 1) % workout.exercises.length)} />}</View>
    </Screen>}
    <Modal visible={editingSet !== null} transparent animationType="slide" onRequestClose={() => setEditingSet(null)}>{editingSet ? <SetEditor exerciseId={editingSet.exerciseId} set={editingSet.set} onClose={() => setEditingSet(null)} onSave={(nextWeight, nextReps) => { editSet(editingSet.exerciseId, editingSet.set.id, nextWeight, nextReps); setEditingSet(null); }} onDelete={() => { deleteSet(editingSet.exerciseId, editingSet.set.id); setEditingSet(null); }} /> : null}</Modal>
  </View>;
}

function RestPanel({ remaining, paused, onPause, onAdd, onSkip }: { remaining: number; paused: boolean; onPause: () => void; onAdd: () => void; onSkip: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <View style={[styles.restPanel, { paddingTop: insets.top + 20 }]}><View style={[styles.restOrb, { borderColor: colors.accent, backgroundColor: colors.card }]}><Text style={[styles.restOverline, { color: colors.mutedForeground }]}>DESCANSO</Text><Text style={[styles.restTime, { color: colors.foreground }]}>{clock(remaining)}</Text><Text style={[styles.restStatus, { color: colors.primary }]}>{paused ? 'En pausa' : 'Recupera y respira'}</Text></View><View style={styles.restActions}><View style={styles.restButtonRow}><Pressable onPress={onPause} style={({ pressed }) => [styles.restButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Feather name={paused ? 'play' : 'pause'} size={22} color={colors.foreground} /><Text style={[styles.restButtonText, { color: colors.foreground }]}>{paused ? 'Continuar' : 'Pausar'}</Text></Pressable><Pressable onPress={onAdd} style={({ pressed }) => [styles.restButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}><Feather name="plus" size={22} color={colors.foreground} /><Text style={[styles.restButtonText, { color: colors.foreground }]}>+15 seg</Text></Pressable></View><Pressable onPress={onSkip} style={({ pressed }) => [styles.restSkipButton, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><Feather name="skip-forward" size={18} color={colors.primary} /><Text style={[styles.restSkipText, { color: colors.primary }]}>Saltar descanso</Text></Pressable></View></View>;
}

function SetEditor({ set, onClose, onSave, onDelete }: { exerciseId: string; set: WorkoutSet; onClose: () => void; onSave: (weight: number, reps: number) => void; onDelete: () => void }) {
  const colors = useColors();
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));
  return <View style={styles.modalBackdrop}><View style={[styles.setModal, { backgroundColor: colors.card }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar serie {set.setNumber}</Text><IconButton icon="x" label="Cerrar" onPress={onClose} /></View><Field label="Peso" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" /><Field label="Repeticiones" value={reps} onChangeText={setReps} keyboardType="numeric" /><Button label="Guardar cambios" icon="check" onPress={() => onSave(Number(weight.replace(',', '.')), Number(reps))} /><Button label="Eliminar serie" icon="trash-2" variant="danger" onPress={() => Alert.alert('Eliminar serie', '¿Seguro que quieres eliminarla?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: onDelete }])} /></View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 18, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  topCopy: { flex: 1, marginLeft: 12 },
  topTitle: { fontSize: 15, fontWeight: '700' },
  topMeta: { fontSize: 11, marginTop: 3 },
  finishBtn: { paddingVertical: 10, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  finishText: { fontSize: 14, fontWeight: '800' },
  loadingScreen: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { fontSize: 21, fontWeight: '800', marginTop: 8 },
  loadingText: { fontSize: 13, marginBottom: 12 },
  routineChoice: { width: '100%', borderWidth: 1, borderRadius: 17, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  routineChoiceName: { flex: 1, fontSize: 15, fontWeight: '700' },
  routineChoiceMeta: { fontSize: 12, marginRight: 10 },
  exerciseHeader: { marginTop: 4, marginBottom: 20 },
  exerciseGroup: { fontSize: 11, letterSpacing: 1.3, fontWeight: '800' },
  exerciseName: { fontSize: 28, fontWeight: '800', marginTop: 8, letterSpacing: -0.6 },
  exerciseMeta: { fontSize: 12, marginTop: 7 },
  previousCard: { borderRadius: 18, borderWidth: 1, padding: 15, marginBottom: 18 },
  previousHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11 },
  previousTitle: { fontSize: 13, fontWeight: '700' },
  previousSets: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  previousSet: { fontSize: 12 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  tapHint: { fontSize: 11, textAlign: 'center', marginTop: 16 },
  setList: { gap: 8, marginTop: 9 },
  setRow: { borderRadius: 14, minHeight: 54, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  setNumber: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  setNumberText: { fontWeight: '800', fontSize: 13 },
  setValue: { fontSize: 13, fontWeight: '600', flex: 1 },
  exerciseNav: { flexDirection: 'row', gap: 9, marginTop: 24 },
  restPanel: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  restOrb: { width: 190, height: 190, borderRadius: 95, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  restOverline: { fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  restTime: { fontSize: 44, fontWeight: '800', marginTop: 8, letterSpacing: -1 },
  restStatus: { fontSize: 13, fontWeight: '600', marginTop: 7 },
  restActions: { width: '100%', gap: 12, marginTop: 32 },
  restButtonRow: { flexDirection: 'row', gap: 10 },
  restButton: { flex: 1, minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  restButtonText: { fontSize: 14, fontWeight: '700' },
  restSkipButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  restSkipText: { fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  setModal: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 8, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
});