# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build to dist/
npm run lint      # ESLint check
npm run preview   # Preview production build
```

There is no test runner configured.

## Environment

Copy `.env` and set `VITE_API_BASE_URL` (defaults to `http://localhost:8080/api`).

## Architecture

**Stack:** React 19, Vite 7, TailwindCSS 4, React Router 7, TanStack Query 5, Zustand 5, Axios, react-hook-form, lucide-react, recharts, jsPDF, xlsx.

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

### Modules (20 total)

| Module | Route | Description |
|---|---|---|
| `sedes` | `/` | Sede (location) selection landing page |
| `Catalogo` | `/catalogo` | **Maestro de ítems**: unified catalog (replaces MateriasPrimas + Productos) |
| `Inventario` | `/inventario/bodega/:id_bodega` | Stock visualization per warehouse (read-only, no item creation) |
| `Bodegas` | `/instalaciones/bodegas/:id` | Warehouse management |
| `Formulaciones` | `/formulaciones` | Paint formulations (recipes) |
| `Produccion` | `/produccion` | Production orders |
| `Clientes` | `/clientes` | Client management |
| `Costos` | — | Item cost tracking |
| `CostosIndirectos` | — | Indirect costs |
| `Pagos` | `/pagos` | Client payment registration |
| `Cartera` | `/cartera` | Receivables / aging analysis |
| `Comercial` | `/comercial` | Quotations, invoicing, remissions (nested) |
| `Compras` | `/compras` | Purchase orders |
| `Proveedores` | `/proveedores` | Supplier management |
| `Movimientos` | `/movimientos` | Inventory movement log |
| `Rentabilidad` | `/rentabilidad` | Profitability analysis |
| `Tambores` | `/tambores` | Drum/container management |
| `Prorrateo` | `/prorrateo` | Cost allocation tool |
| `Login` | `/login` | Standalone auth page |

### Routing (`src/App.jsx`)

All authenticated routes are wrapped in `<Layout>` (sidebar + topbar + `<Outlet>`). `/login` is standalone. `<Layout>` protects routes by checking the auth state from Zustand.

### API Layer (`src/api/`)

- `apiClient.js` — Axios instance. Reads `VITE_API_BASE_URL`. Auto-injects `Authorization: Bearer <token>` from `localStorage.token`. Handles 401 by redirecting to `/login`. Shows error toasts via `react-hot-toast`. **Important**: the response interceptor already extracts `response.data`, so hooks receive the payload directly — never do `res.data.data`.
- `apiRoutes.js` — Centralized URL constants for all backend endpoints.

**Current `apiRoutes.js` key entries:**
- `UNIDADES: '/unidades'`
- `ITEMS.BUSCAR: (q, tipos) => '/item_general/buscar?q=...' + (tipos?.length ? '&tipos=...' : '')`
- `REQUISICIONES` and `PREPARACIONES` objects
- `CAPAS` object: `POR_ITEM(itemId)`, `BODEGAS`, `POR_PREPARACION(prepId)` — cost layer endpoints
- `FORMULACIONES_OPCIONES_INGREDIENTES: (itemId) => '/formulaciones/{id}/opciones-ingredientes'` — per-ingredient supplier options

Data fetching uses **React Query** (stale: 5 min, gcTime: 30 min, retry: 1, no refetch on focus). Mutations invalidate related query keys on success and show success/error toasts.

### Global State (`src/store/`)

Zustand store composed from slices via `useBoundStore.js`:
- `authSlice` (`slices/authSlice.js`) — User auth state (token, user info).
- `useUISlice` (`slices/useUISlice.js`) — Modal/Drawer open state and payloads, page title, confirmation dialog.
- `inventorySlice` (`slices/inventorySlice.js`) — Active warehouse ID and sede name (persisted to localStorage).

**Modal/Drawer pattern:** call `useBoundStore().openDrawer('KEY', payload)` from any component. The drawer/modal component reads the store and renders conditionally. Confirmation dialogs use `openConfirmModal({ title, message, onConfirm })`.

### Shared Components (`src/shared/`)

