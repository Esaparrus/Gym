# Gym Sesiones

App sencilla para usar una rutina de gimnasio generada por ChatGPT sin pagar API.

## Que hace ahora

- Pegas o importas un JSON con la rutina del dia.
- Tienes una vista principal grande de "ahora toca" pensada para movil.
- Marcas una serie con un clic y arranca el descanso automaticamente.
- Puedes guardar el peso usado por ejercicio.
- Puedes guardar sesiones en historial.
- Tiene soporte PWA basico para abrirla como app instalada.
- El progreso, los pesos y el historial se guardan en el navegador.

## Arranque

```bash
npm install
npm run dev
```

## Uso simple

1. Le pides a ChatGPT una rutina y que te la devuelva solo en JSON.
2. Pegas ese JSON en la pestaña de rutina.
3. Pulsas `Usar esta rutina`.
4. En `Entreno` vas marcando series y dejando que corra el descanso.
5. Cuando acabes, pulsas `Guardar entreno`.

## Formato JSON

```json
{
  "title": "Pierna fuerza",
  "focus": "Cuadriceps y gluteo",
  "notes": "Calienta antes del primer ejercicio",
  "exercises": [
    {
      "name": "Sentadilla trasera",
      "sets": 4,
      "reps": 5,
      "weight": "100 kg",
      "restSeconds": 90,
      "notes": "Mantener tecnica limpia"
    }
  ]
}
```

## Prompt rapido

```text
Hazme la rutina de hoy para el gimnasio y devuelvemela solo en JSON con title, focus, notes y exercises. Cada ejercicio debe incluir name, sets, reps, weight, restSeconds y notes si hace falta.
```

## Instalarla en el movil

- Abrela desde el navegador del movil.
- Usa la opcion `Anadir a pantalla de inicio` o `Instalar app`.
- Acepta notificaciones si quieres aviso al terminar el descanso.
