import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { initialState } from '@/data/seed';
import { loadGymState, saveGymState } from '@/services/storage';
import {
  ActiveWorkout,
  Exercise,
  GymState,
  RestTimer,
  Routine,
  RoutineExercise,
  Settings,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from '@/types/models';

interface GymContextValue extends GymState {
  hydrated: boolean;
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, exercise: Omit<Exercise, 'id'>) => void;
  deleteExercise: (id: string) => void;
  addRoutine: (name: string, exercises: RoutineExercise[]) => void;
  updateRoutine: (id: string, name: string, exercises: RoutineExercise[]) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (id: string) => void;
  moveRoutineExercise: (routineId: string, index: number, direction: -1 | 1) => void;
  startWorkout: (routineId: string) => void;
  completeSet: (exerciseId: string, weight: number, reps: number) => void;
  editSet: (exerciseId: string, setId: string, weight: number, reps: number) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  setCurrentExercise: (index: number) => void;
  startRest: (exerciseId: string, seconds: number) => void;
  pauseRest: () => void;
  addRestSeconds: (seconds: number) => void;
  skipRest: () => void;
  finishWorkout: () => Workout | null;
  updateSettings: (settings: Partial<Settings>) => void;
  getPreviousSets: (exerciseId: string) => WorkoutSet[];
  getBestWeight: (exerciseId: string) => number;
}