Reusable UI primitives — prefer these over one-off implementations:

`AmountDisplay`, `Button`, `Card`, `ConfirmModal`, `DetailDrawer`, `Drawer`, `ErpTable`, `HeaderSection`, `ItemGeneralSearch`, `Loader`, `SearchFilterBar`, `Sidebar`, `Skeletons`, `StatusBadge`, `SummaryCard`, `Topbar`, `Form/` (form controls subdirectory).

#### `Drawer.jsx` — size prop

Accepts `size` prop: `'md'` (default) | `'lg'` | `'xl'` | `'2xl'`. Maps to Tailwind `max-w-*` classes. Use `size="xl"` for forms with many fields.

#### `ItemGeneralSearch.jsx` — fuzzy search + price comparison

Props:
- `value` — selected item object (`{id_item_general, nombre, codigo, ...}`) or `null`
- `onChange(item | null)` — selection callback
- `label` — field label string
- `placeholder` — input placeholder
- `autoSearch` — string to trigger automatic search on mount
- `tipos` — `number[]` filter by item tipo (default `[1, 2]` = Materia Prima + Insumo only; never shows Producto tipo=0)
- `precioActual` — current item_proveedor price for comparison badge

**Selected state** shows a green card with:
- `PrecioComparacion` sub-component: internal cost (`costo_unitario` from costos_item JOIN), supplier list (1 supplier → direct chip; multiple → collapsible with `ChevronDown/Up`), comparison badge (TrendingDown=cheaper, TrendingUp=more expensive, Minus=in range).
- Supplier chips use `PROV_COLORS` cycling array.
- `parseLista(raw)` parses `"Nombre|precio;;;Nombre2|precio2"` GROUP_CONCAT format.

**Dropdown** items show nombre, código, `costo_unitario` if available, provider count.
Badges in dropdown: `w-20 text-center` fixed width to prevent layout shifts.

**Race condition prevention**: `ignorarRef = useRef(false)` — set to `true` when an item is selected to suppress in-flight API responses from re-opening the dropdown. Reset to `false` on new input.

### `src/api/useUnidades.js` (NEW 2026-04-21)

```js
export const useUnidades = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['unidades'],
    queryFn: async () => { const res = await apiClient.get(API_ROUTES.UNIDADES); return Array.isArray(res) ? res : []; },
    staleTime: Infinity,  // units rarely change
  });
  return { unidades: data, isLoading };
};
```

### Styling

TailwindCSS 4 utility-first. Custom color tokens like `surface-base`, `surface-main` defined in the Tailwind config. No CSS modules.

**Layout conventions:**
- Page root: `flex flex-col w-full gap-4`
- Use `HeaderSection` for page headers
- Borders: `border-zinc-100`
- Cards/panels: `rounded-2xl`

### Sidebar Navigation

`src/config/sidebarMenu.js` drives sidebar links and grouping. Add new routes here when creating a new module.

### Exports

- **PDF**: jsPDF (`^4.2.0`) + html2canvas (`^1.4.1`) + jspdf-autotable (`^5.0.7`)
- **Excel**: xlsx (`^0.18.5`)
- **Charts**: recharts (`^3.8.1`)

## Key Recent Changes (2026-04-21) — Proveedores Module

### `ItemProveedorForm.jsx` — complete rewrite

- `NombreAutocomplete` sub-component manages product name input with two dropdown sections:
  1. **"En inventario interno"** — results from `buscarFuzzy` (item_general with tipos=[1,2]), shows nombre + código + price
  2. **"Registrado por proveedor — sin inventario"** — items from `catalogo` filtered by `!item_general_id`, shows nombre + supplier + price + orange "Sin inventario" badge
