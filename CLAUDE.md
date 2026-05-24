# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (port 5173; falls back to next port if busy)
npm run build      # tsc -b (typecheck) + vite build
npm run preview    # serve dist/ locally
```

No tests, no linter configured. Typecheck-only via `tsc -b` in the build step.

If the dev server serves stale modules (blank page, `/src/App.js` 404 in network), clear Vite's cache and restart: `rm -rf node_modules/.vite && npm run dev`.

## Architecture

**This is a port of a Claude Design HTML/React prototype to Vite + React + TS.** The source bundle lives in `design/mood-meter/` — its `project/*.jsx` files are the visual source-of-truth. When something is ambiguous, look there first. Match visual output; do not copy the prototype's internal structure unless it happens to fit.

**Single-user app, Spanish-only UI.** All user-facing strings, mock data, mood labels are in Spanish. The user explicitly translated everything from English (see `design/mood-meter/chats/chat2.md`). Don't introduce English in the UI.

**No routing library.** Tab switching is `useState<Tab>` in `App.tsx`, conditional rendering of 4 screens. Don't add React Router.

**State model is intentionally simple.** `entries: Entry[]` lives in `App.tsx`, persisted via `src/lib/data.ts` (currently `localStorage`, will be Supabase). Screens get `entries` + callbacks as props. No context, no Redux, no Zustand.

### Mood grid coordinate system

The grid is 10×10. `Entry.x` and `Entry.y` are 0..9 indexed from the **bottom-left**:

- `x` = placer (0 = más desagradable, 9 = más agradable)
- `y` = energía (0 = baja, 9 = alta)

UI rows render top→bottom, so labels are indexed as `MOOD_LABELS[9 - y][x]`. Display scale shown to the user is **-5..+5** via `displayCoord(x, y)` (cell-center value, e.g. `x=5` → `+0.5`).

Cell colors come from `cellColor(x, y)` in `src/lib/data.ts`: 4 quadrant corners (red/yellow/green/blue) interpolated toward a pale center based on distance from `(4.5, 4.5)`. Don't replace with hardcoded color tables.

Quadrants from `quadrant(x, y)`: `high-unpleasant` (red), `high-pleasant` (yellow), `low-unpleasant` (blue), `low-pleasant` (green).

### Styling

Neumorphism via CSS custom properties in `src/index.css`:

- Surfaces: `--bg`, with `var(--neu-out)` / `var(--neu-out-sm)` / `var(--neu-out-xs)` for raised, `var(--neu-in)` for sunken.
- Inks: `--ink`, `--ink-soft`, `--ink-mute`, `--ink-faint` (decreasing emphasis).
- Quadrant accents: `--q-red`, `--q-yellow-d`, `--q-blue`, `--q-green-d` etc.

**Most styles are inline JSX `style={{...}}`**, not CSS classes. This mirrors the prototype and gives direct per-element control over shadows/transitions. Do not introduce styled-components / emotion / tailwind. New shared primitives go in `src/components/primitives.tsx` (`NeuCard`, `NeuButton`, `Stat`, `BottomSheet`).

### Deliberate UX choices — don't undo without asking

1. **No labels or coordinates on grid hover/select**, ever. Showing the mood name would bias the user's free-text word. See `MoodGrid.tsx` and `design/mood-meter/chats/chat2.md` for context.
2. **No word suggestions in the bottom sheet input.** Removed deliberately.
3. **`computeSchedule()` uses `mulberry32` seeded by `year·1000 + month·31 + day`.** The seed makes the daily ping preview stable for the whole day. Don't replace with `Math.random()`.

### Charts

All charts are hand-rolled SVG in `src/components/charts/`. No Chart.js, no D3, no Recharts. They're small and tuned to the neumorphic palette — replacing them with a library would be a regression in visual fidelity.

## Backend integration roadmap

UI is complete; backends are mocked. Order of integration:

1. **Supabase** (`mood_entries` + RLS, Google OAuth) — swap `src/lib/data.ts` calls.
2. **Vercel deploy** — gives the real URL needed for Telegram/Google callbacks.
3. **Telegram bot** — Edge Function webhook + `pg_cron` calculating pings from `user_settings`.
4. **Google Calendar** — extend OAuth scope to `calendar.events.readonly`, Edge Function reads day events for the Insights correlation strip.

The Supabase MCP server is registered in `.mcp.json` (project scope). Auth runs once per developer via `claude /mcp` in a separate terminal — token is stored in `~/.claude/`. After authenticating, restart the Claude Code session to load the Supabase tools.

## Secrets

- `.env.local` (gitignored) holds local-only secrets — currently `SUPABASE_DB_PASSWORD` for direct psql/CLI access. The frontend doesn't read it.
- Frontend env vars must be `VITE_*` prefixed to be exposed; everything else stays server-side only.
- The Supabase DB password and service-role key never go anywhere near the frontend bundle.
