# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

There is no test runner configured.

## Environment

Copy `.env` and set `VITE_API_BASE_URL` (defaults to `http://localhost:8080/api`).

## Architecture

**Stack:** React 19, Vite 7, TailwindCSS 4, React Router 7, TanStack Query 5, Zustand, Axios, react-hook-form, lucide-react.

### Module Structure

Features live in `src/modules/`. Each module follows this layout:

```
ModuleName/
├── ModulePage.jsx          # Page-level component
├── components/             # UI sub-components (Table, Modal, Drawer, Form, Card)
└── api/
    ├── use*.js             # React Query hooks (queries + mutations)
    └── *Keys.js            # Query key factories for cache invalidation
```

`src/modules/index.js` re-exports all modules for the router.

### Routing (`src/App.jsx`)

All authenticated routes are wrapped in `<Layout>` (sidebar + topbar + `<Outlet>`). `/login` is standalone. Routes follow module paths: `/inventario/bodega/:id_bodega`, `/formulaciones`, `/comercial`, etc.

### API Layer (`src/api/`)

- `apiClient.js` — Axios instance. Reads `VITE_API_BASE_URL`. Auto-injects `Authorization: Bearer <token>` from `localStorage.token`. Handles 401 by redirecting to `/login`. Shows error toasts via `react-hot-toast`.
- `apiRoutes.js` — Centralized URL constants (AUTH, BODEGAS, ITEMS, FORMULACIONES, etc.).

Data fetching uses **React Query** (stale: 5 min, gcTime: 30 min, retry: 1, no refetch on focus). Mutations invalidate related query keys on success and show success/error toasts.

### Global State (`src/store/useBoundStore.js`)

Zustand store with two slices:
- `createUISlice` — Modal/Drawer open state and payloads, page title, confirmation dialog.
- `createInventorySlice` — Active warehouse ID and sede name (persisted to localStorage).

**Modal/Drawer pattern:** call `useBoundStore().openDrawer('KEY', payload)` from any component. The drawer/modal component reads the store and renders conditionally. Confirmation dialogs use `openConfirmModal({ title, message, onConfirm })`.

### Shared Components (`src/shared/`)

Reusable UI primitives (Button, Card, Drawer, Table, form controls, modals). Prefer these over one-off implementations.

### Styling

TailwindCSS 4 utility-first. Custom color tokens like `surface-base`, `surface-main` defined in the Tailwind config. No CSS modules.