- `ignorarRef = useRef(false)` + `cerrarTras(fn)` helper pattern prevents dropdown from reopening after selection due to in-flight debounced API calls.
- `handleSelectInterno` → sets `itemGeneral` to the full item object (triggers green card in `ItemGeneralSearch`)
- `handleSelectSinInventario` → sets `itemGeneral` to `{id_item_general: null, nombre, codigo, _pendiente: true}` — shows green card with "Se creará automáticamente..." message
- **No `autoSearch` prop** on `ItemGeneralSearch` — avoids double dropdown. The nombre autocomplete and item_general search are deliberately decoupled.
- `_pendiente` flag: when `itemGeneral?._pendiente === true`, shows info message that item_general will be auto-created on save.
- Unit/factor panel (unidad_compra_id + factor_conversion) only shown when `itemGeneral` is set.
- Drawer uses `size="xl"`.
- Duplicate detection: checks `catalogo.find(c => same proveedor_id + same nombre)` before save.

### `VincularModal.jsx` — updated

- Replaced manual search input + `useItem()` with `ItemGeneralSearch` component.
- Added `useUnidades` hook + unit/factor panel (identical to ItemProveedorForm).
- `precioActual={item.precio_unitario ?? 0}` passed to ItemGeneralSearch for price comparison.

## Unit of Measure Design

- `item_general.unidad_id` = sales/presentation unit (GALON, TAMBOR, CUÑETE)
- `item_general.unidad_almacenaje_id` = storage base unit (**KILO** for all raw materials; id=9)
- `item_proveedor.unidad_compra_id` = unit the supplier sells in (e.g., BULTO, CANECA)
- `item_proveedor.factor_conversion` = multiplier purchase→base (e.g., 1 BULTO = 25 KG → factor=25)
- **Rule**: all inventory quantities stored in base unit (KILO). Conversion at OC receipt time.
- **Costing strategy**: Promedio Ponderado Móvil (moving weighted average) — implemented via backend `InventarioCapasModel::recalcularPromedioPonderado()` on OC receipt.

## Key Recent Changes (2026-04-24) — Cost Layers & Per-ingredient Provider Selection

### Produccion Module — New files

- `src/modules/Produccion/api/useCapasStock.js` — React Query hooks for cost layers:
  - `useCapasStock(itemGeneralId, bodegaId)` — fetches active layers for an item (staleTime 30s)
  - `useBodegasConCapas()` — fetches bodegas with active layers (staleTime 60s)
  - Exports `capasKeys` for cache invalidation

- `src/modules/Produccion/components/CapasStockPanel.jsx` — Collapsible panel per ingredient showing all cost layers:
  - Displays: provider name, lot, entry date, days in stock, available qty, cost/kg, bodega
  - Toggle between FIFO automatic and Manual selection modes
  - Bodega dropdown filter
  - Manual mode: quantity input per layer with max validation
  - FIFO mode: auto-assigns from oldest layers
  - Shows deficit warning when stock < needed
  - Calculates weighted cost of selection in real-time
  - Props: `itemGeneralId`, `nombre`, `cantidadNecesaria`, `modo`, `onModoChange`, `onSeleccionChange`, `seleccionActual`, `bodegaSeleccionada`, `onBodegaChange`

### Formulaciones Module — Modified files

- `src/modules/Formulaciones/components/ProveedorCostSelect.jsx` — Fixed dropdown using `createPortal` to render at document.body level. Dropdown was previously clipped by parent's `overflow-hidden`.

- `src/modules/Formulaciones/components/FormulacionesTable.jsx` — Added per-ingredient provider selection:
  - New `IngredienteProveedorSelect` sub-component: inline portal-based dropdown per ingredient row showing linked suppliers with `precio_por_kg`
  - When a supplier is selected, the row's cost columns dynamically recalculate using that supplier's price
  - Rows with overridden costs are highlighted in amber
  - Footer shows "Selección" total when any ingredient has a custom supplier
  - New props: `opcionesIngredientes`, `seleccionPorIngrediente`, `onSeleccionIngrediente`

- `src/modules/Formulaciones/components/preparationModal.jsx` — Integrated `CapasStockPanel` into the preparation confirmation flow:
  - `capasConfig` state manages per-ingredient layer selection: `{ [itemId]: { modo, capas, seleccionManual, bodega_id } }`
  - "Fuentes de Suministro" collapsible section with `CapasStockPanel` per ingredient
  - `buildPayload` includes `modo_consumo`, `capas`, and `bodega_id` per ingredient in detalle

