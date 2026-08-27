import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { useGym } from '@/context/GymContext';

/**
 * Returns the design tokens for the current color scheme.
 *
 * Reads the user's theme preference from GymContext (persisted in
 * AsyncStorage) and falls back to the OS preference when no explicit
 * choice has been saved.
 */
export function useColors() {
  const { settings } = useGym();
  const systemScheme = useColorScheme();
  const theme = settings.theme || systemScheme || 'dark';
  const palette = theme === 'dark' ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
