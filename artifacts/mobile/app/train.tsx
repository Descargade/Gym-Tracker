import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym, notifyRestFinished } from '@/context/GymContext';
import { Button, Field, IconButton, Screen } from '@/components/GymUI';
import { Workout, WorkoutSet } from '@/types/models';

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const duration = (seconds: number) => `${Math.floor(seconds / 60)} min`;

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
} | null;

export default function TrainScreen() {
  const colors = useColors();
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const { activeWorkout, routines, startWorkout } = useGym();
  const startedRef = useRef(false);
  const [finishedWorkout, setFinishedWorkout] = useState<Workout | null>(null);
  useEffect(() => {
    if (routineId && !activeWorkout && !startedRef.current) {
      startedRef.current = true;
      startWorkout(routineId);
    }
  }, [routineId, activeWorkout, startWorkout]);

  if (finishedWorkout) {
    const totalSets = finishedWorkout.exercises.reduce((sum, item) => sum + item.sets.length, 0);
    return (
      <Screen scroll={false}>
        <View style={styles.summaryScreen}>
          <View style={[styles.summaryIconWrap, { backgroundColor: colors.secondary }]}>
            <Feather name="check-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.summaryOverline, { color: colors.primary }]}>ENTRENAMIENTO COMPLETADO</Text>
          <Text style={[styles.summaryRoutine, { color: colors.foreground }]}>{finishedWorkout.routineName}</Text>
          <View style={styles.summaryStats}>
            <View style={[styles.summaryStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.foreground }]}>{duration(finishedWorkout.durationSeconds)}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.mutedForeground }]}>Duración</Text>
            </View>
            <View style={[styles.summaryStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryStatValue, { color: colors.foreground }]}>{totalSets}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.mutedForeground }]}>Series</Text>
            </View>
          </View>
          <View style={styles.summaryActions}>
            <Button label="Ver historial" icon="clock" onPress={() => { setFinishedWorkout(null); router.replace('/(tabs)/history'); }} />
            <Button label="Volver al inicio" variant="ghost" icon="home" onPress={() => { setFinishedWorkout(null); router.replace('/(tabs)'); }} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!activeWorkout) {
    return <Screen scroll={false}><View style={styles.loadingScreen}><Feather name="activity" size={34} color={colors.primary} /><Text style={[styles.loadingTitle, { color: colors.foreground }]}>Preparando tu entrenamiento</Text><Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Elige una rutina para comenzar.</Text>{routines.map((routine) => <Pressable key={routine.id} onPress={() => startWorkout(routine.id)} style={[styles.routineChoice, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.routineChoiceName, { color: colors.foreground }]}>{routine.name}</Text><Text style={[styles.routineChoiceMeta, { color: colors.mutedForeground }]}>{routine.exercises.length} ejercicios</Text><Feather name="chevron-right" size={19} color={colors.primary} /></Pressable>)}<Button label="Volver" variant="ghost" icon="arrow-left" onPress={() => router.back()} /></View></Screen>;
  }
  return <TrainingSession onFinished={(workout) => setFinishedWorkout(workout)} />;
}

function ConfirmDialogOverlay({ dialog, colors, onCancel }: { dialog: ConfirmDialog; colors: ReturnType<typeof useColors>; onCancel: () => void }) {
  if (!dialog) return null;
  return (
    <View style={confirmStyles.backdrop}>
      <View style={[confirmStyles.card, { backgroundColor: colors.card }]}>
        <Text style={[confirmStyles.title, { color: colors.foreground }]}>{dialog.title}</Text>
        <Text style={[confirmStyles.message, { color: colors.mutedForeground }]}>{dialog.message}</Text>
        <View style={confirmStyles.actions}>
          <Pressable onPress={onCancel} style={[confirmStyles.btn, { backgroundColor: colors.secondary }]}><Text style={[confirmStyles.btnText, { color: colors.foreground }]}>Cancelar</Text></Pressable>
          <Pressable onPress={() => { dialog.onConfirm(); onCancel(); }} style={[confirmStyles.btn, { backgroundColor: colors.destructive }]}><Text style={[confirmStyles.btnText, { color: colors.destructiveForeground }]}>{dialog.confirmLabel || 'Confirmar'}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const confirmStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10000 },
  card: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 14, fontWeight: '700' },
});

