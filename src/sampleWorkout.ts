import { WorkoutPlan } from "./types";

export const sampleWorkout: WorkoutPlan = {
  title: "Empuje fuerza",
  focus: "Pecho, hombro y triceps",
  notes: "Calienta 5-10 min y haz 2 series de aproximacion antes del primer basico.",
  exercises: [
    {
      name: "Press banca",
      sets: 4,
      reps: 5,
      weight: "70 kg",
      restSeconds: 90,
      notes: "Ultima repeticion con tecnica limpia, sin llegar al fallo."
    },
    {
      name: "Press militar",
      sets: 3,
      reps: 6,
      weight: "40 kg",
      restSeconds: 75
    },
    {
      name: "Press inclinado con mancuernas",
      sets: 3,
      reps: "8-10",
      weight: "24 kg por mano",
      restSeconds: 60,
      instructions: [
        "Controla la bajada dos segundos.",
        "No choques las mancuernas arriba."
      ]
    },
    {
      name: "Elevaciones laterales",
      sets: 3,
      reps: 15,
      weight: "8 kg",
      restSeconds: 45,
      notes: "Ritmo continuo, sin impulso."
    }
  ]
};

export const sampleWorkoutJson = JSON.stringify(sampleWorkout, null, 2);
