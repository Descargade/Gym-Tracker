import AsyncStorage from '@react-native-async-storage/async-storage';
import { GymState } from '@/types/models';

const STORAGE_KEY = 'gym-tracker-state-v1';

const generateUserId = () => 'USR-' + Math.random().toString(36).slice(2, 8);

export async function loadGymState(): Promise<GymState | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as GymState;
    if (!parsed.settings?.userId) {
      parsed.settings.userId = generateUserId();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveGymState(state: GymState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}