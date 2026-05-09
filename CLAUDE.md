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

---

## PRODUCCIÓN — Auditoría de Gaps (2026-05-09)

> Resultado de auditoría pre-producción completa del frontend. Resolver los CRÍTICOS antes de cualquier despliegue.

### 🔴 CRÍTICOS — Bloquean producción

#### 1. Login Page no funcional
- **Archivo**: `src/modules/Login/Login.jsx`
- **Problema**: El componente es puramente presentacional. Los inputs no tienen `value`/`onChange`, el botón de submit es `type="button"` sin `onClick`, no hay integración con la API ni redirección tras login exitoso. **El usuario no puede autenticarse.**
- **Fix**:
  1. Agregar estado con `useState` para `username` y `password`
  2. Llamar a `POST /api/login` via `apiClient`
  3. Guardar el token en `localStorage` y en el store de Zustand (`authSlice`)
  4. Redirigir a `/` con `useNavigate()` tras login exitoso
  5. Mostrar error toast si falla

#### 2. `<Layout>` no protege rutas autenticadas
- **Archivo**: `src/Layout.jsx`
- **Problema**: El componente que envuelve todas las rutas autenticadas NO verifica si hay token válido. Cualquier persona puede acceder a `/catalogo`, `/compras`, `/produccion`, etc. directamente por URL sin estar autenticada.
- **Fix**: En `Layout.jsx`, agregar guard al montar:
  ```jsx
  const token = useBoundStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  ```

#### 3. Sin ruta 404
- **Archivo**: `src/App.jsx`
- **Problema**: No existe `<Route path="*" />`. Las URLs inválidas muestran pantalla en blanco.
- **Fix**: Crear `src/shared/NotFound.jsx` y agregar al final de las rutas:
  ```jsx
  <Route path="*" element={<NotFound />} />
  ```

#### 4. React Query DevTools cargando en producción
- **Archivo**: `src/main.jsx`
- **Problema**: `<ReactQueryDevtools />` se carga incondicionalmente, exponiendo el cache de queries y estructura de datos en el navegador del usuario.
- **Fix**:
  ```jsx
  {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  ```

---

### 🟠 ALTOS — Resolver antes de abrir a usuarios reales

#### 5. 31 `console.log()` activos en código de producción
- **Archivos con más instancias**:
  - `src/modules/Cartera/components/ModalRegistrarPago.jsx` — 6 console.log (líneas 90, 98, 102, 117, 121, 124)
  - `src/modules/Cartera/api/useCartera.js` — 4 console.log + 2 console.error
  - `src/modules/Inventario/Components/TraspasoModal.jsx` — `console.log('payload traspaso:', payload)` con comentario `← agrega esto`
- **Impacto**: Expone estado interno, respuestas de API y lógica de negocio en el navegador. Degradación de rendimiento.
- **Fix**: Buscar globalmente con `grep -r "console\." src/` y eliminar todos. Solo conservar `console.error()` en bloques `catch` para errores inesperados.

#### 6. Sin Error Boundary
- **Problema**: Si cualquier componente lanza una excepción no capturada, la app completa muestra pantalla en blanco sin mensaje amigable ni posibilidad de recuperación.
- **Fix**: Crear `src/shared/ErrorBoundary.jsx` (componente de clase) y envolver `<App />` en `main.jsx`.

#### 7. Vite no configurado para producción
- **Archivo**: `vite.config.js`
- **Problema**: Config mínima sin optimizaciones de build.
- **Fix recomendado**:
  ```js
  build: {
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': ['lucide-react', 'recharts'],
        }
      }
    }
  }
  ```

#### 8. `VITE_API_BASE_URL` apunta a localhost
- **Archivo**: `.env`
- **Problema**: `VITE_API_BASE_URL=http://localhost:8080/api` — en producción debe apuntar al servidor real.
- **Fix**: Crear `.env.production` con la URL del servidor de producción. Nunca commitear `.env.production`.

#### 9. Sin `.env.example`
- **Problema**: Un desarrollador nuevo no sabe qué variables de entorno se necesitan.
- **Fix**: Crear `.env.example`:
  ```
  VITE_API_BASE_URL=http://localhost:8080/api
  ```

#### 10. Título de pestaña vacío
- **Archivo**: `index.html` línea 7
- **Problema**: `<title></title>` — el navegador muestra pestaña sin nombre.
- **Fix**: `<title>PINCA — Gestión Industrial</title>`

---

### 🟡 MEDIOS — Mejoras importantes post-MVP

#### 11. Módulos `MateriasPrimas/` y `Productos/` no eliminados (código muerto)
- **Problema**: CLAUDE.md dice que fueron eliminados pero los directorios y archivos siguen existiendo. Aumentan el bundle size y generan confusión.
- **Fix**: Eliminar `src/modules/MateriasPrimas/` y `src/modules/Productos/` completamente.

