import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { EmptyState, Header, IconButton, Screen } from '@/components/GymUI';
import { Workout } from '@/types/models';

const dateLabel = (timestamp: number) => new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(timestamp)).replace('.', '').toUpperCase();

export default function HistoryScreen() {
  const colors = useColors();
  const { workouts } = useGym();
  const [selected, setSelected] = useState<Workout | null>(null);
  return <Screen><Header title="Historial" subtitle="Tu recorrido, una sesión a la vez" />{workouts.length === 0 ? <EmptyState icon="clock" title="Todavía no hay entrenamientos" description="Cuando termines una sesión, aparecerá aquí con todos sus detalles." /> : workouts.map((workout) => { const sets = workout.exercises.reduce((sum, item) => sum + item.sets.length, 0); const volume = workout.exercises.flatMap((item) => item.sets).reduce((sum, set) => sum + set.weight * set.reps, 0); return <Pressable key={workout.id} onPress={() => setSelected(workout)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}><View style={[styles.date, { backgroundColor: colors.secondary }]}><Text style={[styles.dateText, { color: colors.primary }]}>{dateLabel(workout.startedAt)}</Text></View><View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]}>{workout.routineName}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{Math.floor(workout.durationSeconds / 60)} min · {sets} series · {Math.round(volume)} kg</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>; })}<Modal visible={selected !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>{selected ? <WorkoutDetail workout={selected} onClose={() => setSelected(null)} /> : null}</Modal></Screen>;
}

function WorkoutDetail({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const colors = useColors();
  const { exercises, settings } = useGym();
  return <Screen><View style={styles.detailHeader}><View><Text style={[styles.detailTitle, { color: colors.foreground }]}>{workout.routineName}</Text><Text style={[styles.detailDate, { color: colors.mutedForeground }]}>{new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(new Date(workout.startedAt))}</Text></View><IconButton icon="x" label="Cerrar" onPress={onClose} /></View><View style={styles.detailStats}><DetailStat label="Duración" value={`${Math.floor(workout.durationSeconds / 60)} min`} /><DetailStat label="Series" value={`${workout.exercises.reduce((sum, item) => sum + item.sets.length, 0)}`} /><DetailStat label="Volumen" value={`${Math.round(workout.exercises.flatMap((item) => item.sets).reduce((sum, set) => sum + set.weight * set.reps, 0))} ${settings.weightUnit}`} /></View>{workout.exercises.map((item) => { const exercise = exercises.find((candidate) => candidate.id === item.exerciseId); return <View key={item.exerciseId} style={[styles.detailExercise, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.detailExerciseName, { color: colors.foreground }]}>{exercise?.name}</Text>{item.sets.map((set) => <Text key={set.id} style={[styles.detailSet, { color: colors.mutedForeground }]}>Serie {set.setNumber} · {set.weight} {settings.weightUnit} × {set.reps}</Text>)}</View>; })}</Screen>;
}

function DetailStat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return <View style={styles.detailStat}><Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 19, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  date: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  dateText: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  copy: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 5 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  detailTitle: { fontSize: 26, fontWeight: '800' },
  detailDate: { fontSize: 12, marginTop: 5 },
  detailStats: { flexDirection: 'row', gap: 9, marginBottom: 19 },
  detailStat: { flex: 1, padding: 13, borderRadius: 15, backgroundColor: 'transparent' },
  detailValue: { fontSize: 17, fontWeight: '800' },
  detailLabel: { fontSize: 11, marginTop: 4 },
  detailExercise: { borderRadius: 17, borderWidth: 1, padding: 15, marginBottom: 10 },
  detailExerciseName: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  detailSet: { fontSize: 12, lineHeight: 22 },
});