- `src/modules/Formulaciones/FormulacionesPage.jsx` — Added `seleccionPorIngrediente` state and passes `opcionesIngredientes` + handlers to `FormulacionesTable`

- `src/modules/Formulaciones/api/useFormulaciones.js` — Added `queryOpcionesIngredientes` query for per-ingredient supplier options. Returns `opcionesIngredientes` and `isLoadingOpcionesIngredientes`.

- `src/modules/Formulaciones/api/FormulacionKeys.js` — Added `opcionesIngredientes(itemId)` query key

- `src/api/apiRoutes.js` — Added `CAPAS` object and `FORMULACIONES_OPCIONES_INGREDIENTES` route

### Portal Dropdown Pattern

When dropdowns inside tables or `overflow-hidden` containers get clipped, use `createPortal(dropdown, document.body)` with:
1. `useRef` on the trigger button to get `getBoundingClientRect()`
2. `fixed` positioning + `z-[9999]` on the portal element
3. Scroll/resize listeners to reposition
4. Outside-click handler checking both trigger and dropdown refs

Used in: `ProveedorCostSelect`, `IngredienteProveedorSelect` (inside `FormulacionesTable`)

## Key Recent Changes (2026-04-24) — Catálogo Module

### New Module: `src/modules/Catalogo/`

Replaces `Productos` and `MateriasPrimas` modules. Single source of truth for item creation and management.

**Structure:**
```
Catalogo/
├── CatalogoPage.jsx              # Main page with table + create button
├── api/
│   ├── catalogoKeys.js           # Query key factory
│   └── useCatalogo.js            # React Query hooks (list, detail, proveedores, CRUD mutations)
└── components/
    ├── CatalogoTable.jsx         # Table with type-filter tabs (Todos/Productos/MP/Insumos) + search + pagination
    ├── ItemDetailModal.jsx       # Detail modal with 2 tabs + stock badge
    ├── InfoTab.jsx               # Tab 1: basic data + technical specs
    ├── SuministroTab.jsx         # Tab 2: linked proveedores table + stock per bodega
    └── CatalogoForm.jsx          # Create/edit form (item attributes only, no inventory)
```

**API Routes (in `apiRoutes.js`):**
```js
CATALOGO: {
  LIST:        '/catalogo',
  DETAIL:      (id) => `/catalogo/${id}`,
  PROVEEDORES: (id) => `/catalogo/${id}/proveedores`,
}
```

**Key design decisions:**
- Item creation from Catálogo does NOT create inventory entries — stock enters only via OC receipt
- `InventarioPage` renamed to "Existencias y Lotes", removed "Agregar Item" button and `ItemFormModal`
- `CatalogoTable` filters by `tipo` using tab buttons (server returns all types, filtering is client-side)
- `ItemDetailModal` fetches full detail via `GET /api/catalogo/{id}` which includes proveedores array and stock_por_bodega

### Removed Modules
- `MateriasPrimas/` — replaced by Catálogo with tipo=1 filter
- `Productos/` — replaced by Catálogo with tipo=0 filter
- Routes `/materias-primas` and `/productos` removed from App.jsx

### Modified: `InventarioPage.jsx`
- Title changed: "Gestión de Inventario" → "Existencias y Lotes"
- Removed: `ItemFormModal` component, "Agregar Item" button, `FlaskConical` "Agregar Formulación" button
- Kept: Refresh, Filters, Export, Import Excel, Conteo Rápido

### Modified: `sidebarMenu.js`
- Added: `{ link: 'catalogo', label: 'Catálogo', icon: BookOpen }` at position 2 (after Panel Principal)
- Removed: Productos and MateriasPrimas were not in sidebar (they were accessed via other routes)

## Pending / Next Steps

- **Requisiciones management page**: frontend page in Compras module to list, approve, and convert requisitions to OC.
- **"Sin vincular" badge**: visual indicator on item_proveedor table rows with no `item_general_id`.
