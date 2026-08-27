import React, { useEffect, useState } from 'react';
import { Alert, Appearance, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGym } from '@/context/GymContext';
import { Button, Field, Header, Screen } from '@/components/GymUI';

const restOptions = [30, 45, 60, 90, 120, 180];

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings } = useGym();
  const [name, setName] = useState(settings.name);
  useEffect(() => setName(settings.name), [settings.name]);
  const save = () => {
    if (!name.trim()) return Alert.alert('Falta tu nombre', 'Escribe un nombre para personalizar el saludo.');
    updateSettings({ name: name.trim() });
    Alert.alert('Guardado', 'Tus preferencias se actualizaron.');
  };
  const setTheme = (theme: 'light' | 'dark') => {
    updateSettings({ theme });
    Appearance.setColorScheme(theme);
  };
  return <Screen><View style={styles.headerRow}><Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><Header title="Configuración" subtitle="Haz Gym Tracker tuyo" /></View><Field label="Tu nombre" value={name} onChangeText={setName} placeholder="Ej. Martín" /><Button label="Guardar nombre" icon="check" onPress={save} /><PreferenceSection title="Entrenamiento"><Text style={[styles.label, { color: colors.mutedForeground }]}>Descanso predeterminado</Text><View style={styles.options}>{restOptions.map((seconds) => <Pressable key={seconds} onPress={() => updateSettings({ defaultRestSeconds: seconds })} style={[styles.option, { backgroundColor: settings.defaultRestSeconds === seconds ? colors.accent : colors.secondary }]}><Text style={{ color: settings.defaultRestSeconds === seconds ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: '700' }}>{seconds}s</Text></Pressable>)}</View></PreferenceSection><PreferenceRow label="Sonido del temporizador" icon="volume-2" value={settings.timerSound} onChange={(value) => updateSettings({ timerSound: value })} /><PreferenceRow label="Vibración al terminar" icon="smartphone" value={settings.vibration} onChange={(value) => updateSettings({ vibration: value })} /><PreferenceSection title="Apariencia"><Text style={[styles.label, { color: colors.mutedForeground }]}>Tema de la aplicación</Text><View style={styles.themeRow}><ThemeButton label="Oscuro" icon="moon" active={settings.theme === 'dark'} onPress={() => setTheme('dark')} /><ThemeButton label="Claro" icon="sun" active={settings.theme === 'light'} onPress={() => setTheme('light')} /></View></PreferenceSection><PreferenceSection title="Unidades"><Text style={[styles.label, { color: colors.mutedForeground }]}>Unidad de peso</Text><View style={styles.themeRow}><ThemeButton label="Kilogramos (kg)" icon="activity" active={settings.weightUnit === 'kg'} onPress={() => updateSettings({ weightUnit: 'kg' })} /><ThemeButton label="Libras (lb)" icon="bar-chart-2" active={settings.weightUnit === 'lb'} onPress={() => updateSettings({ weightUnit: 'lb' })} /></View></PreferenceSection><View style={[styles.note, { backgroundColor: colors.secondary }]}><Feather name="shield" size={16} color={colors.primary} /><Text style={[styles.noteText, { color: colors.mutedForeground }]}>Tus datos se guardan en este dispositivo. No necesitas una cuenta para entrenar.</Text></View></Screen>;
}

function PreferenceSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>{children}</View>;
}

function PreferenceRow({ label, icon, value, onChange }: { label: string; icon: keyof typeof Feather.glyphMap; value: boolean; onChange: (value: boolean) => void }) {
  const colors = useColors();
  return <View style={[styles.preferenceRow, { borderBottomColor: colors.border }]}><View style={[styles.preferenceIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={16} color={colors.primary} /></View><Text style={[styles.preferenceLabel, { color: colors.foreground }]}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: colors.secondary, true: colors.accent }} thumbColor={value ? colors.primary : colors.mutedForeground} /></View>;
}

function ThemeButton({ label, icon, active, onPress }: { label: string; icon: keyof typeof Feather.glyphMap; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.themeButton, { backgroundColor: active ? colors.accent : colors.secondary, borderColor: active ? colors.accent : colors.border }]}><Feather name={icon} size={17} color={active ? colors.accentForeground : colors.mutedForeground} /><Text style={{ color: active ? colors.accentForeground : colors.mutedForeground, fontSize: 12, fontWeight: '700', flex: 1 }}>{label}</Text>{active ? <Feather name="check" size={16} color={colors.accentForeground} /> : null}</Pressable>;
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 2 },
  section: { marginTop: 27 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 13 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 9 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, minHeight: 46, justifyContent: 'center' },
  preferenceRow: { minHeight: 68, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  preferenceIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  preferenceLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  themeRow: { gap: 9 },
  themeButton: { borderWidth: 1, minHeight: 50, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  note: { borderRadius: 15, padding: 14, flexDirection: 'row', gap: 10, marginTop: 29, marginBottom: 20 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});