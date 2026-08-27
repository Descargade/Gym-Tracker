import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { EmptyState, Header, Screen, SectionTitle, StatCard } from '@/components/GymUI';

export default function ProgressScreen() {
  const colors = useColors();
  const { workouts, exercises, settings } = useGym();
  const thisWeek = workouts.filter((item) => Date.now() - item.startedAt < 7 * 24 * 60 * 60 * 1000);
  const allSets = workouts.flatMap((workout) => workout.exercises.flatMap((item) => item.sets));
  const volume = allSets.reduce((sum, set) => sum + set.weight * set.reps, 0);
  const bests = exercises.map((exercise) => ({ exercise, best: allSets.filter((set) => workouts.some((workout) => workout.exercises.some((item) => item.exerciseId === exercise.id && item.sets.some((candidate) => candidate.id === set.id)))).reduce((best, set) => Math.max(best, set.weight), 0) })).filter((item) => item.best > 0).sort((a, b) => b.best - a.best).slice(0, 5);
  return <Screen><Header title="Progreso" subtitle="La constancia se convierte en fuerza" /><View style={styles.statsGrid}><StatCard icon="activity" value={`${workouts.length}`} label="Entrenamientos totales" /><StatCard icon="calendar" value={`${thisWeek.length}`} label="Esta semana" /></View><View style={[styles.bigStat, { backgroundColor: colors.primary }]}><Text style={[styles.bigLabel, { color: colors.primaryForeground }]}>VOLUMEN TOTAL</Text><Text style={[styles.bigValue, { color: colors.primaryForeground }]}>{Math.round(volume).toLocaleString('es-AR')} {settings.weightUnit}</Text><View style={[styles.miniTrack, { backgroundColor: colors.secondary }]}><View style={[styles.miniFill, { width: `${Math.min(100, workouts.length * 10)}%`, backgroundColor: colors.accent }]} /></View><Text style={[styles.bigMeta, { color: colors.primaryForeground }]}>Sigue sumando sesiones para superar tu marca</Text></View><SectionTitle>Mejores pesos</SectionTitle>{bests.length === 0 ? <EmptyState icon="bar-chart-2" title="Tus récords aparecerán aquí" description="Completa series durante tus entrenamientos para empezar a medir tu progreso." /> : <View style={[styles.records, { backgroundColor: colors.card, borderColor: colors.border }]}>{bests.map((item, index) => <View key={item.exercise.id} style={styles.record}><View style={[styles.rank, { backgroundColor: colors.secondary }]}><Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text></View><View style={styles.recordCopy}><Text style={[styles.recordName, { color: colors.foreground }]}>{item.exercise.name}</Text><Text style={[styles.recordMeta, { color: colors.mutedForeground }]}>{item.exercise.group}</Text></View><Text style={[styles.recordBest, { color: colors.foreground }]}>{item.best} <Text style={[styles.unit, { color: colors.mutedForeground }]}>{settings.weightUnit}</Text></Text></View>)}</View>}{workouts.length > 0 ? <><SectionTitle>Actividad reciente</SectionTitle><View style={styles.chart}>{workouts.slice(0, 7).reverse().map((workout, index) => { const height = Math.max(18, Math.min(110, workout.exercises.flatMap((item) => item.sets).reduce((sum, set) => sum + set.weight * set.reps, 0) / 20)); return <View key={workout.id} style={styles.barWrap}><View style={[styles.bar, { height, backgroundColor: colors.accent }]} /><Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{index + 1}</Text></View>; })}</View></> : null}</Screen>;
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  bigStat: { borderRadius: 21, padding: 19, marginTop: 2 },
  bigLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3, opacity: 0.75 },
  bigValue: { fontSize: 32, fontWeight: '800', marginTop: 8, letterSpacing: -1 },
  miniTrack: { height: 6, borderRadius: 5, marginTop: 18, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: 5 },
  bigMeta: { fontSize: 11, opacity: 0.7, marginTop: 9 },
  records: { borderRadius: 19, borderWidth: 1, padding: 8 },
  record: { minHeight: 61, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, gap: 10 },
  rank: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  recordCopy: { flex: 1 },
  recordName: { fontSize: 13, fontWeight: '700' },
  recordMeta: { fontSize: 11, marginTop: 3 },
  recordBest: { fontSize: 17, fontWeight: '800' },
  unit: { fontSize: 11, fontWeight: '500' },
  chart: { height: 155, borderBottomWidth: 1, borderLeftWidth: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 1 },
  barWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 140, gap: 7, flex: 1 },
  bar: { width: '70%', maxWidth: 28, borderRadius: 8 },
  barLabel: { fontSize: 10 },
});