function TrainingSession({ onFinished }: { onFinished: (workout: Workout) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeWorkout, routines, exercises, settings, getPreviousSets, getBestWeight, completeSet, editSet, deleteSet, setCurrentExercise, startRest, pauseRest, addRestSeconds, skipRest, finishWorkout, cancelWorkout } = useGym();
  const [now, setNow] = useState(Date.now());
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; set: WorkoutSet } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recordAlert, setRecordAlert] = useState<string | null>(null);
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
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0 || !Number.isFinite(parsedReps) || parsedReps <= 0) { setValidationError('Ingresa un peso y una cantidad de repeticiones válidos.'); return; }
    const previousBest = getBestWeight(current.exerciseId);
    completeSet(current.exerciseId, parsedWeight, parsedReps);
    startRest(current.exerciseId, routineItem.restSeconds || settings.defaultRestSeconds);
    setReps('');
    if (parsedWeight > previousBest) setRecordAlert(`${currentExercise.name}: ${parsedWeight} ${settings.weightUnit}`);
  };

  const finish = () => {
    const pending = plannedSets > totalSets;
    const action = () => {
      skipRest();
      const finished = finishWorkout();
      if (finished) onFinished(finished);
    };
    if (pending) {
      setConfirmDialog({ title: '¿Querés finalizar?', message: 'Todavía quedan series sin registrar.', confirmLabel: 'Finalizar', onConfirm: action });
    } else {
      action();
    }
  };

  const exit = () => {
    setConfirmDialog({ title: '¿Salir del entrenamiento?', message: 'El entrenamiento actual todavía no terminó. Se perderá el progreso.', confirmLabel: 'Salir', onConfirm: () => { skipRest(); cancelWorkout(); router.back(); } });
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}><IconButton icon="x" label="Salir" onPress={exit} /><View style={styles.topCopy}><Text style={[styles.topTitle, { color: colors.foreground }]}>{workout.routineName}</Text><Text style={[styles.topMeta, { color: colors.mutedForeground }]}>{clock(elapsed)} · {totalSets}/{plannedSets} series</Text></View><Pressable onPress={finish} style={({ pressed }) => [styles.finishBtn, { opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.finishText, { color: colors.primary }]}>Finalizar</Text></Pressable></View>
    {workout.restTimer ? <RestPanel remaining={restRemaining} paused={workout.restTimer.isPaused} onPause={pauseRest} onAdd={() => addRestSeconds(15)} onSkip={skipRest} /> : <Screen><View style={styles.exerciseHeader}><Text style={[styles.exerciseGroup, { color: colors.primary }]}>{currentExercise.group.toUpperCase()}</Text><Text style={[styles.exerciseName, { color: colors.foreground }]}>{currentExercise.name}</Text><Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>{workout.currentExerciseIndex + 1} de {workout.exercises.length} · {routineItem.sets} series objetivo · {routineItem.restSeconds}s descanso</Text></View>
      <View style={[styles.previousCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.previousHeading}><Feather name="rotate-ccw" size={15} color={colors.primary} /><Text style={[styles.previousTitle, { color: colors.foreground }]}>Último entrenamiento</Text></View>{previousSets.length ? <View style={styles.previousSets}>{previousSets.map((set) => <Text style={[styles.previousSet, { color: colors.mutedForeground }]} key={set.id}>{set.weight} {settings.weightUnit} × {set.reps}</Text>)}</View> : <Text style={[styles.previousSet, { color: colors.mutedForeground }]}>No hay registros anteriores.</Text>}</View>
      <View style={styles.inputRow}><View style={styles.inputHalf}><Field label={`Peso (${settings.weightUnit})`} value={weight} onChangeText={setWeight} placeholder="0" keyboardType="decimal-pad" /></View><View style={styles.inputHalf}><Field label="Repeticiones" value={reps} onChangeText={setReps} placeholder={routineItem.targetReps} keyboardType="numeric" /></View></View>
      <Button label={`Completar serie ${current.sets.length + 1}`} icon="check" onPress={complete} />
      <Text style={[styles.tapHint, { color: colors.mutedForeground }]}>Toca una serie registrada para editarla</Text>
      <View style={styles.setList}>{current.sets.map((set) => <Pressable key={set.id} onPress={() => setEditingSet({ exerciseId: current.exerciseId, set })} style={[styles.setRow, { backgroundColor: colors.secondary }]}><View style={[styles.setNumber, { backgroundColor: colors.accent }]}><Text style={[styles.setNumberText, { color: colors.accentForeground }]}>{set.setNumber}</Text></View><Text style={[styles.setValue, { color: colors.foreground }]}>{set.weight} {settings.weightUnit}</Text><Text style={[styles.setValue, { color: colors.foreground }]}>{set.reps} reps</Text><Feather name="edit-2" size={14} color={colors.mutedForeground} /></Pressable>)}</View>
      <View style={styles.exerciseNav}>{<Button label="Anterior" icon="chevron-left" variant="ghost" disabled={workout.currentExerciseIndex === 0} onPress={() => setCurrentExercise(workout.currentExerciseIndex - 1)} />}{<Button label={workout.currentExerciseIndex === workout.exercises.length - 1 ? 'Repetir ejercicio' : 'Siguiente'} icon="chevron-right" variant="secondary" onPress={() => setCurrentExercise((workout.currentExerciseIndex + 1) % workout.exercises.length)} />}</View>
    </Screen>}
    {editingSet ? <View style={confirmStyles.backdrop}><SetEditor exerciseId={editingSet.exerciseId} set={editingSet.set} onClose={() => setEditingSet(null)} onSave={(nextWeight, nextReps) => { editSet(editingSet.exerciseId, editingSet.set.id, nextWeight, nextReps); setEditingSet(null); }} onDelete={() => { deleteSet(editingSet.exerciseId, editingSet.set.id); setEditingSet(null); }} /></View> : null}
    <ConfirmDialogOverlay dialog={confirmDialog} colors={colors} onCancel={() => setConfirmDialog(null)} />
    {validationError ? <View style={confirmStyles.backdrop}><View style={[confirmStyles.card, { backgroundColor: colors.card }]}><Text style={[confirmStyles.title, { color: colors.foreground }]}>Completa la serie</Text><Text style={[confirmStyles.message, { color: colors.mutedForeground }]}>{validationError}</Text><View style={confirmStyles.actions}><Pressable onPress={() => setValidationError(null)} style={[confirmStyles.btn, { backgroundColor: colors.primary }]}><Text style={[confirmStyles.btnText, { color: colors.primaryForeground }]}>Entendido</Text></Pressable></View></View></View> : null}
    {recordAlert ? <View style={confirmStyles.backdrop}><View style={[confirmStyles.card, { backgroundColor: colors.card }]}><Text style={[confirmStyles.title, { color: colors.foreground }]}>Nuevo récord personal</Text><Text style={[confirmStyles.message, { color: colors.mutedForeground }]}>{recordAlert}</Text><View style={confirmStyles.actions}><Pressable onPress={() => setRecordAlert(null)} style={[confirmStyles.btn, { backgroundColor: colors.primary }]}><Text style={[confirmStyles.btnText, { color: colors.primaryForeground }]}>Seguir entrenando</Text></Pressable></View></View></View> : null}
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  return <View style={[styles.setModal, { backgroundColor: colors.card }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar serie {set.setNumber}</Text><IconButton icon="x" label="Cerrar" onPress={onClose} /></View><Field label="Peso" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" /><Field label="Repeticiones" value={reps} onChangeText={setReps} keyboardType="numeric" /><Button label="Guardar cambios" icon="check" onPress={() => onSave(Number(weight.replace(',', '.')), Number(reps))} /><Button label="Eliminar serie" icon="trash-2" variant="danger" onPress={() => setConfirmDelete(true)} />
    {confirmDelete ? <View style={confirmStyles.backdrop}><View style={[confirmStyles.card, { backgroundColor: colors.card }]}>
          <Text style={[confirmStyles.title, { color: colors.foreground }]}>Eliminar serie</Text>
          <Text style={[confirmStyles.message, { color: colors.mutedForeground }]}>¿Seguro que quieres eliminarla?</Text>
          <View style={confirmStyles.actions}>
            <Pressable onPress={() => setConfirmDelete(false)} style={[confirmStyles.btn, { backgroundColor: colors.secondary }]}><Text style={[confirmStyles.btnText, { color: colors.foreground }]}>Cancelar</Text></Pressable>
            <Pressable onPress={() => { setConfirmDelete(false); onDelete(); }} style={[confirmStyles.btn, { backgroundColor: colors.destructive }]}><Text style={[confirmStyles.btnText, { color: colors.destructiveForeground }]}>Eliminar</Text></Pressable>
          </View>
        </View></View> : null}
  </View>;
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
  setModal: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, gap: 8, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  summaryScreen: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  summaryIconWrap: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryOverline: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  summaryRoutine: { fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  summaryStats: { flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' },
  summaryStat: { flex: 1, borderRadius: 17, borderWidth: 1, padding: 16, alignItems: 'center' },
  summaryStatValue: { fontSize: 20, fontWeight: '800' },
  summaryStatLabel: { fontSize: 12, marginTop: 4 },
  summaryActions: { width: '100%', gap: 9, marginTop: 24 },
});
