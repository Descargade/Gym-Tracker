export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Bíceps'
  | 'Tríceps'
  | 'Hombros'
  | 'Piernas'
  | 'Cuádriceps'
  | 'Isquiotibiales'
  | 'Glúteos'
  | 'Gemelos'
  | 'Abdomen'
  | 'Antebrazos'
  | 'Cardio'
  | 'Otro';

export type WeightUnit = 'kg' | 'lb';
export type ThemeMode = 'light' | 'dark';

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  equipment: string;
  description: string;
  notes: string;
  isCustom: boolean;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  targetReps: string;
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  updatedAt: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  completedAt: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  notes: string;
}

export interface Workout {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  notes: string;
}

export interface RestTimer {
  exerciseId: string;
  endAt: number | null;
  remainingSeconds: number;
  isPaused: boolean;
}

export interface ActiveWorkout {
  id: string;
  routineId: string;
  routineName: string;
  startedAt: number;
  exercises: WorkoutExercise[];
  currentExerciseIndex: number;
  restTimer: RestTimer | null;
  notes: string;
}

export interface Settings {
  name: string;
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  timerSound: boolean;
  vibration: boolean;
  theme: ThemeMode;
}

export interface GymState {
  exercises: Exercise[];
  routines: Routine[];
  workouts: Workout[];
  settings: Settings;
  activeWorkout: ActiveWorkout | null;
}