#### 12. Módulos `Costos` y `CostosIndirectos` implementados pero sin ruta
- **Archivos**: `src/modules/Costos/CostosPage.jsx` (196 líneas), `src/modules/CostosIndirectos/`
- **Problema**: Páginas completas marcadas como `—` en la tabla de módulos. No están accesibles para el usuario.
- **Decisión pendiente**: O agregar ruta + enlace en `sidebarMenu.js`, o documentar explícitamente que están deshabilitadas y por qué.

#### 13. Sin manejo de sesión expirada (token refresh)
- **Archivo**: `src/api/apiClient.js`
- **Problema**: Cuando el token de 8 horas expira, la app redirige a `/login` abruptamente perdiendo el trabajo no guardado. No hay refresh token ni renovación silenciosa.
- **Fix de mínimo**: Mostrar modal de "Tu sesión expiró, inicia sesión nuevamente" en lugar de redirigir sin aviso. Fix completo requiere implementar refresh token en backend.

#### 14. Typo en nombre de archivo del módulo Prorrateo
- **Archivo**: `src/App.jsx` línea 9
- **Problema**: `import Prorrateo from "./modules/Prorrateo/Prorreateo"` — el archivo se llama `Prorreateo.jsx` (con 'e' extra).
- **Fix**: Renombrar archivo a `Prorrateo.jsx` y actualizar el import.

#### 15. Sin indicación visual de modo read-only en Inventario
- **Problema**: El módulo "Existencias y Lotes" es read-only pero el usuario no lo sabe. Puede generar confusión esperando poder agregar items.
- **Fix**: Agregar banner o badge informativo: "Este módulo es solo lectura. El stock ingresa vía Órdenes de Compra."

---

### 🔵 BAJOS — Deuda técnica

- **Sin tests**: No existe configuración de Vitest ni testing-library. Sin tests, los cambios en componentes críticos (Produccion, Formulaciones, Cartera) son riesgosos.
- **Axios desactualizado**: v1.13.5 — verificar si hay actualizaciones de seguridad pendientes con `npm audit`.
- **Sin documentación de componentes**: Los shared components clave (`CapasStockPanel`, `ItemGeneralSearch`, `ErpTable`) no tienen JSDoc en sus props.
- **Queries sin error handling granular**: Muchos `useQuery` hooks no diferencian entre error de red, 404 y 500. El usuario ve el mismo mensaje genérico para todos.

---

### Checklist Pre-Deploy

```
□ Login page funcional (form → API → token → redirect)
□ Layout protege rutas (redirige a /login sin token)
□ Ruta 404 creada y registrada
□ ReactQueryDevtools solo en DEV
□ Todos los console.log() eliminados
□ Error Boundary configurado en main.jsx
□ Vite build configurado para producción (minify, chunks)
□ .env.production con URL real del backend
□ Título de pestaña configurado en index.html
□ npm audit sin vulnerabilidades críticas
□ Build de producción ejecutado y testeado: npm run build && npm run preview
```

---

### Estado por módulo (2026-05-09)

| Módulo | Ruta | Estado UI | Notas |
|--------|------|-----------|-------|
| Login | `/login` | ❌ No funcional | Requiere implementación completa |
| sedes | `/` | ✅ | — |
| Catalogo | `/catalogo` | ✅ | — |
| Inventario | `/inventario/...` | ✅ | Read-only, falta indicador visual |
| Bodegas | `/instalaciones/bodegas/:id` | ✅ | — |
| Formulaciones | `/formulaciones` | ✅ | — |
| Produccion | `/produccion` | ✅ | — |
| Clientes | `/clientes` | ✅ | — |
| Comercial | `/comercial` | ✅ | — |
| Compras | `/compras` | ✅ | Falta página Requisiciones |
| Proveedores | `/proveedores` | ✅ | Falta badge "Sin vincular" |
| Cartera | `/cartera` | ✅ | Tiene console.logs — limpiar |
| Pagos | `/pagos` | ✅ | — |
| Movimientos | `/movimientos` | ✅ | — |
| Rentabilidad | `/rentabilidad` | ✅ | — |
| Tambores | `/tambores` | ✅ | — |
| Prorrateo | `/prorrateo` | ✅ | Typo en nombre de archivo |
| Costos | — | ⚠️ Sin ruta | Página implementada, sin acceso |
| CostosIndirectos | — | ⚠️ Sin ruta | Página implementada, sin acceso |
| MateriasPrimas | — | 🗑️ Eliminar | Reemplazado por Catálogo |
| Productos | — | 🗑️ Eliminar | Reemplazado por Catálogo |
