export type WorkoutExercise = {
  id?: string;
  name: string;
  sets: number;
  reps: number | string;
  weight?: string;
  restSeconds?: number;
  notes?: string;
  instructions?: string[];
  muscleGroup?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export type WorkoutPlan = {
  title: string;
  focus?: string;
  notes?: string;
  exercises: WorkoutExercise[];
};

export type ExerciseProgress = {
  completedSets: number;
  completedAt?: string[];
};
