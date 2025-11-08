# DailyDesk

DailyDesk is a personal productivity companion that combines a Trello-inspired task board with a focused daily calendar. The repository is organised as a pnpm monorepo with separate frontend and backend packages.

> Frontend documentation and run instructions are available now. Backend docs will be added in a future update.

## Packages

- [`frontend/`](frontend/README.md) – React + Vite application that powers the board and calendar experience.
- `backend/` – Cloudflare Workers API layer (documentation coming soon).

## Quick Start

Ensure Node.js ≥ 18 and pnpm ≥ 9 are installed.

```bash
pnpm install
pnpm --filter frontend dev
```

Visit http://localhost:5173 to explore the DailyDesk workspace shell.

## Project Goals

- Build a light-weight personal board for tracking tasks and goals.
- Overlay a calendar and daily planner for time-blocking work.
- Keep the interface fast, keyboard-friendly, and theme-aware.

For more details, see the [`frontend/README.md`](frontend/README.md).
