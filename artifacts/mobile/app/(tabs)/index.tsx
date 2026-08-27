import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { Button, Header, Screen, SectionTitle, StatCard } from '@/components/GymUI';

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min`;
const isThisWeek = (timestamp: number) => Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;

export default function HomeScreen() {
  const colors = useColors();
  const { settings, routines, workouts, exercises } = useGym();
  const weekWorkouts = workouts.filter((workout) => isThisWeek(workout.startedAt));
  const latest = workouts[0];
  const featured = routines[0];
  const totalVolume = workouts.flatMap((workout) => workout.exercises.flatMap((exercise) => exercise.sets)).reduce((total, set) => total + set.weight * set.reps, 0);

  return <Screen>
    <Header title={`Hola, ${settings.name}`} subtitle="¿Listo para entrenar?" />
    <View style={[styles.hero, { backgroundColor: colors.primary }]}>
      <View style={styles.heroCopy}><Text style={[styles.overline, { color: colors.primaryForeground }]}>ENTRENAMIENTO DE HOY</Text><Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>{featured?.name ?? 'Crea tu primera rutina'}</Text><Text style={[styles.heroMeta, { color: colors.primaryForeground }]}>{featured ? `${featured.exercises.length} ejercicios · ${featured.exercises.reduce((sum, item) => sum + item.sets, 0)} series` : 'Empieza con una rutina personalizada'}</Text></View>
      <View style={[styles.heroMark, { backgroundColor: colors.accent }]}><Feather name="activity" size={27} color={colors.accentForeground} /></View>
      <Button label="Comenzar entrenamiento" icon="play" onPress={() => featured ? router.push({ pathname: '/train', params: { routineId: featured.id } }) : router.push('/routines')} />
    </View>
    <View style={styles.statsRow}><StatCard icon="calendar" value={`${weekWorkouts.length}`} label="Esta semana" /><View style={styles.statGap} /><StatCard icon="clock" value={formatDuration(weekWorkouts.reduce((sum, item) => sum + item.durationSeconds, 0))} label="Tiempo entrenado" /></View>
    <SectionTitle action="Ver historial" onAction={() => router.push('/history')}>Resumen de actividad</SectionTitle>
    <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.summaryLine}><View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}><Feather name="trending-up" size={18} color={colors.primary} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>{latest ? latest.routineName : 'Tu progreso empieza aquí'}</Text><Text style={[styles.summaryMeta, { color: colors.mutedForeground }]}>{latest ? `${formatDuration(latest.durationSeconds)} · ${latest.exercises.reduce((sum, item) => sum + item.sets.length, 0)} series` : 'Registra tu primer entrenamiento para ver avances'}</Text></View></View>
      <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${Math.min(100, Math.max(10, workouts.length * 12))}%` }]} /></View>
      <Text style={[styles.progressCaption, { color: colors.mutedForeground }]}>{exercises.length} ejercicios disponibles · {Math.round(totalVolume)} {settings.weightUnit} de volumen total</Text>
    </View>
    <SectionTitle action="Ver ejercicios" onAction={() => router.push('/exercises')}>Accesos rápidos</SectionTitle>
    <View style={styles.quickRow}><QuickAction icon="list" label="Mis rutinas" onPress={() => router.push('/routines')} /><QuickAction icon="bar-chart-2" label="Mi progreso" onPress={() => router.push('/progress')} /><QuickAction icon="settings" label="Configuración" onPress={() => router.push('/settings')} /></View>
  </Screen>;
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}><Feather name={icon} size={20} color={colors.primary} /><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 19, marginBottom: 16, overflow: 'hidden' },
  heroCopy: { marginBottom: 20 },
  overline: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, opacity: 0.78 },
  heroTitle: { fontSize: 26, fontWeight: '800', marginTop: 9, letterSpacing: -0.5 },
  heroMeta: { fontSize: 13, marginTop: 7, opacity: 0.78 },
  heroMark: { position: 'absolute', right: 20, top: 20, width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row' },
  statGap: { width: 10 },
  summary: { borderRadius: 20, borderWidth: 1, padding: 17 },
  summaryLine: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  summaryCopy: { flex: 1 },
  summaryTitle: { fontSize: 15, fontWeight: '700' },
  summaryMeta: { fontSize: 12, marginTop: 4 },
  progressTrack: { height: 7, borderRadius: 8, overflow: 'hidden', marginTop: 17 },
  progressFill: { height: '100%', borderRadius: 8 },
  progressCaption: { fontSize: 12, marginTop: 9 },
  quickRow: { flexDirection: 'row', gap: 9 },
  quick: { flex: 1, minHeight: 82, borderRadius: 17, borderWidth: 1, padding: 12, justifyContent: 'space-between' },
  quickLabel: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
});
