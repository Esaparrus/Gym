import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { exerciseLibrary } from "./exerciseLibrary";
import { sampleWorkout, sampleWorkoutJson } from "./sampleWorkout";
import { ExerciseProgress, WorkoutExercise, WorkoutPlan } from "./types";

const STORAGE_KEY = "gym-sesiones-state-v2";
const DRAFT_KEY = "gym-sesiones-draft-v1";
const HISTORY_KEY = "gym-sesiones-history-v1";
const WEIGHTS_KEY = "gym-sesiones-weights-v1";

type RestState = {
  exerciseName: string;
  secondsLeft: number;
  totalSeconds: number;
};

type SessionHistoryEntry = {
  id: string;
  finishedAt: string;
  title: string;
  focus?: string;
  totalSets: number;
  completedSets: number;
  exerciseWeights: Record<string, string>;
};

type PersistedState = {
  workout: WorkoutPlan;
  progress: Record<string, ExerciseProgress>;
  savedWeights: Record<string, string>;
};

type AppTab = "train" | "routine" | "history";

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function getExerciseKey(exercise: WorkoutExercise, index: number) {
  return exercise.id ?? `${normalizeName(exercise.name)}-${index}`;
}

function buildInitialProgress(workout: WorkoutPlan) {
  return workout.exercises.reduce<Record<string, ExerciseProgress>>((acc, exercise, index) => {
    acc[getExerciseKey(exercise, index)] = {
      completedSets: 0,
      completedAt: []
    };
    return acc;
  }, {});
}

function getExerciseInfo(exercise: WorkoutExercise) {
  const fromLibrary = exerciseLibrary[normalizeName(exercise.name)];
  return {
    muscleGroup: exercise.muscleGroup ?? fromLibrary?.muscleGroup,
    instructions: exercise.instructions ?? fromLibrary?.instructions ?? [],
    cues: fromLibrary?.cues ?? [],
    videoUrl: exercise.videoUrl ?? fromLibrary?.videoUrl,
    imageUrl: exercise.imageUrl
  };
}

function extractJsonPayload(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'");

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No he encontrado un bloque JSON valido. Pega solo el contenido que empieza por { y termina por }.");
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function parseWorkout(raw: string): WorkoutPlan {
  let parsed: WorkoutPlan;

  try {
    parsed = JSON.parse(extractJsonPayload(raw)) as WorkoutPlan;
  } catch {
    throw new Error("No se ha podido leer el JSON. Si vienes de movil, copia solo el bloque JSON sin texto extra.");
  }

  if (!parsed.title || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
    throw new Error("El JSON necesita un titulo y una lista de ejercicios.");
  }

  parsed.exercises.forEach((exercise, index) => {
    if (!exercise.name || !exercise.sets || exercise.reps === undefined) {
      throw new Error(`Falta informacion en el ejercicio ${index + 1}.`);
    }
  });

  return parsed;
}

function formatDate(isoString: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(isoString));
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getSavedWeight(savedWeights: Record<string, string>, exercise: WorkoutExercise) {
  return savedWeights[normalizeName(exercise.name)] ?? exercise.weight ?? "";
}

function getCompletion(workout: WorkoutPlan, progress: Record<string, ExerciseProgress>) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completedSets = workout.exercises.reduce((sum, exercise, index) => {
    const key = getExerciseKey(exercise, index);
    return sum + (progress[key]?.completedSets ?? 0);
  }, 0);

  return {
    totalSets,
    completedSets,
    percent: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  };
}

