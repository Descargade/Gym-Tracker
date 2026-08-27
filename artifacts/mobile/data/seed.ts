import { Exercise, GymState, MuscleGroup, Routine } from '@/types/models';

export const starterExercises: Exercise[] = [
  ['Press banca', 'Pecho', 'Barra', 'Empuje horizontal con barra.', 'Mantener escápulas retraídas.'],
  ['Press inclinado', 'Pecho', 'Barra', 'Press para enfatizar la parte superior del pecho.', ''],
  ['Dominadas', 'Espalda', 'Peso corporal', 'Tracción vertical con el peso corporal.', ''],
  ['Remo con barra', 'Espalda', 'Barra', 'Remo inclinado para espalda media.', 'Espalda neutra durante todo el movimiento.'],
  ['Curl con barra', 'Bíceps', 'Barra', 'Curl de bíceps de pie.', ''],
  ['Curl martillo', 'Bíceps', 'Mancuernas', 'Curl con agarre neutro.', ''],
  ['Extensión en polea', 'Tríceps', 'Polea', 'Extensión de tríceps en polea alta.', ''],
  ['Press militar', 'Hombros', 'Barra', 'Press vertical para hombros.', ''],
  ['Elevaciones laterales', 'Hombros', 'Mancuernas', 'Elevaciones controladas para deltoides.', ''],
  ['Sentadilla', 'Piernas', 'Barra', 'Sentadilla trasera con barra.', 'Profundidad cómoda y controlada.'],
  ['Prensa', 'Cuádriceps', 'Máquina', 'Prensa inclinada de piernas.', ''],
  ['Hip thrust', 'Glúteos', 'Barra', 'Extensión de cadera con apoyo.', ''],
].map(([name, group, equipment, description, notes], index) => ({
  id: `starter-${index + 1}`,
  name,
  group: group as MuscleGroup,
  equipment,
  description,
  notes,
  isCustom: false,
}));

const starterRoutines: Routine[] = [
  {
    id: 'routine-push',
    name: 'Pecho + Tríceps',
    updatedAt: Date.now(),
    exercises: [
      { id: 're-1', exerciseId: 'starter-1', sets: 4, targetReps: '8-10', restSeconds: 90 },
      { id: 're-2', exerciseId: 'starter-2', sets: 3, targetReps: '10', restSeconds: 90 },
      { id: 're-3', exerciseId: 'starter-7', sets: 3, targetReps: '10-12', restSeconds: 60 },
    ],
  },
  {
    id: 'routine-pull',
    name: 'Espalda + Bíceps',
    updatedAt: Date.now(),
    exercises: [
      { id: 're-4', exerciseId: 'starter-3', sets: 4, targetReps: '6-10', restSeconds: 120 },
      { id: 're-5', exerciseId: 'starter-4', sets: 3, targetReps: '8-10', restSeconds: 90 },
      { id: 're-6', exerciseId: 'starter-5', sets: 3, targetReps: '10-12', restSeconds: 60 },
    ],
  },
  {
    id: 'routine-legs',
    name: 'Piernas',
    updatedAt: Date.now(),
    exercises: [
      { id: 're-7', exerciseId: 'starter-10', sets: 4, targetReps: '6-8', restSeconds: 150 },
      { id: 're-8', exerciseId: 'starter-11', sets: 3, targetReps: '10', restSeconds: 90 },
      { id: 're-9', exerciseId: 'starter-12', sets: 3, targetReps: '10-12', restSeconds: 90 },
    ],
  },
];

export const initialState: GymState = {
  exercises: starterExercises,
  routines: starterRoutines,
  workouts: [],
  settings: {
    name: 'Atleta',
    weightUnit: 'kg',
    defaultRestSeconds: 90,
    timerSound: true,
    vibration: true,
    theme: 'dark',
  },
  activeWorkout: null,
};