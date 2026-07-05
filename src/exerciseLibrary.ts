type ExerciseReference = {
  muscleGroup: string;
  cues: string[];
  instructions: string[];
  videoUrl?: string;
};

export const exerciseLibrary: Record<string, ExerciseReference> = {
  "sentadilla trasera": {
    muscleGroup: "Pierna y gluteo",
    cues: ["Pecho alto", "Rodillas acompanando la punta del pie", "Empuja el suelo al subir"],
    instructions: [
      "Coloca la barra sobre la parte alta de la espalda y aprieta el abdomen.",
      "Baja controlando hasta la profundidad que mantenga tu espalda estable.",
      "Sube empujando fuerte con todo el pie sin perder la linea de la barra."
    ],
    videoUrl: "https://www.youtube.com/results?search_query=back+squat+technique"
  },
  "press banca": {
    muscleGroup: "Pecho, hombro y triceps",
    cues: ["Escapulas juntas", "Pies firmes", "Barra hacia la linea media del pecho"],
    instructions: [
      "Agarra la barra con antebrazos verticales en la parte baja del recorrido.",
      "Baja la barra con control al pecho manteniendo tension en la espalda.",
      "Empuja hacia arriba sin perder el apoyo de los pies."
    ],
    videoUrl: "https://www.youtube.com/results?search_query=bench+press+technique"
  },
  "peso muerto rumano": {
    muscleGroup: "Isquios, gluteo y espalda",
    cues: ["Cadera atras", "Barra pegada al cuerpo", "Espalda neutra"],
    instructions: [
      "Desbloquea ligeramente las rodillas y lleva la cadera hacia atras.",
      "Baja la barra cerca de los muslos hasta notar tension en isquios.",
      "Vuelve arriba extendiendo la cadera sin tirar con la espalda."
    ],
    videoUrl: "https://www.youtube.com/results?search_query=romanian+deadlift+technique"
  },
  "jalon al pecho": {
    muscleGroup: "Espalda",
    cues: ["Hombros abajo", "Tira con los codos", "Pecho arriba"],
    instructions: [
      "Agarra la barra y sientate estable con el tronco ligeramente inclinado.",
      "Lleva la barra a la parte alta del pecho guiando el movimiento con los codos.",
      "Vuelve arriba sin perder el control ni encoger los hombros."
    ],
    videoUrl: "https://www.youtube.com/results?search_query=lat+pulldown+technique"
  },
  "press militar": {
    muscleGroup: "Hombro y triceps",
    cues: ["Gluteos apretados", "Abdomen firme", "Cabeza se mueve para dejar pasar la barra"],
    instructions: [
      "Empieza con la barra a la altura de la clavicula y codos ligeramente delante.",
      "Empuja en vertical y mete la cabeza bajo la barra al final.",
      "Baja con control a la posicion inicial."
    ],
    videoUrl: "https://www.youtube.com/results?search_query=overhead+press+technique"
  }
};