export default function App() {
  const [draft, setDraft] = useState(sampleWorkoutJson);
  const [workout, setWorkout] = useState<WorkoutPlan>(sampleWorkout);
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>(() => buildInitialProgress(sampleWorkout));
  const [savedWeights, setSavedWeights] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [restState, setRestState] = useState<RestState | null>(null);
  const [selectedExerciseKey, setSelectedExerciseKey] = useState<string | null>(getExerciseKey(sampleWorkout.exercises[0], 0));
  const [activeTab, setActiveTab] = useState<AppTab>("train");
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isPastingWorkout, setIsPastingWorkout] = useState(false);

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setDraft(savedDraft);
    }

    const savedState = window.localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as PersistedState;
        setWorkout(parsed.workout);
        setProgress(parsed.progress);
        setSavedWeights(parsed.savedWeights ?? {});
        setSelectedExerciseKey(getExerciseKey(parsed.workout.exercises[0], 0));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      const legacyWeights = window.localStorage.getItem(WEIGHTS_KEY);
      if (legacyWeights) {
        setSavedWeights(JSON.parse(legacyWeights) as Record<string, string>);
      }
    }

    const savedHistory = window.localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory) as SessionHistoryEntry[]);
      } catch {
        window.localStorage.removeItem(HISTORY_KEY);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, draft);
  }, [draft]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        workout,
        progress,
        savedWeights
      } satisfies PersistedState)
    );
    window.localStorage.setItem(WEIGHTS_KEY, JSON.stringify(savedWeights));
  }, [progress, savedWeights, workout]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timer = window.setTimeout(() => setSaveMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  useEffect(() => {
    if (!restState || restState.secondsLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setRestState((current) => {
        if (!current) {
          return null;
        }

        if (current.secondsLeft <= 1) {
          window.clearInterval(timer);
          window.navigator.vibrate?.([200, 120, 240]);
          if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
            new Notification("Descanso terminado", {
              body: `Toca seguir con ${current.exerciseName}`
            });
          }
          return null;
        }

        return {
          ...current,
          secondsLeft: current.secondsLeft - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restState]);

  const completion = useMemo(() => getCompletion(workout, progress), [progress, workout]);

  const currentExerciseIndex = useMemo(() => {
    const firstPending = workout.exercises.findIndex((exercise, index) => {
      const key = getExerciseKey(exercise, index);
      return (progress[key]?.completedSets ?? 0) < exercise.sets;
    });

    return firstPending >= 0 ? firstPending : 0;
  }, [progress, workout]);

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentExerciseKey = currentExercise ? getExerciseKey(currentExercise, currentExerciseIndex) : null;
  const currentProgress = currentExerciseKey ? progress[currentExerciseKey] ?? { completedSets: 0 } : { completedSets: 0 };
  const selectedExercise =
    workout.exercises.find((exercise, index) => getExerciseKey(exercise, index) === selectedExerciseKey) ?? currentExercise ?? null;
  const selectedExerciseInfo = selectedExercise ? getExerciseInfo(selectedExercise) : null;

  function requestNotifications() {
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }

  function applyWorkout(rawWorkout: string) {
    try {
      const parsed = parseWorkout(rawWorkout);
      setWorkout(parsed);
      setProgress(buildInitialProgress(parsed));
      setRestState(null);
      setSelectedExerciseKey(getExerciseKey(parsed.exercises[0], 0));
      setDraft(extractJsonPayload(rawWorkout));
      setActiveTab("train");
      setError("");
      requestNotifications();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se ha podido leer el JSON.");
    }
  }

  function loadWorkoutFromDraft() {
    applyWorkout(draft);
  }

  function resetSession() {
    setProgress(buildInitialProgress(workout));
    setRestState(null);
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setDraft(text);
      setActiveTab("routine");
    };
    reader.readAsText(file);
  }

  function handleDraftPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pastedText = event.clipboardData.getData("text");
    if (!pastedText) {
      return;
    }

    event.preventDefault();
    const start = event.currentTarget.selectionStart;
    const end = event.currentTarget.selectionEnd;
    const normalizedPaste = pastedText
      .replace(/^\uFEFF/, "")
      .replace(/[\u200B-\u200D\u2060]/g, "")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'");

    const nextValue = `${draft.slice(0, start)}${normalizedPaste}${draft.slice(end)}`;
    setDraft(nextValue);
  }

  async function pasteWorkoutFromClipboard() {
    if (!navigator.clipboard?.readText) {
      setError("Tu navegador no permite leer el portapapeles directamente. Pega el texto manualmente.");
      return;
    }

    setIsPastingWorkout(true);

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setError("El portapapeles esta vacio.");
        return;
      }

      applyWorkout(clipboardText);
    } catch {
      setError("No he podido leer el portapapeles. Revisa permisos del navegador o pega el texto manualmente.");
    } finally {
      setIsPastingWorkout(false);
    }
  }

  function updateExerciseWeight(exercise: WorkoutExercise, nextWeight: string) {
    setSavedWeights((existing) => ({
      ...existing,
      [normalizeName(exercise.name)]: nextWeight
    }));
  }

  function completeSet(exercise: WorkoutExercise, index: number) {
    const key = getExerciseKey(exercise, index);
    const current = progress[key] ?? { completedSets: 0, completedAt: [] };
    if (current.completedSets >= exercise.sets) {
      return;
    }

    setProgress((existing) => ({
      ...existing,
      [key]: {
        completedSets: current.completedSets + 1,
        completedAt: [...(current.completedAt ?? []), new Date().toISOString()]
      }
    }));

    const restSeconds = exercise.restSeconds ?? 60;
    setRestState({
      exerciseName: exercise.name,
      secondsLeft: restSeconds,
      totalSeconds: restSeconds
    });
    setSelectedExerciseKey(key);
    setActiveTab("train");
    requestNotifications();
  }

  function undoSet(exercise: WorkoutExercise, index: number) {
    const key = getExerciseKey(exercise, index);
    const current = progress[key];
    if (!current || current.completedSets === 0) {
      return;
    }

    setProgress((existing) => ({
      ...existing,
      [key]: {
        completedSets: current.completedSets - 1,
        completedAt: (current.completedAt ?? []).slice(0, -1)
      }
    }));
  }

  function saveSessionToHistory() {
    const summary = getCompletion(workout, progress);
    const hasSomeProgress = summary.completedSets > 0;
    if (!hasSomeProgress) {
      setSaveMessage("Haz al menos una serie antes de guardar.");
      return;
    }

    const exerciseWeights = workout.exercises.reduce<Record<string, string>>((acc, exercise) => {
      const weight = getSavedWeight(savedWeights, exercise);
      if (weight) {
        acc[exercise.name] = weight;
      }
      return acc;
    }, {});

    const entry: SessionHistoryEntry = {
      id: `${Date.now()}`,
      finishedAt: new Date().toISOString(),
      title: workout.title,
      focus: workout.focus,
      totalSets: summary.totalSets,
      completedSets: summary.completedSets,
      exerciseWeights
    };

    setHistory((existing) => [entry, ...existing].slice(0, 20));
    setSaveMessage("Entreno guardado.");
  }

  function clearHistory() {
    setHistory([]);
    setSaveMessage("Historial borrado.");
  }

  const currentExerciseInfo = currentExercise ? getExerciseInfo(currentExercise) : null;
  const restProgress = restState ? Math.round(((restState.totalSeconds - restState.secondsLeft) / restState.totalSeconds) * 100) : 0;
  const remainingSets = completion.totalSets - completion.completedSets;

  return (
    <main className="app-shell">
      <section className="session-bar">
        <div>
          <p className="eyebrow">{workout.focus ?? "Entreno"}</p>
          <h1>{workout.title}</h1>
        </div>
        <div className="session-stats">
          <span>{completion.completedSets}/{completion.totalSets} series</span>
          <span>{remainingSets} pendientes</span>
          <span>{restState ? `Descanso ${formatTimer(restState.secondsLeft)}` : "Sin descanso"}</span>
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Navegacion principal">
        <button className={activeTab === "train" ? "nav-pill active" : "nav-pill"} onClick={() => setActiveTab("train")}>
          Entreno
        </button>
        <button className={activeTab === "routine" ? "nav-pill active" : "nav-pill"} onClick={() => setActiveTab("routine")}>
          Rutina
        </button>
        <button className={activeTab === "history" ? "nav-pill active" : "nav-pill"} onClick={() => setActiveTab("history")}>
          Historial
        </button>
      </nav>

      <section className="layout mobile-stack">
        <section className={`panel panel-focus ${activeTab === "train" ? "tab-visible" : "tab-hidden"}`}>
          {currentExercise ? (
            <>
              <div className="panel-header panel-header-tight">
                <div>
                  <p className="eyebrow">Ahora toca</p>
                  <h2>{currentExercise.name}</h2>
                  <p>{currentExerciseInfo?.muscleGroup ?? workout.focus ?? "Rutina del dia"}</p>
                </div>
              </div>

              <div className="focus-card">
                <div className="focus-topline">
                  <span className="focus-chip">{currentExercise.sets} series</span>
                  <span className="focus-chip">{currentExercise.reps} reps</span>
                  <span className="focus-chip">{currentExercise.restSeconds ?? 60}s descanso</span>
                </div>

                <div className="focus-weight">
                  <label htmlFor="current-weight">Peso usado</label>
                  <input
                    id="current-weight"
                    className="weight-input"
                    value={getSavedWeight(savedWeights, currentExercise)}
                    onChange={(event) => updateExerciseWeight(currentExercise, event.target.value)}
                    placeholder="Ej. 70 kg"
                  />
                </div>

                <div className="focus-progress">
                  <strong>
                    Serie {Math.min(currentProgress.completedSets + 1, currentExercise.sets)} de {currentExercise.sets}
                  </strong>
                  <div className="set-badges large">
                    {Array.from({ length: currentExercise.sets }).map((_, setIndex) => (
                      <button
                        key={`${currentExerciseKey}-focus-${setIndex}`}
                        className={`set-badge large ${setIndex < currentProgress.completedSets ? "checked" : ""}`}
                        onClick={() => setSelectedExerciseKey(currentExerciseKey)}
                      >
                        {setIndex + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="focus-actions">
                  <button className="ghost-button big-button" onClick={() => undoSet(currentExercise, currentExerciseIndex)}>
                    Deshacer
                  </button>
                  <button className="primary-button giant-button" onClick={() => completeSet(currentExercise, currentExerciseIndex)}>
                    Marcar serie y descansar
                  </button>
                </div>

                {currentExercise.notes ? <p className="exercise-notes">{currentExercise.notes}</p> : null}
              </div>

              <div className="train-actions-bar">
                <button className="ghost-button" onClick={saveSessionToHistory}>
                  Guardar entreno
                </button>
                <button className="ghost-button" onClick={resetSession}>
                  Reiniciar
                </button>
                <button className="ghost-button" onClick={() => setActiveTab("routine")}>
                  Cambiar rutina
                </button>
              </div>

              <section className="panel-inline">
                <div className="section-head">
                  <h3>Ejercicios de hoy</h3>
                  <span>{completion.percent}%</span>
                </div>

                <div className="exercise-list compact-list">
                  {workout.exercises.map((exercise, index) => {
                    const key = getExerciseKey(exercise, index);
                    const itemProgress = progress[key] ?? { completedSets: 0 };
                    const isCurrent = key === currentExerciseKey;
                    const isDone = itemProgress.completedSets >= exercise.sets;

                    return (
                      <article key={key} className={`exercise-card compact ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                        <button
                          className="exercise-select"
                          onClick={() => {
                            setSelectedExerciseKey(key);
                            setActiveTab("train");
                          }}
                        >
                          <div>
                            <p className="exercise-meta">{getExerciseInfo(exercise).muscleGroup ?? "Ejercicio"}</p>
                            <h3>{exercise.name}</h3>
                            <p className="exercise-prescription">
                              {itemProgress.completedSets}/{exercise.sets} series
                              {getSavedWeight(savedWeights, exercise) ? ` | ${getSavedWeight(savedWeights, exercise)}` : ""}
                            </p>
                          </div>
                          <span className="exercise-jump">{isCurrent ? "Ahora" : "Abrir"}</span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <div className="detail-card quick-guide">
                <div className="section-head">
                  <h3>Como hacerlo</h3>
                  {currentExerciseInfo?.videoUrl ? (
                    <a className="video-link compact-link" href={currentExerciseInfo.videoUrl} target="_blank" rel="noreferrer">
                      Ver tecnica
                    </a>
                  ) : null}
                </div>
                {currentExerciseInfo?.instructions.length ? (
                  <ul>
                    {currentExerciseInfo.instructions.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Este ejercicio no tiene guia aun. Puedes anadirla dentro del JSON.</p>
                )}
              </div>
            </>
          ) : null}
        </section>

        <aside className={`panel panel-editor ${activeTab === "routine" ? "tab-visible" : "tab-hidden"}`}>
          <div className="panel-header">
            <div>
              <h2>Cargar rutina</h2>
              <p>Pega JSON o importa un archivo.</p>
            </div>
            <button className="ghost-button" onClick={() => setDraft(sampleWorkoutJson)}>
              Cargar ejemplo
            </button>
          </div>

          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={handleDraftPaste}
            spellCheck={false}
            className="json-input"
          />

          <div className="editor-actions">
            <label className="file-button">
              Importar JSON
              <input type="file" accept=".json,application/json" onChange={handleFileImport} />
            </label>
            <button className="ghost-button" onClick={() => void pasteWorkoutFromClipboard()}>
              {isPastingWorkout ? "Pegando..." : "Pegar desde ChatGPT"}
            </button>
          </div>

          <div className="editor-actions editor-actions-secondary">
            <button className="primary-button" onClick={loadWorkoutFromDraft}>
              Usar esta rutina
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="prompt-card">
            <h3>Prompt rapido para ChatGPT</h3>
            <p>
              Devuelveme solo JSON con esta estructura: title, focus, notes y exercises. Cada ejercicio debe tener
              name, sets, reps, weight, restSeconds y notes si hace falta.
            </p>
          </div>
        </aside>

        <section className={`panel panel-workout ${activeTab === "routine" ? "tab-visible" : "tab-hidden"}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">{workout.focus ?? "Rutina"}</p>
              <h2>{workout.title}</h2>
              <p>{workout.notes ?? "Sin notas generales."}</p>
            </div>
          </div>

          <div className="exercise-list">
            {workout.exercises.map((exercise, index) => {
              const key = getExerciseKey(exercise, index);
              const itemProgress = progress[key] ?? { completedSets: 0 };
              const info = getExerciseInfo(exercise);
              const isDone = itemProgress.completedSets >= exercise.sets;

              return (
                <article key={key} className={`exercise-card ${isDone ? "done" : ""}`}>
                  <div className="exercise-main">
                    <div>
                      <p className="exercise-meta">{info.muscleGroup ?? "Ejercicio"}</p>
                      <h3>{exercise.name}</h3>
                      <p className="exercise-prescription">
                        {exercise.sets} series x {exercise.reps} reps
                        {getSavedWeight(savedWeights, exercise) ? ` | ${getSavedWeight(savedWeights, exercise)}` : ""}
                        {exercise.restSeconds ? ` | ${exercise.restSeconds}s descanso` : ""}
                      </p>
                      {exercise.notes ? <p className="exercise-notes">{exercise.notes}</p> : null}
                    </div>

                    <div className="set-badges">
                      {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                        <button
                          key={`${key}-set-${setIndex}`}
                          className={`set-badge ${setIndex < itemProgress.completedSets ? "checked" : ""}`}
                          onClick={() => {
                            setSelectedExerciseKey(key);
                            setActiveTab("train");
                          }}
                        >
                          {setIndex + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="exercise-inline-tools">
                    <input
                      className="weight-input compact"
                      value={getSavedWeight(savedWeights, exercise)}
                      onChange={(event) => updateExerciseWeight(exercise, event.target.value)}
                      placeholder="Peso"
                    />
                  </div>

                  <div className="exercise-actions">
                    <button className="ghost-button" onClick={() => undoSet(exercise, index)}>
                      Quitar serie
                    </button>
                    <button className="primary-button" onClick={() => completeSet(exercise, index)}>
                      Marcar serie
                    </button>
                    <button
                      className="info-button"
                      onClick={() => {
                        setSelectedExerciseKey(key);
                        setActiveTab("train");
                      }}
                    >
                      Ver guia
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={`panel panel-history ${activeTab === "history" ? "tab-visible" : "tab-hidden"}`}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Historial</p>
              <h2>Sesiones guardadas</h2>
              <p>Te sirve para recordar pesos y comprobar continuidad.</p>
            </div>
            <button className="ghost-button" onClick={clearHistory}>
              Borrar historial
            </button>
          </div>

          {saveMessage ? <p className="save-text">{saveMessage}</p> : null}

          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-card">
                <p>Aun no has guardado ningun entreno.</p>
              </div>
            ) : (
              history.map((entry) => (
                <article key={entry.id} className="history-card">
                  <div className="history-head">
                    <div>
                      <h3>{entry.title}</h3>
                      <p>{entry.focus ?? "Sesion"}</p>
                    </div>
                    <strong>
                      {entry.completedSets}/{entry.totalSets}
                    </strong>
                  </div>
                  <p className="history-date">{formatDate(entry.finishedAt)}</p>
                  <div className="history-tags">
                    {Object.entries(entry.exerciseWeights).map(([name, weight]) => (
                      <span key={`${entry.id}-${name}`} className="history-tag">
                        {name}: {weight}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <section className={`detail-drawer ${selectedExercise ? "open" : ""}`}>
        {selectedExercise ? (
          <>
            <div className="detail-header">
              <div>
                <p className="eyebrow">Ficha del ejercicio</p>
                <h2>{selectedExercise.name}</h2>
              </div>
              <button className="ghost-button" onClick={() => setSelectedExerciseKey(null)}>
                Cerrar
              </button>
            </div>

            {selectedExerciseInfo?.imageUrl ? (
              <img className="exercise-image" src={selectedExerciseInfo.imageUrl} alt={selectedExercise.name} />
            ) : null}

            <div className="detail-grid">
              <div className="detail-card">
                <h3>Indicaciones</h3>
                {selectedExerciseInfo?.instructions.length ? (
                  <ul>
                    {selectedExerciseInfo.instructions.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Anade instructions en el JSON si quieres una guia mas detallada.</p>
                )}
              </div>

              <div className="detail-card">
                <h3>Cues utiles</h3>
                {selectedExerciseInfo?.cues.length ? (
                  <ul>
                    {selectedExerciseInfo.cues.map((cue) => (
                      <li key={cue}>{cue}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Sin cues guardados para este ejercicio.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {restState ? (
        <section className="rest-banner" aria-live="polite">
          <div>
            <p className="eyebrow">Descanso activo</p>
            <strong>{formatTimer(restState.secondsLeft)}</strong>
            <small>{restState.exerciseName}</small>
          </div>
          <div className="rest-bar">
            <div className="rest-bar-fill" style={{ width: `${restProgress}%` }} />
          </div>
          <button className="ghost-button" onClick={() => setRestState(null)}>
            Saltar descanso
          </button>
        </section>
      ) : null}
    </main>
  );
}