const GymContext = createContext<GymContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GymState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadGymState()
      .then((stored) => {
        if (stored) setState(stored);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) saveGymState(state).catch(() => undefined);
  }, [state, hydrated]);

  const update = useCallback((mutator: (current: GymState) => GymState) => {
    setState((current) => mutator(current));
  }, []);

  const addExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    update((current) => ({ ...current, exercises: [...current.exercises, { ...exercise, id: makeId('exercise') }] }));
  }, [update]);

  const updateExercise = useCallback((id: string, exercise: Omit<Exercise, 'id'>) => {
    update((current) => ({ ...current, exercises: current.exercises.map((item) => item.id === id ? { ...exercise, id } : item) }));
  }, [update]);

  const deleteExercise = useCallback((id: string) => {
    update((current) => ({
      ...current,
      exercises: current.exercises.filter((item) => item.id !== id),
      routines: current.routines.map((routine) => ({ ...routine, exercises: routine.exercises.filter((item) => item.exerciseId !== id) })),
    }));
  }, [update]);

  const addRoutine = useCallback((name: string, exercises: RoutineExercise[]) => {
    update((current) => ({ ...current, routines: [...current.routines, { id: makeId('routine'), name, exercises, updatedAt: Date.now() }] }));
  }, [update]);

  const updateRoutine = useCallback((id: string, name: string, exercises: RoutineExercise[]) => {
    update((current) => ({ ...current, routines: current.routines.map((routine) => routine.id === id ? { ...routine, name, exercises, updatedAt: Date.now() } : routine) }));
  }, [update]);

  const deleteRoutine = useCallback((id: string) => {
    update((current) => ({ ...current, routines: current.routines.filter((routine) => routine.id !== id) }));
  }, [update]);

  const duplicateRoutine = useCallback((id: string) => {
    update((current) => {
      const original = current.routines.find((routine) => routine.id === id);
      if (!original) return current;
      return { ...current, routines: [...current.routines, { ...original, id: makeId('routine'), name: `${original.name} copia`, updatedAt: Date.now(), exercises: original.exercises.map((item) => ({ ...item, id: makeId('re') })) }] };
    });
  }, [update]);

  const moveRoutineExercise = useCallback((routineId: string, index: number, direction: -1 | 1) => {
    update((current) => ({
      ...current,
      routines: current.routines.map((routine) => {
        if (routine.id !== routineId) return routine;
        const destination = index + direction;
        if (destination < 0 || destination >= routine.exercises.length) return routine;
        const exercises = [...routine.exercises];
        [exercises[index], exercises[destination]] = [exercises[destination], exercises[index]];
        return { ...routine, exercises, updatedAt: Date.now() };
      }),
    }));
  }, [update]);

  const startWorkout = useCallback((routineId: string) => {
    update((current) => {
      const routine = current.routines.find((item) => item.id === routineId);
      if (!routine || routine.exercises.length === 0) return current;
      const activeWorkout: ActiveWorkout = {
        id: makeId('active'),
        routineId: routine.id,
        routineName: routine.name,
        startedAt: Date.now(),
        currentExerciseIndex: 0,
        restTimer: null,
        notes: '',
        exercises: routine.exercises.map((item) => ({ exerciseId: item.exerciseId, sets: [], notes: '' })),
      };
      return { ...current, activeWorkout };
    });
  }, [update]);

  const completeSet = useCallback((exerciseId: string, weight: number, reps: number) => {
    update((current) => {
      if (!current.activeWorkout) return current;
      const exercise = current.activeWorkout.exercises.find((item) => item.exerciseId === exerciseId);
      if (!exercise) return current;
      const set: WorkoutSet = { id: makeId('set'), setNumber: exercise.sets.length + 1, weight, reps, completedAt: Date.now() };
      return {
        ...current,
        activeWorkout: {
          ...current.activeWorkout,
          exercises: current.activeWorkout.exercises.map((item) => item.exerciseId === exerciseId ? { ...item, sets: [...item.sets, set] } : item),
        },
      };
    });
  }, [update]);

  const editSet = useCallback((exerciseId: string, setId: string, weight: number, reps: number) => {
    update((current) => {
      if (!current.activeWorkout) return current;
      return {
        ...current,
        activeWorkout: {
          ...current.activeWorkout,
          exercises: current.activeWorkout.exercises.map((exercise) => exercise.exerciseId === exerciseId ? { ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, weight, reps } : set) } : exercise),
        },
      };
    });
  }, [update]);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    update((current) => {
      if (!current.activeWorkout) return current;
      return {
        ...current,
        activeWorkout: {
          ...current.activeWorkout,
          exercises: current.activeWorkout.exercises.map((exercise) => exercise.exerciseId === exerciseId ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId).map((set, index) => ({ ...set, setNumber: index + 1 })) } : exercise),
        },
      };
    });
  }, [update]);

  const setCurrentExercise = useCallback((index: number) => {
    update((current) => current.activeWorkout ? { ...current, activeWorkout: { ...current.activeWorkout, currentExerciseIndex: index } } : current);
  }, [update]);

  const startRest = useCallback((exerciseId: string, seconds: number) => {
    const restTimer: RestTimer = { exerciseId, endAt: Date.now() + seconds * 1000, remainingSeconds: seconds, isPaused: false };
    update((current) => current.activeWorkout ? { ...current, activeWorkout: { ...current.activeWorkout, restTimer } } : current);
  }, [update]);

  const pauseRest = useCallback(() => {
    update((current) => {
      const timer = current.activeWorkout?.restTimer;
      if (!timer) return current;
      if (timer.isPaused) {
        return { ...current, activeWorkout: { ...current.activeWorkout!, restTimer: { ...timer, endAt: Date.now() + timer.remainingSeconds * 1000, isPaused: false } } };
      }
      if (!timer.endAt) return current;
      const remainingSeconds = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      return { ...current, activeWorkout: { ...current.activeWorkout!, restTimer: { ...timer, endAt: null, remainingSeconds, isPaused: true } } };
    });
  }, [update]);

  const addRestSeconds = useCallback((seconds: number) => {
    update((current) => {
      const timer = current.activeWorkout?.restTimer;
      if (!timer) return current;
      const now = Date.now();
      const remaining = timer.endAt ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : timer.remainingSeconds;
      return { ...current, activeWorkout: { ...current.activeWorkout!, restTimer: { ...timer, endAt: now + (remaining + seconds) * 1000, remainingSeconds: remaining + seconds, isPaused: false } } };
    });
  }, [update]);

  const skipRest = useCallback(() => {
    update((current) => current.activeWorkout ? { ...current, activeWorkout: { ...current.activeWorkout, restTimer: null } } : current);
  }, [update]);

  const finishWorkout = useCallback(() => {
    let finished: Workout | null = null;
    update((current) => {
      if (!current.activeWorkout) return current;
      const endedAt = Date.now();
      finished = {
        id: makeId('workout'),
        routineId: current.activeWorkout.routineId,
        routineName: current.activeWorkout.routineName,
        startedAt: current.activeWorkout.startedAt,
        endedAt,
        durationSeconds: Math.max(1, Math.round((endedAt - current.activeWorkout.startedAt) / 1000)),
        exercises: current.activeWorkout.exercises,
        notes: current.activeWorkout.notes,
      };
      return { ...current, activeWorkout: null, workouts: [finished, ...current.workouts] };
    });
    return finished;
  }, [update]);

  const updateSettings = useCallback((settings: Partial<Settings>) => {
    update((current) => ({ ...current, settings: { ...current.settings, ...settings } }));
  }, [update]);

  const getPreviousSets = useCallback((exerciseId: string) => {
    const workout = state.workouts.find((item) => item.exercises.some((exercise) => exercise.exerciseId === exerciseId));
    return workout?.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.sets ?? [];
  }, [state.workouts]);

  const getBestWeight = useCallback((exerciseId: string) => {
    return state.workouts.flatMap((workout) => workout.exercises.filter((item) => item.exerciseId === exerciseId).flatMap((item) => item.sets.map((set) => set.weight))).reduce((best, weight) => Math.max(best, weight), 0);
  }, [state.workouts]);

  const value = useMemo(() => ({
    ...state,
    hydrated,
    addExercise,
    updateExercise,
    deleteExercise,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    duplicateRoutine,
    moveRoutineExercise,
    startWorkout,
    completeSet,
    editSet,
    deleteSet,
    setCurrentExercise,
    startRest,
    pauseRest,
    addRestSeconds,
    skipRest,
    finishWorkout,
    updateSettings,
    getPreviousSets,
    getBestWeight,
  }), [state, hydrated, addExercise, updateExercise, deleteExercise, addRoutine, updateRoutine, deleteRoutine, duplicateRoutine, moveRoutineExercise, startWorkout, completeSet, editSet, deleteSet, setCurrentExercise, startRest, pauseRest, addRestSeconds, skipRest, finishWorkout, updateSettings, getPreviousSets, getBestWeight]);

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const context = useContext(GymContext);
  if (!context) throw new Error('useGym debe utilizarse dentro de GymProvider');
  return context;
}

export function notifyRestFinished(settings: Settings) {
  if (settings.vibration) Vibration.vibrate([0, 250, 120, 250]);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}