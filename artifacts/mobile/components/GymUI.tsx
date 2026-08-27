import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const colors = useColors();
  const Container = scroll ? ScrollView : View;
  return <Container style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={scroll ? styles.content : undefined} showsVerticalScrollIndicator={false}>{children}</Container>;
}

export function Header({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.header}>
    <View style={styles.headerCopy}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
    {action && onAction ? <Pressable onPress={onAction} style={({ pressed }) => [styles.headerAction, { backgroundColor: colors.accent, opacity: pressed ? 0.75 : 1 }]}><Feather name="plus" size={20} color={colors.accentForeground} /></Pressable> : null}
  </View>;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled = false }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: keyof typeof Feather.glyphMap; disabled?: boolean }) {
  const colors = useColors();
  const background = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.destructive : variant === 'secondary' ? colors.secondary : 'transparent';
  const foreground = variant === 'primary' ? colors.primaryForeground : variant === 'danger' ? colors.destructiveForeground : variant === 'secondary' ? colors.secondaryForeground : colors.primary;
  return <Pressable testID={`button-${label}`} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.72 : 1, borderColor: variant === 'ghost' ? colors.border : background, borderWidth: variant === 'ghost' ? 1 : 0 }]}>{icon ? <Feather name={icon} size={18} color={foreground} /> : null}<Text style={[styles.buttonText, { color: foreground }]}>{label}</Text></Pressable>;
}

export function IconButton({ icon, onPress, label }: { icon: keyof typeof Feather.glyphMap; onPress: () => void; label: string }) {
  const colors = useColors();
  return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.65 : 1 }]}><Feather name={icon} size={19} color={colors.foreground} /></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; multiline?: boolean }) {
  const colors = useColors();
  return <View style={styles.field}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} keyboardType={keyboardType} multiline={multiline} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input, minHeight: multiline ? 90 : undefined, textAlignVertical: multiline ? 'top' : 'center' }]} /></View>;
}

export function SectionTitle({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return <View style={styles.sectionTitle}><Text style={[styles.sectionText, { color: colors.foreground }]}>{children}</Text>{action && onAction ? <Pressable onPress={onAction}><Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text></Pressable> : null}</View>;
}

export function StatCard({ value, label, icon }: { value: string; label: string; icon: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.statIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={17} color={colors.primary} /></View><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

export function EmptyState({ icon, title, description }: { icon: keyof typeof Feather.glyphMap; title: string; description: string }) {
  const colors = useColors();
  return <View style={[styles.empty, { borderColor: colors.border }]}><Feather name={icon} size={30} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{description}</Text></View>;
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 118 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  headerCopy: { flex: 1 },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  headerAction: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  button: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 7, letterSpacing: 0.2 },
  input: { borderWidth: 1, borderRadius: 13, minHeight: 50, paddingHorizontal: 15, fontSize: 16 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13, marginTop: 22 },
  sectionText: { fontSize: 18, fontWeight: '700' },
  actionText: { fontSize: 13, fontWeight: '700' },
  statCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 116 },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 23, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  empty: { minHeight: 180, borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6, maxWidth: 280 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});