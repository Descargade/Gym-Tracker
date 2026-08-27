import AsyncStorage from '@react-native-async-storage/async-storage';
import { GymState } from '@/types/models';

const STORAGE_KEY = 'gym-tracker-state-v1';

export async function loadGymState(): Promise<GymState | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GymState;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveGymState(state: GymState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}