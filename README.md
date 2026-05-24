# Mood Meter

App web personal de seguimiento emocional basada en el _Mood Meter_ de Yale (cuadrícula 10×10 de **placer × energía**). Sirve para registrar cómo te sientes varias veces al día, ver cómo evoluciona tu estado en el tiempo y cruzarlo con tu calendario.

> Es una app pensada para **uso personal** (single-user). La estética es neumórfica suave sobre fondo cálido neutro, con tipografía `Plus Jakarta Sans` + `JetBrains Mono` para datos.

## Estado actual

| Capa                         | Estado            | Notas                                                            |
| ---------------------------- | ----------------- | ---------------------------------------------------------------- |
| UI (4 pantallas)             | Completa          | Registro, Insights, Historial, Ajustes                           |
| Almacenamiento               | Mock localStorage | Pendiente migrar a Supabase                                      |
| Notificaciones Telegram      | UI mockeada       | Pendiente bot real + scheduler                                   |
| Google Calendar              | Eventos mock      | Pendiente OAuth + lectura de eventos reales                      |
| Deploy                       | Local             | Pendiente Vercel                                                 |

## Stack

- **Vite + React 18 + TypeScript**
- **CSS variables + box-shadows** para la estética neumórfica (sin librerías de UI)
- **SVG nativo** para gráficos (line chart, donut, heatmap, top words) — sin Chart.js / D3
- `localStorage` como mock de Supabase mientras se monta el backend real

Backends previstos:

- **Supabase** — Postgres + Auth + Edge Functions + `pg_cron`
- **Telegram Bot API** — recordatorios programados
- **Google Calendar API** — correlación de eventos con estado emocional

## Cómo arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

La primera vez se siembra automáticamente con ~21 días de datos de ejemplo para que las gráficas se vean pobladas (en localStorage; puedes borrarlos desde **Ajustes → Borrar todas las entradas**).

### Otros scripts

```bash
npm run build      # typecheck (tsc -b) + build de Vite
npm run preview    # sirve el build de producción en local
```

## Estructura

```
src/
├── App.tsx                          # Shell + nav + routing por tabs
├── main.tsx                         # Entry point
├── index.css                        # Tokens neumórficos + estilos globales
├── lib/
│   ├── data.ts                      # Mood labels, colores, quadrants, store
│   └── format.ts                    # Fechas, computeSchedule (random/fixed)
├── components/
│   ├── primitives.tsx               # NeuCard, NeuButton, Stat, BottomSheet
│   ├── icons.tsx                    # SVGs minimalistas
│   ├── MoodGrid.tsx                 # Grid 10×10 (interactivo + heatmap)
│   ├── charts/                      # LineChart, QuadrantDonut, HourDowHeat,
│   │                                # TopWords, CalendarCorrelation, MoodPill
│   └── settings/                    # Toggle, Segmented, SliderRow, TimeRange,
│                                    # SchedulePreview, ChatMock
└── screens/
    ├── CheckInScreen.tsx            # Grid + entrada de palabra
    ├── InsightsScreen.tsx           # Stats + gráficos + correlación
    ├── HistoryScreen.tsx            # Historial agrupado por día
    └── SettingsScreen.tsx           # Telegram, Calendar, frecuencia, datos
```

`design/mood-meter/` contiene el bundle de [Claude Design](https://claude.ai/design) del que se hizo el port (HTML/CSS/JS originales + transcripciones de las iteraciones de diseño).

## Modelo de datos

Una entrada es un punto en el grid + una palabra libre + un timestamp.

```ts
interface Entry {
  id: string;
  t: string;        // ISO timestamp
  x: number;        // 0..9 — placer (0 desagradable, 9 agradable)
  y: number;        // 0..9 — energía (0 baja, 9 alta)
  word: string;     // palabra libre del usuario, 1–32 chars
  label: string;    // etiqueta automática (p.ej. "Sereno", "Eufórico")
}
```

Los cuadrantes salen de `quadrant(x, y)`:

- `high-unpleasant` — alta energía / desagradable (rojo)
- `high-pleasant`   — alta energía / agradable (amarillo)
- `low-unpleasant`  — baja energía / desagradable (azul)
- `low-pleasant`    — baja energía / agradable (verde)

## Roadmap

1. **Supabase**: esquema `mood_entries` + RLS, auth (Google OAuth), swap del `localStorage` por cliente real.
2. **Deploy a Vercel** con variables de entorno conectadas a Supabase.
3. **Telegram bot**: token, Edge Function de webhook (`/mood`, `/pause`, `/skip`, `/settings`), `pg_cron` calculando los pings del día por usuario según `user_settings`.
4. **Google Calendar**: extender OAuth con scope `calendar.events.readonly`, Edge Function que lee eventos del día para enriquecer la pantalla de Insights.

## Frecuencia de recordatorios (Telegram)

La pantalla de **Ajustes** ya permite configurar:

- **Modo**: aleatorio / fijo / manual
- **Pings por día**: 1–8 (default 4)
- **Ventana activa**: rango horario (default 09:00–22:00)
- **Fines de semana**: igual / reducido a la mitad / desactivado
- **Silencio nocturno automático**
- **Modo contextual (BETA)**: pings extra 30 min tras despertar, 15 min tras eventos largos del calendario, o si llevas 5 h sin registrar

En modo aleatorio las horas se regeneran cada día con seed determinista (`mulberry32` con `año·1000 + mes·31 + día`), así la _Vista previa de hoy_ es estable durante toda la jornada.

## Créditos

Prototipo original mockeado en [Claude Design](https://claude.ai/design) y portado a Vite + React + TS por el coding agent.
