# CLAUDE.md — Pinca Frontend

> Este archivo es la **fuente de verdad** para cualquier Claude que retome este proyecto. Está organizado para leerse en orden de necesidad: contexto rápido arriba, detalles técnicos abajo.

## 1. Estado actual (snapshot 2026-05-29)

> **Última sesión**: 2026-05-29 (tarde) — fixes de auditoría: botones de modal Export visibles en dark, rollback en mutación optimista de `useItem`, fallback de error en `useCatalogo`, `SummaryCard` muerto eliminado. Ver §26.
> **Anterior (misma fecha)**: Dark mode foundation + virtualización + bulk actions + Vitest + ESLint 0 errors. Ver §25.
>
> **Sesiones anteriores**: §24 (2026-05-27 refresh token UX + Excel), §23 (2026-05-25 tarde code-splitting), §22 (2026-05-25 mediodía), §21 (audit), §20 (2026-05-21).

> **Sesión 2026-05-19**: IVA toggle global, FormDate component (reemplaza inputs nativos en 11 archivos), módulo Costos eliminado y unificado en Rentabilidad, sidebar singleton sin flyout, Salud de cartera rediseñada. Ver §18.

### Snapshot anterior (2026-05-12)

**Proyecto**: PINCA (Pinturas Industriales del Caribe S.A.S) — Sistema ERP web.
**Stack**: React 19, Vite 7, TailwindCSS 4, React Router 7, TanStack Query 5, Zustand 5, Axios, react-hook-form, lucide-react, recharts, jsPDF, xlsx.
**Backend**: PHP en `pinca_backend/` (no relevante para frontend salvo endpoints).

### Última fase completada — Pinca 2.0 Design Migration

Estado: **✅ 100% completo** en `src/modules/` y `src/shared/`. Build limpio (~9s).

| Métrica | Antes | Después |
|---|---|---|
| Hardcoded Tailwind colors (`zinc-X`, `blue-X`, etc.) | 2566 | **0** |
| Archivos JSX migrados | — | 145 |
| Build time | 12-19s | 9.24s |
| Tipografía | system default | **Outfit** (Google Fonts) |
| Brand color | Amarillo Pinca `#FBBF24` | Confirmado (único brand) |

Excepción: `src/utils/avatarTheme.js` mantiene paleta de gradientes hardcoded por diseño (identidad por usuario).

### Lo que se hizo en orden cronológico

1. **Fase 0-1** — Foundation: tokens CSS completos (brand, surface, content, border, semantic con `-subtle`/`-fg`), radios (xs→pill), shadows (xs→2xl + lift), z-index scale.
2. **Fase 2** — Refactor crítico: FacturaForm, PagoForm, ModalRegistrarPago, OrdenDrawer, ItemDetailModal, TraspasoModal, ExcelModal — todos pasaron a usar shared components (Drawer, Modal, FormInput, Button).
3. **Fase 3** — Tablas + navegación: MovimientosTable migrado a `ErpTable`, `PageTabs` shared adoptado en Cartera+Comercial, otras tablas tokenizadas (Catalogo, Inventario DataTable, ProveedoresTable, FacturasTable).
4. **Fase 4** — Polish: badges unificados con `StatusBadge` (ItemDetailModal, MovimientosTable, FacturasTable, ProveedoresTable, DisponibilidadModal, InventarioGlobal, TamboresPage…). Creación de `FormSection`. CotizacionDrawer y GestionesCobroDrawer tokenizados.
5. **Fase 5-6** — Pinca 2.0: tipografía Outfit, radios generosos, hover-lift, nuevos componentes (`IconBox`, `FlowCard`, `EmptyState`, `ProgressPill`, `ActionMenu`). Pilot: Inventario + Cartera. Login redesign completo.
6. **Migración masiva final** — 4 scripts `sed` aplicaron tokenización a los 18 módulos restantes en bloques. Topbar reescrito manualmente para chrome oscuro. Sidebar ya estaba migrado.

---

## 2. Comandos

```bash
npm run dev       # Vite dev server → http://localhost:5173
npm run build     # Build prod → dist/
npm run lint      # ESLint
npm run preview   # Preview build prod
```

**Sin tests configurados**. Si se agregan, usar Vitest.

**Env**: copia `.env.example` → `.env` y setea `VITE_API_BASE_URL` (default `http://localhost:8080/api`).

---

## 3. Arquitectura

### Routing — `src/App.jsx`

Todas las rutas (excepto `/login` y `*`) están envueltas en `<Layout>`:

| Path | Componente |
|---|---|
| `/login` | `Login` |
| `/` | `SedePage` (selector de sede) |
| `/catalogo` | `CatalogoPage` |
| `/inventario-global` | `InventarioGlobalPage` |
| `/inventario/bodega/:id_bodega` | `InventarioPage` |
| `/instalaciones/bodegas/:id` | `BodegaPage` |
| `/formulaciones` | `FormulacionesPage` |
| `/produccion` | `ProduccionPage` |
| `/comercial` | `ComercialPage` (tabs internos: Cotizaciones, Remisiones, Facturas) |
| `/compras` | `ComprasPage` |
| `/cartera` | `CarteraPage` (tabs: Dashboard, Facturas) |
| `/pagos` | `PagosPage` |
| `/proveedores` | `ProveedoresPage` |
| `/clientes` | `ClientePage` |
| `/movimientos` | `MovimientosPage` |
| `/rentabilidad` | `RentabilidadPage` |
| `/tambores` | `TamboresPage` |
| `/prorrateo` | `Prorrateo` |
| `/roles` | `RolesPage` |
| `*` | `NotFound` |

`Layout` protege rutas: si no hay token en store → redirect a `/login`.

### Módulos (`src/modules/`)

24 módulos en total (snapshot 2026-05-25 — la doc anterior decía 20). Cada uno sigue el patrón:

```
ModuleName/
├── ModulePage.jsx          # Page-level component
├── components/             # Sub-components (Table, Modal, Drawer, Form, Card)
└── api/
    ├── use*.js             # React Query hooks (queries + mutations)
    └── *Keys.js            # Query key factories
```

**Inconsistencias conocidas**:
- 🔴 `Costos/` (8 archivos JSX) y `CostosIndirectos/` (1) tienen páginas pero **NO tienen ruta** en App.jsx ni entrada en sidebar. Código muerto o pendiente de habilitar. **Decisión pendiente del usuario**: borrar o agregar rutas.
- 🟡 `Comercial/` no tiene carpeta `api/` propia (usa `Cotizaciones/api/`, `Facturacion/api/`, `Remisiones/api/` anidados — es correcto).
- 🟡 5 módulos sin enlace en sidebar pero con ruta: `Pagos`, `Tambores`, `Prorrateo`, `Roles`, `Login`. Acceso por URL directa o link desde otro módulo.

### Sidebar (`src/config/sidebarMenu.js`)

12 items visibles (filtra por `moduloKey` contra `user.modulos`):

`panel-principal`, `catalogo`, `inventario-global`, `formulaciones`, `produccion`, `rentabilidad`, `comercial`, `compras`, `cartera`, `clientes`, `proveedores`, `movimientos`.

### Módulos del sistema (`src/config/modulos.js`)

16 keys agrupadas para permisos: `MODULOS_SISTEMA` array + `ROLES_LABELS` map. Grupos: Sistema, Inventario, Producción, Análisis, Ventas, Compras, Finanzas, Relaciones.

---

## 4. Design System — Pinca 2.0

Toda la verdad visual vive en **`src/index.css`**. Cambiar un token allí propaga al sistema entero.

### Tipografía

- **Familia**: `Outfit` (Google Fonts, pesos 300-800). Cargada via `@import url(...)` ANTES de `@import "tailwindcss"` (orden crítico — si se rompe, los `@import` posteriores se invalidan).
- **Aplicada en**: `html, body, #root` + `button, input, select, textarea, optgroup` (via `font-family: inherit`).
- **Antialiasing**: `-webkit-font-smoothing: antialiased`.
- **Letter-spacing en headings**: `-0.015em`.

### Escala tipográfica (compact ERP)

| Token | rem | px |
|---|---|---|
| `text-xs` | 0.6875 | **11** |
| `text-sm` | 0.8125 | **13** |
| `text-base` | 0.875 | **14** |
| `text-lg` | 1 | **16** (h3) |
| `text-xl` | 1.125 | **18** (h2, hero values) |
| `text-2xl` | 1.375 | **22** (h1 contado) |
| `text-3xl` | 1.75 | **28** (hero KPIs) |

Las fuentes son **deliberadamente más chicas** que default Tailwind para mantener densidad ERP profesional. Si una vista se ve "muy grande", probablemente está usando `text-xl` donde debería ser `text-lg`.

### Paleta (hex completos)

**Brand** (Amarillo Pinca, único color de marca):
```
brand-primary:        #FBBF24    brand-primary-hover:  #F59E0B
brand-primary-active: #D97706    brand-on-primary:     #18181B (texto sobre amarillo)
brand-subtle:         color-mix(#FBBF24 20%, transparent)
```

**Surfaces** (capas verticales):
```
surface-base:    #FFFFFF   surface-subtle:        #FAFAFA
surface-muted:   #F4F4F5   surface-strong:        #E4E4E7
surface-elevated:#FFFFFF   surface-overlay:       rgba(9,9,11,0.45)
surface-sidebar: #09090B   surface-sidebar-hover: #18181B
```

**Content** (texto):
```
content-primary:   #18181B   content-secondary:  #3F3F46
content-tertiary:  #71717A   content-muted:      #A1A1AA
content-inverse:   #FAFAFA   content-on-brand:   #18181B
```

**Borders**:
```
border-subtle: #F4F4F5   border-base:   #E4E4E7
border-strong: #D4D4D8   border-focus:  #18181B
```

**Semantic** (cada uno con base + `-subtle` + `-fg`):
```
success: #10B981 / #D1FAE5 / #065F46
danger:  #EF4444 / #FEE2E2 / #991B1B
warning: #F59E0B / #FEF3C7 / #92400E
info:    #3B82F6 / #DBEAFE / #1E40AF
```

### Radios

```
xs:   4px    sm:   6px (badges, mini-buttons)
md:   8px    (default inputs)
lg:  12px    (cards, table rows estilo card)
xl:  16px    (cards principales, modales)
2xl: 20px    (drawers, hero cards)
3xl: 24px    (modales grandes)
pill: 9999   (botones, badges full-rounded — DEFAULT en Button)
```

### Sombras

```
shadow-xs / sm / md / lg / xl / 2xl  (scale estándar)
shadow-card    — sutil para card en reposo
shadow-lift    — para card en hover + translateY(-2px)
shadow-focus   — ring amarillo brand (3px, 25% opacity)
```

Utility custom: `hover-lift` aplica `translateY(-2px) + shadow-lift` con transición.

### Z-index scale

```
sticky: 10   dropdown: 40   overlay: 100   modal: 110
popover: 120   toast: 200   tooltip: 300
```

### Compact mode

`<html class="pinca-compact">` reduce padding de `td/th` a 4px y font a 12px. Toggle desde UserPanel (Preferencias).

---

## 5. Componentes shared (`src/shared/`)

**Regla de oro**: nunca hardcodes `zinc-X`, `blue-X`, `emerald-X`, etc. en componentes nuevos. Usa siempre los tokens.

### Layout & Navigation

| Componente | API | Notas |
|---|---|---|
| `HeaderSection` | `title`, `subtitle`, `icon`, `breadcrumbs[{label, path}]` | Usa `IconBox` interno con tone="dark". Título es `text-lg`. |
| `PageTabs` | `tabs[{key, label, icon?, count?}]`, `value`, `onChange`, `variant: underline\|pill`, `size: sm\|md` | Default `underline`. Usa `pill` para filtros internos. |
| `Sidebar` | (sin props — lee Zustand) | Colapsable on hover. Logo Pinca. |
| `Topbar` | (sin props) | Chrome oscuro, `bg-surface-sidebar`. h-14. |
| `UserPanel` | (sin props — abre via `openDrawer('USER_PANEL')`) | Panel a 50vw con tabs: Mi Cuenta, Seguridad, Ajustes, Empresa (admin), Roles (admin). Color de avatar customizable desde Ajustes. |

### Surfaces

| Componente | API | Cuándo usar |
|---|---|---|
| `Card` | `title`, `bar`, `details[{icon,label,value,color}]`, `linkTo`, `onEdit`, `onDelete` | Cards de entidad (cliente, factura). |
| `FlowCard` ✨ | `icon`, `tone`, `label`, `value`, `sub`, `active`, `onClick` | KPI con icon-box + número grande + barra lateral. **Usar en headers de dashboard**. |
| `SummaryCard` | `label`, `value`, `icon`, `color`, `sub`, `trend` | Versión simple de FlowCard (legacy). Preferir FlowCard. |
| `IconBox` ✨ | `icon`, `tone`, `variant: subtle\|solid\|outline`, `size: sm\|md\|lg\|xl`, `shape: square\|rounded\|pill` | Container coloreado para icons. Reusable en headers, KPIs. |

### Forms (`src/shared/Form/`)

Constantes en `Form/styles.js`: `INPUT_BASE`, `INPUT_BASE_DENSE`, `INPUT_ERROR`, `LABEL_BASE`, `LABEL_REQUIRED_MARK`, `FIELD_ERROR`, `FIELD_HINT`, `FIELD_WRAPPER`, `GRID_INPUT_BASE`.

| Componente | Props clave |
|---|---|
| `FormInput` | `label`, `error`, `required`, `leftSymbol`, `registration` (RHF) |
| `FormSelect` | `options`, `value`, `onChange`, `error`, `placeholder`, `disabled` — dropdown via portal |
| `FormTextarea` (archivo: `FormTexarea.jsx` — typo legacy) | `label`, `rows`, `registration`, `error` |
| `InputMoneda` | `label`, `value`, `onChange` — formatea COP automáticamente, retorna número |
| `GridInput` | Input para celdas de tabla (no para forms normales) |
| `FormSection` ✨ | `title`, `icon`, `description`, `action`, `variant: plain\|card`, `gap` |

**Regla**: si vas a crear un input nuevo, importa `INPUT_BASE` de `Form/styles.js` en vez de copiar clases. **Nunca** reescribas un `inputCls = "..."` local (era un anti-patrón corregido en Fase 2).

### Feedback

| Componente | Notas |
|---|---|
| `StatusBadge` ✨ | **EL único componente de badge**. Props: `estado` (auto-detecta tone), `tone`, `label`, `icon`, `dot`, `size: sm\|md\|lg`, `variant: subtle\|solid\|outline`, `shape: pill\|square`, `fixedWidth`, `minWidth` (default true). Tiene `STATUS_TONE` map para estados conocidos (Pendiente→warning, Pagada→success, etc.). |
| `EmptyState` ✨ | `icon`, `title`, `description`, `action`, `size: sm\|md\|lg` |
| `ProgressPill` ✨ | `value` (0-100), `label`, `tone`, `size`, `showPercent`, `right` (override del % a la derecha) |
| `Loader` | Exporta `FullPageLoader`, `ComponentLoader`, `MiniLoader` |
| `Skeletons` | Exporta `SkeletonCard`, `SkeletonRow` |
| `ErrorBoundary` | Envuelve `<App />` en main.jsx (verificar) |
| `NotFound` | Página 404 (ruta `*`) |

### Overlay

| Componente | API |
|---|---|
| `Modal` ✨ | `isOpen`, `onClose`, `size: sm\|md\|lg\|xl\|2xl\|full`, `title`, `icon`, `description`, `footer`, `closeOnBackdrop`, `closeOnEsc`, `showClose`, `bodyClassName` |
| `Drawer` | `isOpen`, `onClose`, `size: sm\|md\|lg\|xl\|2xl\|3xl\|4xl`, `title`, `icon`, `description`, `footer`, `bodyClassName`. Slide desde derecha. |
| `DetailDrawer` | Read-only drawer. `width: sm\|md\|lg\|xl`. Sin footer. |
| `ConfirmModal` | (sin props — controlado por Zustand). Variants: `danger\|success\|warning\|info`. |

### Tables

| Componente | API |
|---|---|
| `ErpTable` | `columns`, `data`, `isLoading`, `EmptyIcon`, `emptyMessage`, `emptySubMessage`, `onRowClick`, `sortBy/sortDir/onSort`, **`density: compact\|normal`**, **`variant: default\|cards`**, `stickyHeader` |

**Cuándo usar cada variant**:
- `variant="default"` — tablas densas (200+ filas, kardex, movimientos).
- `variant="cards"` — listas con pocas filas donde cada fila es una entidad importante (facturas, clientes, pagos). Lift on hover + border brand-primary on hover.

### Buttons

| Componente | API |
|---|---|
| `Button` | `variant: primary\|secondary\|ghost\|dark\|danger\|success\|warning\|info\|outline-*` + legacy `black\|white\|blue\|emerald\|red\|amber\|orange\|zinc`. `size: xs\|sm\|md\|lg`. `shape: pill\|square` (default `pill`). `icon`, `iconRight`, `loading`. |
| `ButtonSquare` | Botón cuadrado (siempre rounded-full). `variant`, `size`, `icon`, `title`, `animate`. |
| `ActionMenu` ✨ | `items: [{label, icon, onClick, tone: danger\|success\|info\|default, disabled}]`, `trigger`, `align: right\|left`. Para 3+ acciones por fila. |

### Otros

| Componente | Notas |
|---|---|
| `SearchFilterBar` | `search`, `onSearch`, `filters[]`, `values`, `onChange`, `statusOptions[]`, `statusKey`. Input pill con sombra sutil. |
| `AmountDisplay` | Muestra monto COP. Props: `value`, `color` (bool — colorea según signo). |
| `ItemGeneralSearch` | Autocomplete de item_general con comparación de precios. Usa portal. |

---

## 6. Utils (`src/utils/`)

| Archivo | Exports principales |
|---|---|
| `cn.js` | `cn(...args)` — clsx-like, acepta strings/arrays/objects/falsy. Default + named export. |
| `avatarTheme.js` | `ROL_STYLES`, `AVATAR_PALETTE`, `useAvatarKey()`, `useAvatarGradient(rol)`, `setStoredAvatarKey(key)` |
| `formatters.js` | `fmt(v)` (COP), `formatoPesoColombiano(v)`, `parsePesoColombiano(v)`, `formatLetterDate(date)`, `stableItemId(item)` |
| `services.js` | `getDateTheme(dateString)` — retorna `{ classes, punto, estado }` según vencimiento de fecha |

---

## 7. State management

### Zustand store (`src/store/useBoundStore.js`)

Compuesto por 3 slices:

- **`authSlice`** — `token`, `user`, `setAuth(token, user)`, `logout()`. Persist localStorage.
- **`useUISlice`** — `activeDrawer`, `drawerPayload`, `openDrawer(key, payload)`, `closeDrawer()`, `activeModal`, `openModal(key)`, `closeModal()`, `confirmModal`, `openConfirm({title, message, onConfirm, variant})`, `closeConfirm()`, `activeTitle`, `setActiveTitle()`.
- **`inventorySlice`** — `activeBodegaId`, `sedeName`, `setBodega(id)`, `clearBodega()`. Persist localStorage.

### Hooks custom

- `src/hooks/useTableSorts.js` — `const { sorted, sortBy, sortDir, handleSort } = useTableSort(data)`. Sort con `localeCompare('es', { numeric: true })`. Toggle automático on click mismo campo.

---

## 8. API layer

### `src/api/apiClient.js`

- Axios instance con `baseURL` de `VITE_API_BASE_URL`.
- Request interceptor inyecta `Authorization: Bearer <token>` desde `localStorage.token`.
- Response interceptor **extrae `response.data`** — los hooks reciben el payload directo. **Nunca hacer `res.data.data`**.
- 401 → limpia token + redirect a `/login`.
- Errores → toast automático via `react-hot-toast`.

### `src/api/apiRoutes.js`

Namespaces: `AUTH`, `EMPRESA`, `INSTALACIONES`, `BODEGAS`, `ITEMS`, `CARTERA`, `PAGOS`, `GESTIONES`, `NOTAS_CREDITO`, `TAMBORES`, `CATALOGO`, `UNIDADES`, `INVENTARIO`, `CAPAS`, `FORMULACIONES`, `FORMULACIONES_OPCIONES_INGREDIENTES`, `PROVEEDORES`, `CLIENTES`, `PREPARACIONES`, `ROLES`, `REQUISICIONES`.

Algunas rutas son funciones (parámetros dinámicos):
- `ITEMS.BUSCAR: (q, tipos) => '/item_general/buscar?...'`
- `CAPAS.POR_ITEM: (itemId) => '/inventario/{id}/capas'`

---

## 9. Patrones de código (NO inventar — son convenciones reales)

### Hook React Query típico

```js
// modules/X/api/useX.js
export const useTambores = (filters = {}) => {
  return useQuery({
    queryKey: tamborKeys.list(filters),
    queryFn: async () => {
      const res = await apiClient.get(`/tambores?...`);
      return res.data ?? res;  // apiClient ya retorna .data
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCrearTambores = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('/tambores', data),
    onSuccess: (res) => {
      toast.success('Creado');
      queryClient.invalidateQueries({ queryKey: tamborKeys.all });
    },
  });
};
```

### Abrir un drawer/modal de form

```jsx
const { openDrawer } = useBoundStore();

// Crear
<Button onClick={() => openDrawer('PAGO_FORM')} icon={Plus}>
  Registrar pago
</Button>

// Editar (con payload)
<button onClick={() => openDrawer('PAGO_FORM', pago)}>
  Editar
</button>
```

El `<PagoForm />` global (montado en la page) lee `activeDrawer === 'PAGO_FORM'` y se auto-monta con `key={payload?.id ?? 'new'}` para reset on change.

### Confirmar acción peligrosa

```jsx
const openConfirm = useBoundStore(s => s.openConfirm);

openConfirm({
  title: 'Eliminar factura',
  message: `¿Eliminar la factura ${factura.numero}?`,
  variant: 'danger',
  onConfirm: async () => await removeAsync(factura.id),
});
```

### Forma estándar de una página

```jsx
<div className="flex flex-col w-full gap-4">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <HeaderSection title="..." icon={Icon} breadcrumbs={[...]} />
    <Button variant="primary" icon={Plus} onClick={...}>Nueva X</Button>
  </div>

  {/* KPIs (opcional) */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <FlowCard icon={...} tone="info" label="..." value={...} />
    {/* ... */}
  </div>

  {/* Filtros */}
  <SearchFilterBar search={...} onSearch={...} filters={...} statusOptions={...} />

  {/* Tabs (opcional) */}
  <PageTabs tabs={...} value={tab} onChange={setTab} />

  {/* Tabla */}
  <ErpTable columns={cols} data={filtered} isLoading={...} variant="cards" />
</div>
```

### Migración legacy → tokens (mapping referencia)

```
bg-zinc-50      → bg-surface-subtle        text-zinc-400     → text-content-muted
bg-zinc-100     → bg-surface-muted         text-zinc-500     → text-content-tertiary
bg-zinc-200     → bg-surface-strong        text-zinc-600/700 → text-content-secondary
bg-zinc-900/950 → bg-content-primary       text-zinc-800/900 → text-content-primary
border-zinc-100 → border-border-subtle     border-zinc-200   → border-border-base
border-zinc-300 → border-border-strong

bg-emerald-50/100 → bg-semantic-success-subtle    text-emerald-500/600/700 → text-semantic-success / -fg
bg-red-50/100     → bg-semantic-danger-subtle     text-red-500/600/700     → text-semantic-danger / -fg
bg-amber-50/100   → bg-semantic-warning-subtle    text-amber-500/600/700   → text-semantic-warning / -fg
bg-blue-50/100    → bg-semantic-info-subtle       text-blue-500/600/700    → text-semantic-info / -fg
bg-violet/purple/pink → bg-brand-subtle           text-violet/purple/pink → text-brand-primary-active

rounded-md → cards/buttons rounded-xl o rounded-pill (más generoso en Pinca 2.0)
```

### Reglas establecidas

- **Status badges**: SIEMPRE `<StatusBadge>` — nunca `<span className="inline-flex rounded px-X py-X bg-X text-X">`.
- **Botones**: por default `rounded-pill`. Usar `shape="square"` solo en casos densos donde el pill no quepa.
- **Acción primaria única** por header. El resto `secondary` o `ghost`.
- **Acciones por fila**: ≤2 botones visibles, el resto en `ActionMenu` (`...`).
- **Tabs**: `underline` para navegación de página, `pill` para filtros internos compactos.
- **Empty states**: SIEMPRE con `<EmptyState>`.
- **Form sections**: agrupar campos con `<FormSection>`.

---

## 10. Build & deploy

### Vite config (`vite.config.js`)

```js
build: {
  sourcemap: false,
  minify: 'esbuild',
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router'],
        'vendor-ui':    ['lucide-react', 'recharts'],
      },
    },
  },
}
```

Build actual: ~9s, bundle main ~1.36 MB (gzip ~362 KB). Warning de chunk > 500KB — mejorable con dynamic imports si se vuelve crítico.

### Variables de entorno

- `VITE_API_BASE_URL` — URL base del backend.

---

## 11. Pendientes y áreas de mejora

### 🚧 Módulo nuevo planificado: "Sincronización"

Hay un plan completo de ejecución en `pinca_frontend/SYNC_MODULE_PLAN.md` para un módulo de auditoría/depuración de la relación `item_general` ↔ `item_proveedor`. Incluye:
- 7 fases de implementación (MVP en fases 1-4, ~3-4 horas)
- Specs detallados de 4-5 endpoints backend nuevos
- Mockups y estructura de archivos
- Apéndices para retomar desde cero

Si vas a continuar trabajando en el proyecto, ese plan es lo siguiente lógico a ejecutar.

### Decisión pendiente del usuario

- **`Costos/` y `CostosIndirectos/`**: páginas implementadas sin ruta ni link sidebar. Decidir: agregar ruta y exponerlos, o eliminar el código.

### Refinamientos opcionales

- **5 módulos sin enlace sidebar**: `Pagos`, `Tambores`, `Prorrateo`, `Roles`. Confirmar si es intencional o agregarlos.
- **Code splitting**: bundle > 500KB. Si crece, considerar dynamic imports para módulos pesados (Formulaciones, Produccion).
- **Test runner**: no hay tests configurados. Si se agregan, usar Vitest + testing-library.
- **Refresh token**: el cliente cierra sesión cuando 401 sin aviso. Sería mejor un modal de "sesión expirada" + intento de refresh.

### Componentes legacy que conviven con los nuevos

- `SummaryCard` (legacy) coexiste con `FlowCard` (nuevo). `FlowCard` es mejor para dashboards — pero migración no es urgente, `SummaryCard` ya está tokenizado.

---

## 12. Notas operacionales para Claude

### Reglas críticas

1. **NUNCA hardcodear colores Tailwind** (`zinc-X`, `blue-X`, etc.). Usar siempre tokens. Si encuentras alguno, migrar.
2. **NUNCA crear badges inline** (`<span className="inline-flex ... rounded ... bg-X text-X">`). Usar `<StatusBadge>`.
3. **NUNCA copiar `inputCls = "..."` localmente** en un componente. Importar `INPUT_BASE` de `Form/styles.js`.
4. **`@import url(...)` para fuentes va PRIMERO** en `index.css`, antes de `@import "tailwindcss"`. Crítico — si está después, no carga.
5. **Migrar a Pinca 2.0**: si tocas un componente legacy, aprovecha para migrarlo a tokens. El sistema espera consistencia visual total.
6. **Cuando crees una página nueva**, sigue la estructura estándar (HeaderSection + KPIs opcionales + Filtros + Tabla `variant="cards"`).

### Para retomar trabajo

1. `npm run dev` — verificar que arranca sin errores.
2. `npm run build` — verificar build limpio.
3. Revisar pantallas en el orden de migración: Login → Inventario → Cartera → Pagos. Estos son los pilots y deberían verse pulidos.
4. Si encuentras una pantalla que se ve "mal" (fuentes grandes, badges inconsistentes, colores raros), refresca:
   - ¿Está usando tokens (no zinc-X)?
   - ¿Las fuentes son apropiadas (text-lg para títulos, no text-xl)?
   - ¿Los badges usan `<StatusBadge>`?
   - ¿Los inputs usan `FormInput` / `INPUT_BASE`?

### Áreas más complejas / dolorosas

- **Formulaciones**: módulo más complejo (10+ archivos JSX, lógica de preparación, capas de stock).
- **Produccion**: cerca en complejidad. Modal de disponibilidad usa portales.
- **Cartera**: dashboard con múltiples drawers anidados, aging analysis.
- **Comercial**: 3 sub-módulos (Cotizaciones, Remisiones, Facturación) con sus propias APIs.
- **Proveedores**: tabla con comparador dual (lista normal ↔ comparación por producto).

### Patrón de "key reset" en forms

Algunos forms (FacturaForm, PagoForm, ModalRegistrarPago) usan el patrón:
```jsx
const Wrapper = () => {
  const payload = useBoundStore(s => s.drawerPayload);
  return <FormContent key={payload?.id ?? 'new'} editData={payload} />;
};
```
El `key` fuerza a React a destruir y recrear el form al cambiar el ID — evita useEffects de reset. **Mantener este patrón**.

---

## 13. Auditoría de archivos clave

```
src/
├── App.jsx                     ← Routes (20 rutas + 404)
├── Layout.jsx                  ← Wrapper con Sidebar+Topbar+Outlet, protege rutas
├── main.jsx                    ← Entry point, React Query provider
├── index.css                   ← ⭐ Design tokens — fuente de verdad visual
├── api/
│   ├── apiClient.js            ← Axios con interceptors
│   └── apiRoutes.js            ← Endpoints centralizados
├── config/
│   ├── modulos.js              ← MODULOS_SISTEMA + ROLES_LABELS
│   └── sidebarMenu.js          ← Items del sidebar
├── hooks/
│   └── useTableSorts.js        ← useTableSort()
├── store/
│   ├── useBoundStore.js        ← Zustand bound
│   └── slices/{auth,useUISlice,inventorySlice}.js
├── shared/                     ← 28 componentes shared (ver §5)
├── modules/                    ← 20 módulos (ver §3)
└── utils/                      ← cn, avatarTheme, formatters, services
```

---

## 14. Cambios recientes (historial corto)

- **2026-05-12** — Pinca 2.0 completo: 145 archivos JSX migrados, 2566 hardcodes → 0, Outfit activa globalmente.
- **2026-05-09** — Auditoría pre-producción (ver sección antigua del CLAUDE.md si existe — algunas cosas ya están corregidas).
- **2026-04-24** — Catálogo unificado, módulo de Capas/cost layers.
- **2026-04-21** — Proveedores rewrite, Tambores, modelo de unidades (KILO base).

Si necesitás detalle histórico granular, revisa el git log o pregúntale al usuario.

---

## 15. Sesión 2026-05-14 — Configuración del Sistema + PDFs (snapshot)

### Módulo nuevo: `Configuracion/` con 8 tabs

Ruta `/configuracion` (en sidebar como **Sistema → Configuración**, ícono `Settings`). `ConfiguracionPage.jsx` con `PageTabs`. Solo admin puede mutar; otros roles ven en lectura con banner amarillo.

| Tab | Componente | Backend |
|---|---|---|
| Empresa | `components/EmpresaTab.jsx` | `empresa` (extendida con direccion/email/celular/locale/moneda/logo_path) |
| Tributaria | `components/TributariaTab.jsx` | `configuracion_sistema` grupo `tributaria` (5 claves) |
| Financiero | `components/FinancieroTab.jsx` | grupos `financiero` + `comercial` + `notificaciones` |
| Umbrales | `components/UmbralesTab.jsx` | grupo `umbrales` (6 claves, con validación cruzada) |
| Numeración | `components/NumeracionTab.jsx` | tabla `numeracion_documentos` (no es K/V) |
| Catálogos | `components/CatalogosTab.jsx` | sub-tabs Categorías / Unidades / Tipos de movimiento (read-only) |
| Seguridad | `components/SeguridadTab.jsx` | grupo `seguridad` (JWT, intentos, password) |
| Auditoría | `components/AuditoriaTab.jsx` | endpoints `/auditoria/login-attempts` y `/auditoria/movimientos` (admin only) |

### Hooks nuevos

`Configuracion/api/`:
- `useConfiguracion.js` — `useConfiguracion()`, `useConfiguracionGrupo(g)`, `useConfigValue(clave, default)` (lectura desde cualquier componente), `useUpdateConfig`, `useBulkUpdateConfig`
- `useNumeracion.js` — `useNumeraciones`, `useUpdateNumeracion`, `useCreateNumeracion`
- `useCatalogosMaestros.js` — `useCategorias`, `useCategoriaCrud`, `useUnidades`, `useUnidadCrud`, `useTiposMovimiento`
- `useAuditoria.js` — `useLoginAttempts(filters)`, `useMovimientosAudit(filters)` (con `keepPreviousData`)
- `useEmpresa.js` — `useEmpresa()`, `useUpdateEmpresa()`, `useEmpresaFormatters()` (locale-aware), `useEmpresaLogoBase64()` (data URI), `useUploadLogo()`, `useDeleteLogo()`

### Utils nuevos

- `src/utils/empresaInfo.js` — `useEmpresaInfo()` devuelve shape compatible con exports legacy + `EMPRESA_FALLBACK` hardcoded; `useEmpresaLogoUrl()` con fallback al asset
- `src/utils/pdfHeader.js` — paleta `PINCA_COLORS` + `drawPdfHeader(doc, opts)` + `drawPdfFooter(doc, opts)`. Reusables para mantener consistencia visual entre PDFs (banda negra + acento amarillo)

### PDFs nuevos / rediseñados

| Documento | Archivo | Estado |
|---|---|---|
| Cotización | `Comercial/Cotizaciones/components/ExportCotizacion.jsx` | Rediseñado (carta A4 con paleta Pinca + ticket POS B/N) |
| Remisión | `Comercial/Remisiones/components/ExportRemision.jsx` | Rediseñado (idem) |
| Producción | `Produccion/components/ExportProduccion.jsx` | Solo refactor de logo/empresa |
| Inventario global | `InventarioGlobal/InventarioGlobalPage.jsx` | Refactor logo + locale |
| **Factura** | `Comercial/Facturacion/components/ExportFactura.jsx` | Nuevo (montado en `ComercialPage`) |
| **Orden de compra** | `Compras/components/ExportOrdenCompra.jsx` | Nuevo (montado en `ComprasPage`) |
| **Recibo de pago** | `Pagos/components/ExportRecibo.jsx` | Nuevo (montado en `PagosPage`) |
| **Nota crédito** | `Cartera/components/ExportNotaCredito.jsx` | Nuevo (montado en `CarteraPage`); marca de agua "ANULADA" si aplica |

**Patrón de invocación de PDF**: usar `openDrawer('EXPORT_MODAL_X', payload)` desde la tabla. El componente `ExportX` se monta a nivel de page y se autoabre cuando `activeDrawer === 'EXPORT_MODAL_X'`.

**Logo dinámico**: cada PDF llama `useEmpresaLogoBase64()` para obtener `data:image/png;base64,...`. Si no hay logo subido o falla el fetch, fallback al asset `pincaicono.png`. CRUD del logo en `EmpresaTab` con uploader (PNG/JPG/WEBP ≤2MB).

**Toggle Tiquete (Cotización + Remisión)**: el formato "ticket" usa estilo POS genérico (Courier monoespaciado, B/N, líneas dotted). El formato "carta" usa el branding Pinca (banda negra + acento amarillo).

### Toast limiter

`main.jsx` — componente `ToastLimiter` con `useToasterStore()` que mantiene máximo `TOAST_LIMIT = 1` toast visible. Los toasts más viejos se descartan automáticamente al aparecer uno nuevo. **No requiere tocar callsites** — todo `toast.success(...)` existente funciona igual.

### Defaults movidos a config (consumidos por hooks `useConfigValue` o backend `Cfg::n`)

| Clave | Default | Consumidores frontend |
|---|---|---|
| `iva_default` | 19 | `ItemProveedorForm`, `CotizacionForm`, `FacturaForm` |
| `aplicar_iva_por_default` | true | `CotizacionForm`, `FacturaForm` (toggle inicial) |
| `stock_critico_dias` / `stock_warning_dias` | 7 / 30 | `PanelPrincipalPage`, `InventarioGlobalPage` (`DiasRestantes`), `useInventarioGlobal` |
| `mora_critica_dias` / `mora_warning_dias` | 60 / 30 | `Cartera/DashboardCartera` (columna mora) |
| `margen_minimo_pct` / `margen_objetivo_pct` | 10 / 20 | `PanelPrincipalPage` (badge rentabilidad) |
| `dias_credito_default` | 30 | `ClienteForm` (default `plazo_pago`) |
| `page_size_default` | 25 | `CatalogoTable`, `ProveedoresTable`, varios |
| `avatar_palette` (json) | array de 8 gradientes | `useAvatarPalette()` en `avatarTheme.js` |

### Nuevas rutas en sidebar

- **Sedes y Bodegas** (`/sedes`) — agregada al grupo **Inventario** como primer item. Punto de entrada al flujo `Sedes → Bodegas → Inventario por bodega`.
- **Configuración** (`/configuracion`) — accesible desde el botón ⚙️ del footer del sidebar.

### Cleanup técnico relevante

- **Soft-delete en `item_proveedor`** — el delete del controller ahora marca `deleted_at` en vez de eliminar (preserva FK con `historial_precios` y `ordenes_compra_detalle`). Migración `2026-05-14-000001`.
- **Insumo tone neutral** — antes era `brand` (amarillo, igual que MP). Cambiado a `neutral` (gris contrastado). Afecta a Inventario, Catálogo, Sincronización, ItemGeneralSearch.
- **`StatusBadge` neutral subtle** — más contraste (`surface-strong + content-primary` en vez de `surface-muted + content-secondary`).
- **`StatusBadge` sm width** — subido de 70px a 115px para que `MATERIA PRIMA` no se trunque.
- **`fixedWidth` agregado** en columnas Tipo/Estado de Catálogo, Movimientos, Inventario, Cotizaciones, Facturación, Remisiones, OCs — para alineación uniforme.
- **VincularModal** (Proveedores) — z-index subido de `z-50` a `z-[110]` (estaba quedando bajo el drawer); sección "Ingresar al inventario" removida (mala práctica — stock solo entra por OC).
- **Dashboard "Actividad de hoy"** — cards verticales más altas con % del total, llena el espacio disponible al lado de "Salud de cartera".

### Backend bridge

- `useEmpresaLogoBase64()` llama `GET /api/empresa/logo-base64` (devuelve data URI), evita problema de CORS al hacer fetch directo a `/uploads/`.
- Mutaciones de configuración requieren `rol=admin` (validado backend, no solo UI).

---

## 16. Sesión 2026-05-15 — Cmd+K, Trazabilidad UI, AjusteModal, DateRangePicker

### Trazabilidad — UI completa

Nuevo módulo `src/modules/Trazabilidad/`:
- **`TrazabilidadPage`** — buscador autocomplete de lotes + listado de últimos lotes recibidos. Sidebar grupo Inventario.
- **`TrazabilidadDrawer`** — dos drawers (`TrazabilidadPorPreparacionDrawer`, `TrazabilidadPorLoteDrawer`) que muestran árbol de lotes/proveedores/OCs.
- **`ExportTrazabilidad`** — PDF de hoja de auditoría carta A4 con dos modos (por preparación / por lote), declaración + firmas. Reusa `pdfHeader.js`.
- Wireup: botón GitBranch en `ProduccionDetailModal` header, buscador "Rastrear lote" en `MovimientosFilters` (que ya existía), botón "Hoja PDF" en cada drawer.

### Cmd+K — búsqueda global tipo Linear

- **`shared/CommandPalette.jsx`** — modal centrado con keyboard nav (↑↓ Enter Esc), debounce 200ms, resultados agrupados por tipo + 16 atajos a páginas. `createPortal` a `body`, `z-[140]`.
- Listener global Cmd+K / Ctrl+K en `Layout.jsx`.
- **Topbar**: botón "Buscar… [Ctrl K]" en desktop, ícono lupa en móvil.
- Backend: `SearchController` unifica búsqueda en 8 entidades.
- **`useUrlSearch(paramName)`** — nuevo hook en `src/hooks/`. Las páginas destino lo usan para precargar el filtro desde `?q=` y limpiar la URL después. Aplicado en: `ClientePage`, `ProveedoresPage`, `CatalogoPage`, `ComercialPage` (lee `?tab=` también).

### AjusteModal — descuento manual de stock

- **`Inventario/Components/AjusteModal.jsx`** — motivo obligatorio (rotura/derrame/conteo/vencimiento/otro), preview de pérdida estimada en COP, validación de stock disponible. Backend: `POST /inventario/ajuste-manual`.
- Wireado en `InventarioPage` (acción Wrench por fila) e `InventarioGlobalPage` (chip warning en cada bodega expandida).

### DateRangePicker bonito

- **`shared/DateRangePicker.jsx`** — usa `react-day-picker` + `date-fns` con locale `es`. Popover con 2 meses lado a lado, today con anillo amarillo, range edges en `bg-content-primary` con texto blanco, range middle en `bg-brand-subtle`.
- Botón con dos chips bonitos: `[1 May 2026] → [15 May 2026]` (formato corto, mes capitalizado).
- Exporta `fmtFechaChip` para usar en filtros que muestran fechas sin picker.
- Aplicado en: `Costos/CostosFilters`, `Rentabilidad/RentabilidadFilters`, `Movimientos/MovimientosFilters`, `Produccion/ProduccionFilters`.

### Costos consolidado

- Eliminado el módulo standalone `CostosIndirectos/` (2 archivos). Ruta + sidebar removidos.
- El tab "Indirectos" dentro de `/costos` ahora es **read-only de análisis** (CRUD vive inline en cada Producción).
- Sidebar nuevo grupo "Análisis" expone `/costos`.

### Clientes — ViewToggle tabla/cards

- Nuevo `ClientesTable.jsx` análogo a `ProveedoresTable`. Default vista tabla con buscador integrado + paginación + acciones por fila.
- `ClientePage.jsx` con `ViewToggle` igual que Proveedores.

### Soft-deletes consistentes (backend, impacto frontend)

Antes los modelos comerciales (OCs, Cotizaciones, Remisiones, Facturas, Clientes, Proveedores) NO usaban `useSoftDeletes` y las queries raw no filtraban `deleted_at` → los registros borrados aparecían igual en el frontend. Esta sesión: activado `useSoftDeletes` + ajustadas todas las queries raw. Resultado: si borrás algo desde el frontend, ahora SÍ desaparece de las listas.

### Notificaciones automáticas

`NotificacionesController::generarAutomaticas()` (backend) genera notifs de stock crítico, OCs retrasadas y facturas en mora. El bell-icon del Topbar ya estaba implementado, ahora la tabla `notificaciones` se llena automáticamente.

### Filtro por responsable en Movimientos

`MovimientosFilters` agrega `<FormSelect>` "Responsable" pre-poblado desde `useUsuariosRoles`. Backend acepta `?responsable=username`.

### Clonar fórmula

- `ClonarFormulacionModal.jsx` — buscador de producto destino + nombre custom. Botón Copy en header de `FormulacionesTable`.
- Hook `clonarFormulacionAsync` en `useFormulaciones`. Endpoint `POST /formulaciones/clonar`.
- Al clonar, navega automáticamente al producto destino.

### Alertas proactivas en Dashboard

- `PanelPrincipalPage` muestra widget cuando hay MP críticas (`mp_criticas.top` del backend).
- Cards individuales con días restantes en chip color (rojo ≤2, amarillo ≤5, info <umbral).
- Card con borde warning + gradient sutil para destacar como acción requerida sin gritar.

### Costo real vs teórico en Producción

- `ProduccionDetailModal` muestra nueva sección "Costo de producción" cuando estado = COMPLETADA.
- Desglose por ingrediente: cantidad real consumida, costo congelado (real), costo teórico actual, variación % por ingrediente y total. Datos derivados del `consumo_capas` que ya devolvía el backend.

### UX polish del flujo crítico

- "capas" → "lotes"/"ingresos" en toda la UI visible (TrazabilidadPage, drawers, ExportTrazabilidad, CapasStockPanel) — el vocabulario contable se cambió por uno operacional.
- `VincularModal` — tooltip rich con ejemplo "1 BULTO = 25 kg → Factor 25" + banner info de conversión.
- `RecibirLineaModal` rediseñado: banner "10 BULTOS × 25 = 250 kg base" + costo/kg derivado + input de `lote_proveedor` (recomendado).
- `ItemProveedorForm` — botón "Guardar y crear otro" mantiene proveedor seleccionado.
- `InventarioGlobalPage` — fila expandida con `bg-surface-muted` + acento lateral amarillo (en lugar de invadir todo con `bg-brand-subtle`).

### Fix de stacking context — overlays

- `Drawer`, `DetailDrawer`, `ConfirmModal` ahora usan `createPortal(document.body)` — los modales abiertos desde dentro de drawers ya no quedan atrapados.
- `ConfirmModal` subido a `z-[200]` (era `z-[110]`) para garantizar tope absoluto.

### Dependencias nuevas

- `react-day-picker@^10` + `date-fns@^4` (para DateRangePicker)

---

## 17. Sesión 2026-05-18 — Auto-selección proveedor más barato en Formulaciones

### Problema resuelto

Antes, la tabla de formulaciones mostraba el costo estándar (`costos_item.costo_unitario`, promedio ponderado de capas) para cada ingrediente. El usuario tenía que seleccionar manualmente un proveedor por ingrediente para ver el costo real de compra. Además, al seleccionar proveedores, el footer mostraba **dos totales separados**: "Total Costo MP" (estándar) y "Selección" (con proveedores) — confuso e inútil.

### Cambios realizados

#### `FormulacionesPage.jsx`

- Importa `useEffect` de React.
- **Auto-selección de proveedor más barato** (nuevo `useEffect`, líneas 44-58): cuando `opcionesIngredientes` cambia (se selecciona un producto), itera `opcionesIngredientes.materias` y popula `seleccionPorIngrediente` con `opciones[0].id_item_proveedor` (el más barato — ya viene ordenado por `precio_por_kg ASC` del backend `get_opciones_proveedor_formulacion`).
- El reset a `{}` al cambiar de producto (en `onProductSelect` y `onClearSelection`) sigue funcionando — el `useEffect` re-pobla cuando llegan las nuevas opciones.
- El dropdown `IngredienteProveedorSelect` por fila sigue disponible para override manual.

#### `FormulacionesTable.jsx`

- **Total unificado**: se eliminaron las variables `hasAnyOverride` y `totalCostoOverride`. Reemplazadas por un único `useMemo` que devuelve `{ totalUnificado, sinProveedor }`:
  - `totalUnificado`: suma costo de proveedor (donde hay selección) + costo estándar (donde no hay). Es **EL** total real.
  - `sinProveedor`: conteo de ingredientes sin proveedor seleccionado.
- **Footer simplificado**: un solo "Total Costo MP" con `totalUnificado`. Si hay ingredientes sin proveedor, muestra alerta `"X sin proveedor"` con ícono `AlertTriangle` amarillo.
- **Alerta por fila**: ingredientes sin proveedor muestran:
  - Ícono circular cambia de `Beaker` (azul) a `AlertTriangle` (amarillo) con borde warning.
  - Badge rojo `"Sin proveedor"` donde iría el dropdown, para visibilidad inmediata de qué ingredientes necesitan vinculación.
- Importa `AlertTriangle` de lucide-react.

### Flujo de costos en Formulaciones (estado actual)

```
Seleccionar producto
  → useFormulaciones fetches GET /formulaciones/{id}/opciones-ingredientes
  → opcionesIngredientes.materias = { [mpId]: { opciones: [...sorted by precio_por_kg ASC] } }
  → useEffect auto-popula seleccionPorIngrediente = { [mpId]: cheapest id_item_proveedor }
  → FormulacionesTable:
      - getCostoOverride(f) usa precio_por_kg del proveedor seleccionado
      - Si no hay proveedor → usa costo estándar de costos_item + muestra alerta
      - totalUnificado = Σ(override donde hay proveedor) + Σ(estándar donde no hay)
  → Usuario puede cambiar proveedor manualmente por ingrediente via dropdown
```

### Defecto conocido en backend (NO corregido aún)

`FormulacionesModel::crearFormulacion()` (líneas 996-1001) y `actualizarFormulacion()` (líneas 1070-1075) sobrescriben `costos_item.costo_unitario` si el payload incluye `costo_unitario` por ingrediente. Este campo debería ser de solo lectura (calculado por `recalcularPromedioPonderado`). El frontend actualmente NO envía `costo_unitario` en el payload de formulaciones, así que no causa problema, pero el backend debería protegerlo. Ver `pinca_backend/MEJORAS.md` para detalles.

**Resuelto 2026-05-19** — backend ya eliminó esos bloques. Ver §18.

---

## 18. Sesión 2026-05-19 — IVA toggle, FormDate, unify módulos, polish

Sesión grande. **Módulo Costos eliminado**, **toggle IVA global**, **`FormDate` reemplaza inputs nativos en 11 archivos**, **sidebar singleton sin flyout**, **Salud de cartera rediseñada**, **KPI cards adaptativas**.

### Módulo Costos absorbido por Rentabilidad

Costos era subset puro de Rentabilidad (mismos tabs: Producción, Compras, Indirectos). Rentabilidad añade Resumen + Ganancias. Decisión: conservar Rentabilidad como módulo único.

**Cambios**:
- Carpeta `src/modules/Costos/` **borrada completa** (8 archivos: page + 6 components + 3 hooks api).
- `App.jsx`: removido import de `CostosPage`, ruta `/costos` ahora hace `<Navigate to="/rentabilidad" replace />` (preserva bookmarks).
- `sidebarMenu.js`: removida entrada "Costos" y el ícono `Coins` huérfano.
- `modulos.js`: removida key `costos` del array `MODULOS_SISTEMA`.
- Backend: migración `MergeCostosIntoRentabilidad` mueve permisos `costos → rentabilidad` (admin + visor sin pérdida de acceso).

### Toggle IVA global (Con IVA / Sin IVA)

Nuevo componente y hook compartidos en **`src/shared/IvaToggle.jsx`**:
- `IvaToggle` — pill de dos segmentos (Receipt / FileText icons) con estilo Pinca.
- `useIvaToggle()` — hook que persiste preferencia en `localStorage` key `pinca:showIva` (default `true`).

**Aplicado en**:
- `Costos/CostosPage` (ahora redirigido a Rentabilidad — usa toggle también si se renderiza directo)
- `Rentabilidad/RentabilidadPage` — header al lado del botón "Exportar Excel"
- Cards de KPIs respetan el toggle: cuando `showIva=true`, suman `totalComprasConIva` para Compras; cuando `false`, suman `totalCompras`. La otra versión aparece como sub-texto: "Con IVA · base $X" / "Base imponible · con IVA $X".
- Cálculo de `totalCostos` y `utilidadBruta` en Rentabilidad usa la versión seleccionada (coherente con `facturas.total` que ya viene con IVA).

**Backend lo soporta**: `useCostosCompras.js` (en ambos módulos — duplicado intencional) ahora devuelve `totalCompras` + `totalComprasConIva` leyendo `total_con_iva` que el backend agrega a cada OC.

### `FormDate` — selector de fecha único (reemplaza `<input type="date">`)

Archivo nuevo: **`src/shared/Form/FormDate.jsx`**. Análogo al `DateRangePicker` existente pero para una sola fecha.

**API**:
```jsx
<FormDate
  label="Fecha"
  value={form.fecha}              // ISO 'yyyy-MM-dd' o null
  onChange={(iso) => set(iso)}    // recibe ISO
  required
  error={errors.fecha}
  minDate={form.otraFecha}
  maxDate="2026-12-31"
  placeholder="Seleccionar fecha"
/>
```

**Con react-hook-form** (`Controller` explícito):
```jsx
<Controller
  name="fecha"
  control={control}
  rules={{ required: 'Requerido' }}
  render={({ field, fieldState }) => (
    <FormDate label="Fecha" required
      value={field.value} onChange={field.onChange}
      error={fieldState.error?.message} />
  )}
/>
```

**Implementación**:
- `DayPicker` (`react-day-picker` v10) con `mode="single"`, `locale: es`, `weekStartsOn: 1`.
- Popover renderizado vía `createPortal(document.body)` con `z-[130]` — no queda atrapado en `overflow:hidden` de drawers/modales.
- **`popoverRef` además del `wrapperRef`** en el listener de click-outside: chequea ambos contenedores antes de cerrar, porque el portal saca al popover del tree del wrapper.
- **`captionLayout="dropdown"`** con `startMonth` (3 años atrás) y `endMonth` (2 adelante) — 6 años seleccionables vía dropdown de año + dropdown de mes (no chevron por chevron).
- Styling Pinca: caret SVG inline, padding 1px vertical (`line-height: 1.4`) para dropdowns compactos.
- Botón "Hoy" + "Listo" en el footer del popover.

**Aplicado en 11 archivos** (16 inputs `type="date"` → 0):
- `Compras/components/OrdenForm.jsx` (RHF + Controller, 2 inputs)
- `Pagos/components/PagoForm.jsx`
- `Cartera/components/GestionesCobroDrawer.jsx`
- `Cartera/components/ModalRegistrarPago.jsx`
- `Cartera/components/NotasCreditoDrawer.jsx`
- `Comercial/Cotizaciones/components/CotizacionForm.jsx` (2)
- `Comercial/Facturacion/components/FacturaForm.jsx` (2)
- `Comercial/Remisiones/components/RemisionForm.jsx`
- `Configuracion/components/NumeracionTab.jsx` (2)
- `Formulaciones/components/preparationModal.jsx` (2, dentro de MetaForm)
- `Tambores/components/TamborForm.jsx` (RHF + Controller)

**`DateRangePicker.jsx`** también ganó los mismos dropdowns de mes/año por coherencia.

### Sidebar — grupos singleton como item directo

Cuando un grupo del sidebar tiene **un solo item**, se renderiza como item directo en lugar de un icono de grupo con flyout/header.

**Modo plegado** (default): la regla en el render es:
```jsx
{!group.grupo || group.items.length === 1
  ? group.items.map(renderCollapsedSingle)
  : renderCollapsedGroup(group)}
```

**Modo expandido** (pinned): `showHeader = !!group.grupo && group.items.length > 1` → no aparece el header colapsable de la sección si hay solo 1 item.

Esto se generaliza: si en el futuro hay más items en "Análisis" (ej: Proyecciones, Presupuesto), automáticamente vuelve a comportarse como grupo con header + flyout. Cero mantenimiento.

### Salud de cartera rediseñada

Antes: card chica con `ProgressPill` (Corriente) + 3 líneas de aging + factura más vieja → quedaba mucho espacio vacío al fondo (la card vecina "Actividad de hoy" era más alta y el grid stretching dejaba un hueco).

Ahora (`PanelPrincipalPage.jsx:346-410` aprox):
- **Hero arriba**: total de cartera grande + label de estado en lenguaje natural (`Cartera saludable` / `Atención: mora creciente` / `Riesgo: alta concentración vencida`) según `carteraCorrientePct`.
- **4 buckets con barras horizontales proporcionales**: Corriente (verde) / 1–30 (azul/neutral) / 31–60 (amarillo) / +60 (rojo). Cada barra es `pct%` del total. Label + monto + porcentaje en una sola línea, barra de 1.5px abajo.
- **Footer sticky** (vía `flex-col` + `mt-auto`): "Factura más vieja FAC-XXX Yd" en una línea compacta.
- `Card` con `h-full flex flex-col` + buckets envueltos en `flex-1` → distribuye el espacio uniformemente, sin huecos.

Eliminado el import huérfano de `ProgressPill` que ya no se usaba en el archivo.

### KPI cards (Costos + Rentabilidad) — sin truncado

Bug reportado: valores grandes mostraban `$ 13.808....` con ellipsis. Causa: layout horizontal (`flex items-center justify-between`) con icono de 40×40 al costado + `truncate` en el valor. Con 7 cards en `lg:grid-cols-7` no había espacio.

**Nuevo `KpiCard`** (mismo patrón en `CostosKpis.jsx` y `RentabilidadKpis.jsx`):

```jsx
<div className="bg-white border ... rounded-xl shadow-sm px-3 py-3 overflow-hidden">
  <div className="flex items-start justify-between gap-2 mb-1.5">
    <p className="text-[11px] font-medium text-content-tertiary ... truncate ...">{label}</p>
    <div className="w-8 h-8 ... rounded-full ...">{icon de 16px}</div>
  </div>
  <p className={`${valueFontClass(value)} font-bold tabular-nums whitespace-nowrap`} title={value}>
    {value}
  </p>
  {sub && <p className="text-[10px] truncate" title={sub}>{sub}</p>}
</div>
```

**`valueFontClass`** mapea largo del valor → clase de tipografía:
- ≤ 10 chars (`$1.500.000`): `text-xl` (Costos) / `text-lg` (Rentabilidad)
- 11–12: `text-lg` / `text-base`
- 13–14: `text-base` / `text-sm`
- ≥ 15: `text-sm` / `text-xs`

`tabular-nums` activado para alineación numérica. `title` en value y sub → tooltip nativo con el valor completo.

**Grid responsive más razonable** en Rentabilidad: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7`. En `lg` (1024–1280) los 7 cards van en 2 filas (4 + 3), evitando que se compriman. Solo en `xl` aplica 7 columnas.

Skeleton de loading subido a `h-24` (antes `h-20`) para coincidir con la altura del nuevo layout vertical.

### Componentes shared nuevos en esta sesión

| Componente | Path | Resumen |
|---|---|---|
| `IvaToggle` + `useIvaToggle` | `src/shared/IvaToggle.jsx` | Pill segmentado Con IVA / Sin IVA + hook con persistencia localStorage |
| `FormDate` | `src/shared/Form/FormDate.jsx` | Selector de fecha único con DayPicker. Reemplazo del `<input type="date">` nativo |

### Patrones nuevos consolidados

1. **Cualquier input de fecha**: usar `FormDate` con `value` + `onChange(iso)`. Si estás en RHF, envolver en `<Controller>`. Nunca más `<input type="date">` o `<FormInput type="date">`.

2. **Dashboard / módulo con KPIs de costos vs ventas**: leer el toggle global con `useIvaToggle()` y pasarlo como prop `showIva` a las KPI cards. Las cards muestran un valor + su contraparte en sub-texto.

3. **Sidebar items**: usar la propiedad `grupo` libremente. Si terminás con un grupo de 1 item, el sidebar se autoadapta y lo renderiza como item directo.

4. **Card que vive en grid con cards más altas**: usar `h-full flex flex-col` + `flex-1` en el contenido principal + `mt-auto` en footers para distribuir altura sin huecos.

5. **Valores monetarios en KPIs**: nunca `truncate` en el value. Usar `valueFontClass(value)` para adaptar tipo + `whitespace-nowrap` + `tabular-nums` + `title={value}` para tooltip.

### Pendientes y refinamientos opcionales

- **Tablas detalladas de OCs** (`CostosComprasTable`, `RentabilidadComprasTable`, `OrdenesTab`, `HistorialTab`): siguen calculando "Total + IVA" client-side multiplicando por `ivaPct` que viene de `useConfigValue`. Funciona pero podrían leer `total_con_iva` del backend directamente (más consistente). Bajo impacto — funciona.
- **`useCostosCompras.js` duplicado** en `Costos/api/` (que ya no existe) y `Rentabilidad/api/`. Tras el merge solo queda el de Rentabilidad. Si se reintroduce Costos como módulo independiente, no replicar — extraer a `shared/api/`.

### Backend coupling (saber para no romper)

El frontend depende de que el backend entregue en `GET /api/ordenes_compra` y `GET /api/ordenes_compra/:id/detalle`:
- `total` (sin IVA, siempre)
- `iva_pct` (% aplicado a la OC al crearla)
- `iva_monto` (calculado: `total * iva_pct/100`)
- `total_con_iva` (calculado: `total + iva_monto`)

Si el backend rompe ese contrato, los hooks `useCostosCompras` muestran 0 en la versión "con IVA". Las KPIs degradan a la versión sin IVA gracias al `|| 0`.

---

> **Snapshot al cierre 2026-05-19**: Frontend con módulos unificados, IVA presente en todos los KPIs con toggle, selector de fechas Pinca en todos los formularios, sidebar adaptativo. Build limpio. Listo para seguir construyendo encima.

---

## 19. Sesión 2026-05-20 — Costos de Producción, Salud, Superadmin, TableShell

### Módulo nuevo: Costos de Producción

Ruta `/costos-produccion`, sidebar grupo **Análisis** (junto a Rentabilidad), ícono `Calculator`.

`src/modules/CostosProduccion/`:
- `CostosProduccionPage.jsx` — header + tabla
- `components/CostosProduccionTable.jsx` — tabla densa con columnas: Producto, Estado, Rinde, MPs (cubiertas/total), **Stock para** (tandas + gal), Costo MP, %Util, Precio sugerido. Sortable. Tone-shift color en columna "Stock para" (verde ≥3, amarillo ≥1, rojo 0).
- `components/CostoDetalleDrawer.jsx` — drawer con secciones: hero, descomposición, margen real (si aplica), barra apilada de composición %, **stock para producir (cuello de botella)**, lote completo, ingredientes, MPs sin proveedor, proveedores en costeo, **evolución del costo** (chart), desglose empaque + MO
- `components/EvolucionCostoChart.jsx` — Recharts LineChart con `costo_total` (negro) y `precio_venta_calc` (verde punteado). Tooltip custom + variación entre primer/último snapshot. Empty states para 0 o 1 snapshot ("Necesitamos al menos 2 fechas distintas").
- `api/useCostosProduccion.js` — hooks `useCostosProduccion()` y `useCostoHistoria(id)` (hasta 36 snapshots).

### Módulo nuevo: Salud del Sistema (embebido en UserPanel)

Nació como página standalone `/salud-sistema` pero **se movió como tab del UserPanel** porque el dashboard cabe mejor en el panel lateral del super-admin. La ruta y el sidebar item se eliminaron — solo accesible para `admin`+`superadmin` desde el UserPanel.

`src/modules/SaludSistema/`:
- `SaludSistemaPage.jsx` — componente único con dos modos: `embedded` (drawer del UserPanel, layout lista vertical) y standalone (página completa, sin uso actual pero conservado).
- En modo embedded usa `ScoreDial` (SVG circular progress 16×16), `ProgressRow` (barra horizontal fina con label arriba + % + acción inline), y `IssueList` (sección con título + count badge + link "Ir a..." + lista plana de items). Layout vertical separado por `divide-y` — sin cards anidadas.
- `api/useSaludSistema.js` — `useSaludSistema()` hook.

**Iteración de diseño**: la primera versión metía las 5 cards del dashboard standalone dentro del drawer → feedback del usuario "se ve forzado". El rediseño cambia a layout "lista de progreso" con dividers, mucho más natural para un panel lateral angosto.

### Rol `superadmin` + ForceChangePasswordModal

Nuevo rol `superadmin` por encima de admin. Es el único que ve la gestión de roles. Backend hace el check (admin recibe 403 si intenta mutar permisos).

**Cambios**:
- `config/modulos.js`: `ROLES_LABELS.superadmin = 'Super Administrador'`. Removida la entrada `roles` de `MODULOS_SISTEMA` (ya no es un módulo del sidebar).
- `config/sidebarMenu.js`: removida la entrada `roles` (y la de `salud-sistema`).
- `App.jsx`: removidas rutas `/roles` y `/salud-sistema`. La gestión vive en el UserPanel.
- `UserPanel.jsx`:
  - Renombró `isAdmin` → `isSuperadmin` + `isAdminAccess` (admin O superadmin)
  - Tabs **Empresa** y **Salud** visibles para `isAdminAccess`
  - Tab **Roles** visible solo para `isSuperadmin`
  - Tab **Salud** renderiza `<SaludSistemaPage embedded onNavigate={closeDrawer} />` para cerrar el drawer al navegar a otro módulo

**Iniciales basadas en nombre + apellido** (`Topbar.jsx` + `UserPanel.jsx`):
```js
// Antes: getInitials(u) = u.slice(0,2).toUpperCase()  → "JU" para "Juan Pérez"
// Ahora: toma primera letra de los 2 primeros tokens   → "JP" para "Juan Pérez"
```
Casos: `Juan Pérez`→JP, `María Fernanda Rodríguez`→MF, `Juan`→J, vacío + username `jperez`→JP.

**`ForceChangePasswordModal`** (`src/shared/ForceChangePasswordModal.jsx`):
- Overlay bloqueante `z-[200]` con `createPortal(document.body)`.
- Se monta en `Layout.jsx` a nivel raíz.
- Se muestra si `user?.password_must_change === 1`.
- Validaciones: mín 8 caracteres, nueva ≠ actual, confirmación coincide.
- Único exit: cambiar contraseña o **Cerrar Sesión**.
- Llama `apiClient.patch(API_ROUTES.AUTH.CAMBIAR_PASSWORD, ...)` (importante: PATCH no PUT — la ruta backend es `PATCH /usuarios/mi-password`).
- Al éxito: `setAuth(token, { ...user, password_must_change: 0 })` para limpiar el flag en el store sin re-login.

### TableShell — patrón de tabla unificada

`src/shared/TableShell.jsx` (nuevo) — wrapper que provee header con búsqueda + filtros + tabs internos + footer con paginación, todo dentro de un único contenedor blanco con border. Resuelve el feedback del usuario: "no quiero que el buscador y la paginación parezcan fuera de la tabla".

**API**:
```jsx
<TableShell
  search={search}
  onSearch={setSearch}
  searchPlaceholder="Buscar…"
  filters={[<FormSelect ...>]}              // filtros React renderizables
  tabs={tabs}                                // [{key, label, count}]
  activeTab={tab}
  onTabChange={setTab}
  page={page}
  totalPages={total}
  onPageChange={setPage}
>
  <ErpTable borderless ... />
</TableShell>
```

**`ErpTable` ganó prop `borderless`** — cuando va dentro de TableShell no debe duplicar el border externo.

**Hook compañero `useClientPagination`** — paginación client-side con `{ items, page, totalPages, setPage, pageSize }`.

**Aplicado en** (siempre con `variant="default"` — el formato cards-style queda fuera de moda):
- `Sincronizacion/MaestroTab` + `HuerfanosTab`
- `Comercial/Cotizaciones/CotizacionesTab` + `Facturacion/FacturacionTab` + `Remisiones/RemisionesTab`
- `Compras/OrdenesTab` + `HistorialTab`
- `Cartera/FacturasTable` + `DashboardCartera`

### Scripts backup en `pinca_backend/backups/`

Lado backend pero relevante saber desde el frontend: existe `backup-auto.sh` + `backup-auto.bat` que generan dumps SQL del esquema completo + datos. **No requiere acceso desde la UI** — corre desde Task Scheduler / terminal.

### Patrones nuevos consolidados

1. **Tablas con búsqueda + filtros + paginación**: SIEMPRE `<TableShell>`. No volver a meter `<SearchFilterBar>` arriba de un `<ErpTable>` suelto.
2. **Acceso administrativo en tabs del UserPanel**:
   - admin + superadmin → tabs Empresa, Salud
   - solo superadmin → tab Roles
   - Si vas a agregar una tab admin-only nueva, usar `isAdminAccess`. Si requiere gestión de permisos, usar `isSuperadmin`.
3. **Modal forzado al login**: el patrón `ForceChangePasswordModal` (overlay `z-[200]` + portal + único exit por logout) sirve como template si en el futuro hay que forzar TOS, captcha, etc.
4. **Dashboards en panel lateral**: cuando un dashboard pase de standalone a embedded, NO uses el grid de cards. Usa layout vertical con `divide-y` + ScoreDial + ProgressRow + IssueList. El usuario rechazó el primer intento de "cards apretadas" — el formato lista funciona mejor en drawers.

### Backend coupling (saber para no romper)

- `POST /login` ahora devuelve `usuario.password_must_change` (entero 0|1). Si el backend lo omite, el modal forzado nunca aparece — chequear ese campo en el response.
- `PATCH /usuarios/mi-password` limpia `password_must_change` al éxito. Si se cambia a otro verbo o ruta, actualizar `ForceChangePasswordModal`.
- `GET /salud-sistema` devuelve shape estable (ver `pinca_backend/CLAUDE.md` § 2026-05-20). Si cambia, ajustar `SaludSistemaPage`.
- `GET /costos-produccion` debe traer `stock_para_producir: {tandas_posibles, galones_posibles, cuello_botella}` por producto. La tabla y el drawer dependen de eso.

### Pendientes opcionales

- **Snapshot mensual de costos** se ejecuta manualmente con `php spark snapshot:costos`. Idealmente correr 1×/mes desde cron para que el gráfico de evolución se llene solo. Por ahora hay 1 snapshot — el gráfico mostrará "Necesitamos al menos 2 fechas distintas" hasta el próximo run.
- Cobertura real de proveedores está en 14.6% (51 productos con fórmula activa, mayoría marcados "incompleto"). Cliente tiene Excel `mps-sin-vincular-2026-05-20.xlsx` para llenar. Una vez vinculados, el módulo Costos de Producción mostrará costos completos en lugar de banners de "Materias primas sin proveedor".

---

> **Snapshot al cierre 2026-05-20**: Frontend con módulo Costos de Producción funcional (con gráfico Recharts de evolución de costos), Salud del Sistema embebida como tab del UserPanel solo visible para admin/superadmin, rol superadmin para gestión exclusiva de permisos, modal forzado de cambio de password al primer login, iniciales basadas en nombre + apellido, y patrón `TableShell` aplicado a 9 tablas (búsqueda + filtros + paginación embebidos). Build limpio. UserPanel ahora tiene 6 tabs: Mi Cuenta, Seguridad, Ajustes, Empresa (admin+), Salud (admin+), Roles (solo superadmin).

---

## 20. Sesión 2026-05-21 — Hardening profundo + Prorrateo OC + Refactors UX

Sesión muy grande. Auditoría profunda con 5 agentes, plan en 3 fases ejecutado completo, prorrateo integrado al flujo de OC, toggle costo real vs lista en formulaciones, eliminación de módulos huérfanos. Ver §"Pendientes" al final del archivo `PENDIENTES.md` en la raíz del backend para el backlog.

### Resumen ejecutivo

| Bloque | Items |
|---|---|
| **Fase 1 (datos críticos)** | recalcularSaldo en anulación, revertir pagos/NC, validar FK cliente, cambiarEstado con FOR UPDATE, race condition consumo capas, renombrar 3 archivos con typo |
| **Fase 2 (UX + autz)** | DELETEs con guard admin, validateJson en Formulaciones e ItemProveedor, setActiveTitle centralizado en Layout, 401 sin flash (Opción B), filtros URL en Tambores, cambio de rol invalida JWT (token_version) |
| **Fase 3 (consistencia)** | apiClient sin setTimeout, paginación capped vía Cfg, confirm al borrar línea inline, Modal/Drawer respetan `isDirty`, useFieldErrors para mapear errores backend a campos, ApiResponse trait (pilot), useFormValidation hook (validación blur) |
| **Refactors UX** | Tambores eliminado completo, Roles polish con superadmin column, password_must_change fix (allowedFields), GlobalTopProgressBar centralizado, toggle Costo real vs Lista en Formulaciones |
| **Prorrateo OC** | Backend recibirLoteProrrateado con FOR UPDATE y atomicidad, modal RecibirProrrateoModal en OrdenDrawer, auto-generar código de lote LOT-OC{id}-{Ymd}, endpoint /lote-sugerido para pre-llenar input, formato peso COP en input precio |

### 20.1 Auth y sesión — endpoint `/auth/me` + token_version

- Nuevo hook en `Layout.jsx`: `useQuery(['auth-me'])` que llama `GET /auth/me` antes de renderizar el `<Outlet />`. Si el backend rechaza el token (401), `logout()` + `<Navigate to="/login">`. Mientras pendiente, muestra `<FullPageLoader>`. **Esto resuelve el flash del panel** cuando hay token expirado en localStorage.
- `apiClient.js` ya no hace `window.location.href = '/login'` en 401. Ahora hace `useBoundStore.getState().logout()` (import dinámico para evitar dep circular) → Layout redirige vía React Router sin hard reload.
- `setAuth` se llama con los datos frescos de `meData.usuario` cada vez que llega la respuesta → si un admin cambia tu rol mientras estás logueado, el cambio se refleja en la próxima request (combinado con `token_version` del backend).
- `setActiveTitle` centralizado: mapa `TITULO_POR_RUTA` en `Layout.jsx`. Páginas individuales pueden sobreescribir si quieren título más específico.
- `ForceChangePasswordModal` y `UserPanel.cambiarPwd`: usan el `res.token` que devuelve el endpoint de cambio de password para mantener viva la sesión tras el bump de `token_version`.

### 20.2 Forms — errores backend + validación blur + dirty guard

**Hook nuevo `src/hooks/useFieldErrors.js`** — mini-store de errores por campo. Lee `err.response.data.errors` del backend (formato ValidatesJson 422) y los mapea a `<FormInput error={...} />`. Aplicado en FacturaForm como pilot (campo `cliente_id`).

**Hook nuevo `src/hooks/useFormValidation.js`** — validación frontend con touched por campo. API:
```js
const v = useFormValidation({ cliente_id: { required: 'msg' } });
<FormInput onBlur={() => v.blur('cliente_id', form.cliente_id)} error={v.fieldError('cliente_id')} />
if (!v.validateAll(form)) return;
```
Solo muestra error si el campo fue touched o se llamó validateAll. Aplicado completo en FacturaForm; aplicación parcial (onBlur al input cliente libre) en CotizacionForm y RemisionForm.

**`<Drawer>` y `<Modal>` shared** ahora aceptan props `isDirty` y `dirtyMessage`. Si `isDirty=true`, X / ESC / backdrop pasan por `openConfirm({variant: 'warning'})`. FacturaForm usa esta nueva API; los 3 forms comerciales con drawer inline implementan el mismo patrón inline (no usan el `<Drawer>` shared).

**Confirm al borrar línea inline** en CotizacionForm / FacturaForm / RemisionForm: si la línea está vacía borra directo, si tiene contenido pide confirmación.

### 20.3 OrdenDrawer + Prorrateo integrado

**Backend** (`OrdenesCompraController`):
- Nuevo método **`recibirLoteProrrateado($idOrden)`**: acepta `{precio_total_pagado, lote_proveedor?, lineas: [{id_detalle, cantidad_recibida}]}`. Calcula `factor = precio_pagado / Σ(cantidad × precio_unit_oc)`, aplica a cada línea, crea capas con costo prorrateado en una sola transacción con lock por línea (`FOR UPDATE`). Si pendientes=0 marca OC `Recibida`.
- Nuevo método **`loteSugerido($idOrden)`** → `GET /ordenes_compra/:id/lote-sugerido`. Devuelve `{lote: "LOT-OC{id}-{Ymd}"}`. Reusa código existente si ya hay capas con lote para esa OC.
- Helper privado `resolverLoteProveedor()` centraliza la lógica de generación/reuso de código de lote. Llamado por `recibirLinea` y `recibirLoteProrrateado`.

**Frontend** (`Compras/`):
- **`RecibirProrrateoModal.jsx`** — modal grande (max-w-4xl) que se abre desde OrdenDrawer cuando estado=Enviada y ≥2 líneas pendientes. Tabla con cantidades editables + input precio total negociado (formato peso COP con `formatThousands`) + lote pre-rellenado vía `useLoteSugerido`. Live calc de factor, ahorro/sobrecargo. Lock visual con tabla `tabular-nums` y badge color-coded según factor.
- **`RecibirLineaModal.jsx`** — ahora también recibe `ordenId` prop, usa `useLoteSugerido` para pre-rellenar el input del lote.
- **`useLoteSugerido.js`** — query con `staleTime: 60s`. Las mutations `recibirLinea` y `recibirProrrateado` invalidan esta key para que la próxima recepción vea el código actualizado.
- **OrdenDrawer**: `size="3xl"` (antes 4xl), botón "Recibir lote prorrateado" condicional a estado Enviada + ≥2 pendientes.

### 20.4 Formulaciones — toggle Costo real vs Costo lista

Antes: la tabla auto-seleccionaba el proveedor más barato → mostraba `item_proveedor.precio_unitario` (precio de lista). Esto **no reflejaba prorrateo** — un descuento por volumen en una recepción nunca aparecía en la fórmula.

Ahora:
- **Estado nuevo `costMode` en `FormulacionesPage`**: `'real'` (default) o `'lista'`.
- **Toggle UI** arriba de la tabla con dos botones (📦 Costo real / 🏷 Costo lista) y descripción contextual de qué representa cada modo.
- **`FormulacionesTable.getOpcionEfectiva(mpId)`** decide por ingrediente:
  1. Si hay override manual del usuario → ese gana.
  2. Si `costMode === 'lista'` → cheapest provider (opciones[0]).
  3. Si `costMode === 'real'` → null → cae al costo estándar `costos_item.costo_unitario` (promedio ponderado de capas — refleja prorrateo).
- **Eliminado el `useEffect` que auto-poblaba `seleccionPorIngrediente`** — la lógica vive ahora en tiempo de render (más limpia, sin warnings de lint `set-state-in-effect`).
- Modo real es el default porque el costo histórico (capas) coincide con tu inventario y márgenes reales. Modo lista para cotizar reposición.

### 20.5 Módulos / rutas eliminados

- **Tambores**: borrado completo (frontend modules/Tambores/, backend TamborController + TamborModel, rutas, permisos DB, "Ver tambores" en Inventario DataTable). La migración que creó la tabla `tambores` queda en historial (no se rolea).
- **Prorrateo standalone** (`/prorrateo`): borrado. El modal `RecibirProrrateoModal` dentro de OrdenDrawer queda como única forma de prorratear. La conclusión fue que la calculator standalone confundía vs el modal contextual.
- **AnalisisAhorroOC**: borrado. Era una sección que comparaba OC vs precio de lista en el drawer. Se removió por simplicidad. El JOIN extra de `precio_lista_actual` en `OrdenesCompraModel::detalle` también se revirtió.

### 20.6 Roles polish (superadmin)

- `RolesTab` en UserPanel: agregada columna "Superadmin" en la matriz módulo×rol (locked, siempre acceso total).
- Dropdown de usuarios incluye `superadmin` en opciones.
- Promociones a admin/superadmin piden confirmación con `openConfirm({variant: 'warning'})`.
- No podés cambiar tu propio rol (select disabled + chip "(vos)").
- Texto actualizado: "Cambios se aplican inmediatamente" (porque ahora `token_version` invalida JWT al cambiar rol).
- `password_must_change` fix: `UsuarioModel.allowedFields` ahora incluye este campo (sin esto, CI4 silently stripeaba el flag y el modal forzado aparecía en cada login).

### 20.7 Otros refactors visuales

- **`GlobalTopProgressBar`** en Layout entre Topbar y main. Usa `useIsFetching()` de React Query. Las 7 páginas que tenían su propio `<TopProgressBar>` lo perdieron (eliminado import + uso, destructure de isLoading/isFetching limpiado cuando ya no se usaba). Antes la barra colisionaba con el icono del header de cada página.
- **3 archivos renombrados** sacando espacio antes de `.jsx`: `FormCostProducts.jsx`, `ProduccionFilters.jsx`, `ProduccionTable.jsx`. Los imports en `index.js`, `FormulacionesPage.jsx`, `ProduccionPage.jsx`, `ProduccionDetailModal.jsx` actualizados. Esto rompía deploy en Linux/CI.
- **React Query retry policy central** en `main.jsx`: queries no reintentan en 4xx, hasta 2 reintentos con backoff exponencial en 5xx/red. Mutations no reintentan por default.

### Frontend coupling con backend (cosas para no romper)

- `GET /auth/me` debe devolver `{ok, usuario: {id, username, nombre, rol, modulos, password_must_change}}`. Si cambia el shape, Layout deja de funcionar.
- `PATCH /usuarios/mi-password` debe devolver `{ok, token}` con el nuevo JWT (`token_version` incrementado). Si no devuelve token, la sesión cae al próximo request.
- `POST /login` debe incluir `token_version` en el JWT payload + `password_must_change` en el `usuario` del response.
- `GET /ordenes_compra/:id/detalle` debe traer en cada línea: `factor_conversion`, `unidad_compra_nombre`, `precio_unit` — el modal `RecibirProrrateoModal` y `RecibirLineaModal` dependen de esto.
- Detalle de OC ya NO trae `precio_lista_actual` (revertido al borrar AnalisisAhorroOC).

### Archivos nuevos en esta sesión

```
src/hooks/useFieldErrors.js
src/hooks/useFormValidation.js
src/modules/Compras/api/useLoteSugerido.js
src/modules/Compras/components/RecibirProrrateoModal.jsx
```

### Archivos eliminados

```
src/modules/Tambores/ (folder completo)
src/modules/Inventario/Components/TamboresItemModal.jsx
src/modules/Prorrateo/ (folder completo)
src/modules/Compras/components/AnalisisAhorroOC.jsx
```

---

> **Snapshot al cierre 2026-05-21**: Frontend con auditoría profunda completa (3 fases ejecutadas), prorrateo integrado al flujo de OC con auto-generación de código de lote y formato peso COP, toggle costo real/lista en Formulaciones que cierra la inconsistencia entre prorrateo de capas y costo mostrado. Módulos huérfanos (Tambores, Prorrateo standalone, AnalisisAhorroOC) eliminados. Build limpio en ~13-16s. Backlog completo en `PENDIENTES.md` (raíz). Tareas mayores pendientes: tests automatizados, OpenAPI/Swagger, refresh token, deploy hardening (HTTPS/security headers/CORS prod).

---

## 21. Sesión 2026-05-25 — Audit y doc refresh (sin cambios de código)

Ningún archivo `.jsx`, `.js` o `.css` modificado desde 2026-05-22. Esta sesión solo refresca documentación. Lo importante para un Claude que entre frío:

### Conteos reales vs lo que decía la doc

| Item | Doc anterior | Real (2026-05-25) |
|---|---|---|
| Módulos en `src/modules/` | 20 | **24** — agregar a la cuenta: `CostosProduccion`, `SaludSistema`, `Sincronizacion`, `Trazabilidad`, `Roles` (que aunque se montó como tab del UserPanel, la carpeta sigue presente con archivos `RolesPage.jsx`/`RolesTab.jsx`) |
| Hooks en `src/hooks/` | sin contar | **4**: `useFieldErrors.js`, `useFormValidation.js`, `useTableSorts.js`, `useUrlSearch.js` |
| Components en `src/shared/` | "28" | **34** archivos `.jsx` en raíz + 7 en `Form/` = 41. Hay más de los listados en §5 |
| ESLint | "build limpio" | **69 errors + 16 warnings**: build pasa porque ESLint no es parte del build, pero hay deuda real |
| README | no mencionado | **NO EXISTE** `pinca_frontend/README.md` |

### `useClientPagination` — convive con TableShell

La doc decía "hook compañero" en §20 implicando que vive en `src/hooks/`. En realidad está **exportado desde `src/shared/TableShell.jsx:38`** (junto al componente). Funciona idéntico, pero si lo buscás como archivo independiente no existe. Está bien como está — solo dejá la convivencia clara.

### `FormTexarea.jsx` — typo persiste

Documentado en §5 y en `PENDIENTES.md` como "renombrar a `FormTextarea.jsx`". Sigue con el typo en `src/shared/Form/FormTexarea.jsx`. Si lo renombrás, actualizá los imports en los callsites (grep `from.*FormTexarea`).

### `apiRoutes.js` — namespaces incompletos

Los namespaces presentes cubren la mayoría de los recursos, pero **3 grupos de rutas están hardcodeadas en hooks**, no centralizadas:

- **OC**: `src/modules/Compras/api/useCompras.js` y `useLoteSugerido.js` hacen `apiClient.get('/ordenes_compra/...')` directo. Falta `ORDENES_COMPRA` namespace.
- **Costos de Producción**: `src/modules/CostosProduccion/api/useCostosProduccion.js` hace `apiClient.get('/costos-produccion')` directo. Falta `COSTOS_PRODUCCION` namespace.
- **Salud del Sistema**: `src/modules/SaludSistema/api/useSaludSistema.js` hace `apiClient.get('/salud-sistema')` directo. Falta `SALUD_SISTEMA` namespace.

No rompe nada, pero rompe el patrón DRY del archivo. Migrar al centralizar.

### ESLint — categorización de los 69 errors

Si vas a abrir un tab para limpiar, los errores se agrupan así (corré `npm run lint > /tmp/lint.txt 2>&1; head -200 /tmp/lint.txt`):

1. **Hooks called conditionally** (3 en `ModalRegistrarPago.jsx` líneas 38/46/47) — bug real, romper return early.
2. **setState in effect** (~6 lugares: `ClientePage.jsx:51`, `TableShell.jsx`, `UserPanel.jsx:508/582`, `Sincronizacion`...). Migrar a `useMemo` o llamar setState fuera del effect.
3. **Components created during render** (`ExportCotizacion.jsx:188` declara `<Row>` adentro, `IvaToggle.jsx` declara `<Segment>` adentro). Mover fuera del componente padre.
4. **Fast-refresh exports** (`main.jsx:13` con `ToastLimiter`, `TableShell.jsx` con `useClientPagination`). Mover a archivo propio.
5. **Unused vars** (`logoUrl` en `ExportCotizacion`, `checked`, `proveedoresFormulacion`, `isLoadingProveedores`, `isLoadingCostosProveedor` en `FormulacionesPage`).
6. **Exhaustive-deps warnings** (`usePagos`, `modulos`, `list` deps faltantes — bajo riesgo).

### Rutas actuales en `src/App.jsx`

Verificadas hoy. La sección §3 sigue listando rutas obsoletas (`/tambores`, `/prorrateo`, `/roles`). Rutas REALES presentes:

```
/login, /, /sedes, /catalogo, /inventario-global, /inventario/bodega/:id,
/instalaciones/bodegas/:id, /formulaciones, /produccion, /comercial, /compras,
/cartera, /pagos, /proveedores, /clientes, /movimientos, /rentabilidad,
/sincronizacion, /configuracion, /trazabilidad, /costos-produccion, *
+ /costos → Navigate to /rentabilidad (preserva bookmarks)
```

`/tambores`, `/prorrateo`, `/roles`, `/salud-sistema` ya no son rutas — fueron eliminadas o movidas a tabs del UserPanel.

### Build status

```bash
npm run build  # ~12s, bundle main ~1.78 MB (gzip ~463 KB)
```

Compila limpio. Warnings de chunks > 500KB (jspdf 385KB + vendor-ui 426KB + main). Dynamic imports ya aplicados a PDFs (jspdf cargado on-demand desde modales de Export), pero la mayoría del peso es el bundle principal — pendiente de code-splitting agresivo si crece más.

### Build status y rutas — coupling backend

Sin cambios desde §20. El backend tampoco se tocó (último archivo PHP modificado: 2026-05-21). Confirmado: el contrato `/auth/me`, `/ordenes_compra/:id/recibir-prorrateado`, `/lote-sugerido`, `/costos-produccion/:id/historia` sigue intacto.

---

> **Snapshot intermedio 2026-05-25 (audit)**: Audit cerrado. Sigue abajo la segunda mitad de la sesión que ejecutó los pendientes detectados.

---

## 22. Sesión 2026-05-25 — Ejecución de pendientes del audit

Segunda mitad de la sesión. Después del audit se ejecutaron 6 bloques de cambios concretos. **Build sigue compilando limpio (~12.6s)**. ESLint bajó de **69 → 47 errors** (−32%, −22 errores), y de 16 → 14 warnings.

### Archivos creados (3)

- `src/hooks/useClientPagination.js` — extraído de TableShell (también arregla un Fast-refresh error)
- `src/shared/ToastLimiter.jsx` — extraído de `main.jsx` (idem)
- `pinca_frontend/README.md` — antes no existía

### Archivos renombrados (1)

- `src/shared/Form/FormTexarea.jsx` → `src/shared/Form/FormTextarea.jsx`

Imports actualizados en 6 callsites: `ModalRegistrarPago.jsx`, `FacturaForm.jsx`, `FormulacionModal.jsx`, `TraspasoModal.jsx`, `PagoForm.jsx`, `SedeForm.jsx`.

> El componente exportado siempre se llamó `FormTextarea` (sin typo en el nombre), el typo era solo el nombre del archivo. No hubo que renombrar el componente.

### `useClientPagination` movido a `src/hooks/`

Antes vivía co-exportado en `src/shared/TableShell.jsx:38`. Ahora:

```js
// src/hooks/useClientPagination.js
export default function useClientPagination(data = [], defaultPerPage = 20) { ... }
```

Y desde TableShell:

```js
import useClientPagination from '../hooks/useClientPagination';
```

Callsites actualizados (9 archivos): `FacturasTable.jsx`, `CotizacionesTab.jsx`, `FacturacionTab.jsx`, `RemisionesTab.jsx`, `OrdenesTab.jsx`, `HistorialTab.jsx`, `HuerfanosTab.jsx`, `MaestroTab.jsx`, y el propio `TableShell.jsx`.

**Nota de patrón**: la nueva implementación no usa `useEffect` para re-snapshot — calcula página actual en render. Funcionalmente equivalente al previo (el effect anterior tampoco resetaba si la referencia del array cambiaba sin cambiar `length`). Si en un callsite la data se recrea por referencia constantemente, el comportamiento es idéntico al previo.

### `apiRoutes.js` — 3 namespaces centralizados

Agregados al archivo:

```js
ORDENES_COMPRA: {
  LIST: '/ordenes_compra',
  DETAIL: (id) => `/ordenes_compra/${id}/detalle`,
  CREATE: '/ordenes_compra',
  UPDATE_ESTADO: (id) => `/ordenes_compra/${id}/estado`,
  RECIBIR_LINEA: (id, idDetalle) => `/ordenes_compra/${id}/recibir/${idDetalle}`,
  RECIBIR_PRORRATEADO: (id) => `/ordenes_compra/${id}/recibir-prorrateado`,
  LOTE_SUGERIDO: (id) => `/ordenes_compra/${id}/lote-sugerido`,
},
COSTOS_PRODUCCION: {
  LIST: '/costos-produccion',
  SHOW: (id) => `/costos-produccion/${id}`,
  HISTORIA: (id) => `/costos-produccion/${id}/historia`,
},
SALUD_SISTEMA: '/salud-sistema',
```

Hooks migrados: `useCompras.js`, `useLoteSugerido.js`, `useCostosProduccion.js`, `useSaludSistema.js`.

**Pendiente menor**: `PUT /ordenes_compra/:id` (UPDATE) y `DELETE /ordenes_compra/:id` quedaron hardcoded en `useCompras.js` con un comentario `NOTA:` porque no estaban en el spec del refactor. Próxima vez, agregarlas al namespace.

### ESLint fixes (de 69 → 47 errors)

| Bloque | Fix |
|---|---|
| **useState condicional** (`ModalRegistrarPago.jsx` líneas 38/46/47) | Movidos TODOS los hooks arriba del early return → orden estable. Trade-off: ahora los setters quedan sin uso cuando `factura?.id_facturas` es null (inocuo, desperdicia 0 ciclos relevantes). |
| **setState in effect** (4 lugares pedidos) | `useClientPagination` (eliminado el effect), `ClientePage.jsx:51` (initializer pattern con `useState(() => initialQ || '')`), `UserPanel.jsx:511` (EmpresaTab), `UserPanel.jsx:582` (ModulosMatrix). |
| **Components in render** | `<Row>` en `ExportCotizacion.jsx:188` movido fuera del componente. `<Segment>` en `IvaToggle.jsx` también. |
| **Fast-refresh exports** | `ToastLimiter` movido a `src/shared/ToastLimiter.jsx` (main.jsx ahora lo importa). `useClientPagination` ya no se exporta desde TableShell. |
| **Unused vars** | `logoUrl` eliminado en `ExportCotizacion.jsx`. `proveedoresFormulacion`, `isLoadingProveedores`, `isLoadingCostosProveedor` eliminados en `FormulacionesPage.jsx`. |

**Quedan ~14 `setState in effect`** en archivos NO pedidos por el spec del refactor. Siguen pendientes — listados en `PENDIENTES.md`.

### Validación blur en CotizacionForm + RemisionForm

Aplicado `useFormValidation` ya existente. Reglas:
- `cliente_id` o `cliente_libre`: al menos uno requerido (mensaje: "Cliente requerido").
- `fecha`: requerido.
- `items[]`: chequeado en `handleSubmit` que al menos 1 item tenga `cantidad > 0`.

Pattern en `FormDate`: `onChange={(iso) => { v.change('fecha', iso); v.blur('fecha', iso); }}` — dispara la validación al seleccionar fecha (no espera blur real, que no existe en pickers).

### README frontend

Antes no existía. Ahora ~60 líneas con descripción, stack, comandos `npm` (dev/build/lint/preview), env vars (`VITE_API_BASE_URL`), link a `CLAUDE.md`.

### Build status al cierre

```bash
npm run build  # ✓ ~12.6s, main 1.77MB (gzip 463 KB)
npm run lint   # ✖ 47 errors + 14 warnings (de 69+16 inicial)
```

Bundle no creció. Warnings de chunks > 500KB son pre-existentes (jsPDF 385KB + vendor-ui 426KB) — no relacionados con esta sesión.

### Riesgos detectados (mantener en cuenta al usar)

1. **CotizacionForm/RemisionForm con FormDate**: el patrón `change+blur` en el `onChange` del picker muestra el error de validación inmediatamente al seleccionar fecha. Para selectors es correcto (no hay blur natural), pero es UX a probar.
2. **ModalRegistrarPago**: ahora los hooks se ejecutan incluso si la factura aún no está cargada. Es inocuo pero técnicamente desperdicia ciclos. Alternativa "más limpia" requería wrapper externo — no se hizo para no entrar a refactor mayor.
3. **`useClientPagination`**: nueva implementación es "snapshot in render". Si algún callsite tiene `data` recreado por referencia constantemente sin cambiar `length`, no resetea — comportamiento idéntico al previo.

### Lo que NO se hizo en esta sesión (sigue en `PENDIENTES.md`)

Por scope explícito de la sesión:
- 14 `setState in effect` restantes en archivos fuera del spec.
- Dark mode (re-pintar todo el design system).
- Virtualización (`MovimientosTable`, `ProduccionTable`).
- Bulk actions en Cotizaciones/Facturas/OCs.
- Export Excel.
- Notificaciones real-time (WebSockets/SSE).
- Refresh token / logout server-side.
- Vitest setup + cobertura.
- Code-splitting agresivo (dynamic imports en módulos pesados).
- `useFieldErrors` integrado en items de tabla (`RowInput`).
- Búsqueda con debounce dentro de drawers grandes.
- Touch targets 44px en mobile.
- `document.title` en rutas faltantes.

---

> **Snapshot intermedio 2026-05-25 (mediodía)**: Cleanups menores cerrados. Sigue abajo §23 con la tercera ronda del mismo día.

---

## 23. Sesión 2026-05-25 (tarde) — Cleanups grandes + code-splitting agresivo + UX

Tercera ronda del día. Después del audit (mañana) y ejecución del backlog (mediodía), esta sesión cerró todos los items pequeños/medianos restantes del backlog y dejó solo features grandes pendientes (dark mode, refresh token redesign, bulk actions, virtualización, Vitest setup, OpenAPI). **Bundle reducido 76%**, ESLint **33 errors (de 47, −30%)**, **CERO `setState in effect` quedan**.

### Archivos modificados (24) + creados (2)

**setState in effect fixed (13)**:
- 5 tabs de `Configuracion/components/`: `EmpresaTab`, `FinancieroTab`, `SeguridadTab`, `TributariaTab`, `UmbralesTab`
- `Formulaciones/components/ClonarFormulacionModal`, `FormulacionVersionesDrawer`
- `InventarioGlobal/InventarioGlobalPage`
- `Produccion/components/DisponibilidadModal`
- `Proveedores/ProveedoresPage`, `Proveedores/components/VincularModal`
- `Roles/RolesPage`
- `shared/CommandPalette`

**Otros**:
- `src/api/apiRoutes.js` (UPDATE + DELETE de OC en namespace)
- `src/modules/Compras/api/useCompras.js` (callsites migrados)
- `src/modules/Comercial/Cotizaciones/components/CotizacionForm.jsx` + `Remisiones/components/RemisionForm.jsx` (useFieldErrors en items)
- `src/shared/PageTitle.jsx` (5 rutas nuevas)
- `src/shared/ActionMenu.jsx` (touch targets 44px)
- `src/shared/ErpTable.jsx` (nueva prop `emptyAction`)
- `src/modules/Comercial/Cotizaciones/CotizacionesTab.jsx` + `Compras/components/OrdenesTab.jsx` (EmptyState con CTA)
- `src/App.jsx` (lazy + Suspense en 18 pages)

**Nuevos**:
- `/PROYECTO_PINCA/README.md` (raíz monorepo, ~95 líneas)

### Code-splitting agresivo en `src/App.jsx`

Convertidas a `lazy()` + `<Suspense fallback={<FullPageLoader />}>`:

```js
const FormulacionesPage = lazy(() => import('./modules/Formulaciones/FormulacionesPage.jsx'));
const ProduccionPage = lazy(() => import('./modules/Produccion/ProduccionPage.jsx'));
// ... 18 pages en total
```

**Eagerly importadas** (entry path crítico): `Layout`, `Login`, `NotFound`, `SedePage`.

**Resultado**:

| Métrica | Antes | Después |
|---|---|---|
| Main bundle | 1.77 MB (gzip 463 KB) | **424 KB** (gzip 133 KB) |
| Reducción | — | **−76% raw, −71% gzip** |
| Chunks nuevos | — | 18 (uno por page) |
| Chunks pesados que se mantienen como dependencias separadas | jspdf 385KB, vendor-ui 426KB, html2canvas 201KB, xlsx 283KB | — |

**Trade-off**: la primera navegación a cada page muestra `<FullPageLoader>` brevemente (carga el chunk). En conexiones rápidas no se nota, en lentas sí.

### `useFieldErrors` integrado en items de tabla

`GridInput.jsx` ya aceptaba `error`. En `CotizacionForm` y `RemisionForm` (FacturaForm ya lo tenía) se pasan errores por path anidado:

```jsx
<GridInput
  value={item.cantidad}
  onChange={(v) => { setItem(idx, 'cantidad', v); clearField(`items.${idx}.cantidad`); }}
  error={errors[`items.${idx}.cantidad`]}
/>
```

El hook `useFieldErrors` ya soportaba paths anidados naturalmente.

### `document.title` por ruta — completa

`src/shared/PageTitle.jsx` ahora cubre las 19 rutas declaradas en App.jsx. Agregadas: `/sedes`, `/costos-produccion`, `/sincronizacion`, `/trazabilidad`, `/configuracion`, `/inventario-global`.

### Touch targets ≥ 44px en `ActionMenu`

Trigger: `min-w-[44px] min-h-[44px]`. Items: `py-2.5 min-h-[44px]`. Visualmente igual, ahora tappeable en mobile sin perder el punto.

### EmptyState con CTA

`<ErpTable>` ahora acepta prop `emptyAction` que se renderiza dentro del `<EmptyState>`. Aplicado en `CotizacionesTab` y `OrdenesTab`:

```jsx
<ErpTable
  ...
  emptyMessage="No hay cotizaciones"
  emptySubMessage="Cuando crees una cotización, aparecerá acá."
  emptyAction={<Button variant="primary" onClick={openCreate} icon={Plus}>Nueva cotización</Button>}
/>
```

### Patrón usado para `setState in effect` → `useMemo`/state controlado

```jsx
// MAL
const [val, setVal] = useState(initial);
useEffect(() => { if (data) setVal(transform(data)); }, [data]);

// BIEN — useMemo cuando es puro derived
const val = useMemo(() => data ? transform(data) : initial, [data]);

// BIEN — initializer + state controlado para edición
const originales = useMemo(() => buildOriginales(data), [data]);
const [overrides, setOverrides] = useState({});
const form = { ...originales, ...overrides };
// onSuccess de save: setOverrides({})
```

El patrón "overrides" se usó en los 5 tabs de Configuracion para editar config sin que el effect rompa el flujo de save.

### Estado final ESLint + build

```bash
npm run lint   # ✖ 46 problems (33 errors, 13 warnings)
npm run build  # ✓ ~12s, main 424 KB (gzip 133 KB)
```

Los 33 errores restantes son:
- Algunos `react-hooks/static-components` en exports legacy (Row/Segment ya fueron movidos en sesión mediodía; quedan en exports que no se tocaron).
- `Cannot access refs during render` en `FormulacionModal`, `FormCostProducts` (no estaban en el spec — requieren refactor de portales).
- `no-unused-vars` y `react-hooks/rules-of-hooks` en `FormulacionesTable` (preexisten desde antes).
- 0 `set-state-in-effect`.

### Riesgos / cosas raras

1. **Patrón overrides en Configuracion tabs**: si el backend devuelve valor distinto al original tras un save fallido, el override stale podría persistir. Mitigado: `useUpdateEmpresa.onSuccess` invalida queries y refetch.
2. **`FormulacionVersionesDrawer.selectedId`** ahora se deriva en render. Si el `overrideId` apunta a un id que ya no existe (versiones[] cambia), muestra detalles vacíos. Mismo gap que el patrón previo.
3. **CommandPalette** desmonta/remonta el body al toggle (Suspense + lazy del modal). Perdió cualquier focus/scroll local — UX idéntica al previo, que también reseteaba on close.
4. **Code-splitting + Suspense fallback**: primera navegación a cada page muestra loader. Trade-off explícito.

### Lo que NO se hizo (sigue en `PENDIENTES.md`)

- ~12 errores ESLint restantes (refs durante render, components-in-render legacy en otros archivos).
- Dark mode (design system completo).
- Virtualización en `MovimientosTable` y `ProduccionTable`.
- Bulk actions (selección múltiple + acción batch en Cotizaciones/Facturas/OCs).
- Export Excel (xlsx ya instalado — solo falta la UI/serialización).
- Vitest setup + cobertura.
- Refresh token / modal "tu sesión expira" (parcial: logout server-side ya existe en backend).
- Búsqueda con debounce en drawers grandes (selects con 100+ entradas).
- Notificaciones real-time (WebSockets/SSE).

---

> **Snapshot al cierre 2026-05-25 (tarde)**: Frontend en estado **post-cleanup masivo**. Bundle main 424 KB (de 1.77 MB), 0 `setState in effect`, 19 rutas con `document.title`, items de tabla con errores backend mapeados, touch targets mobile-ready, EmptyStates con CTA en módulos clave. Code-splitting agresivo separó 18 pages en chunks independientes.

---

## 24. Sesión 2026-05-27 — Refresh token UX + Export Excel + Vitest + ESLint final

Sesión coordinada con backend (3 agentes paralelos). ESLint **33 → 4 errors**. Build limpio (~9.8s). El backlog DEV frontend queda casi vacío: dark mode, virtualización, bulk actions, y completar el install de Vitest.

### Refresh token UX — `SessionExpiryModal`

Contrapartida del refresh token rotativo del backend (ver `pinca_backend/CLAUDE.md § Sesión 2026-05-27`).

**Contrato consumido**:
- `POST /login` ahora devuelve `refresh_token` → se guarda en `localStorage` key `pinca:refresh_token`.
- `POST /api/auth/refresh` (`AUTH.REFRESH` en apiRoutes) body `{refresh_token}` → `{ok, token, refresh_token}` (rota ambos).

**`src/shared/SessionExpiryModal.jsx`** (nuevo, montado en `Layout.jsx` junto a `ForceChangePasswordModal`):
- Decodifica el `exp` del JWT actual con `JSON.parse(atob(token.split('.')[1]))` (sin librería).
- Programa timer que muestra el modal **5 min antes** del `exp`. Countdown mm:ss.
- "Extender sesión" → `POST /auth/refresh` con el refresh de localStorage. Si OK: guarda nuevo token (`setAuth`) + nuevo refresh (localStorage), cierra, reprograma. Si falla (401) → `logout()` + redirect login.
- "Cerrar sesión" → `logout()`.
- Si el JWT no tiene `exp` parseable, no programa nada (no rompe).
- `authSlice.logout()` ahora borra `pinca:refresh_token`. `Login.jsx` guarda `res.refresh_token` al loguear.

### Export Excel — Cotizaciones y OCs

`xlsx` ya estaba instalado. Dos exporters nuevos:
- `src/modules/Comercial/Cotizaciones/components/ExportCotizacionExcel.js` — columnas: Número, Cliente, NIT, Fecha, Vencimiento, Ítems, Subtotal, IVA, Total, Estado. Acepta fila única o lista.
- `src/modules/Compras/components/ExportOrdenCompraExcel.js` — columnas: Número OC, Proveedor, Fecha, Total, IVA, Total con IVA, Estado (usa `total_con_iva`/`iva_monto` del backend con fallback a `ivaPct`).
- Wireup en `CotizacionesTab` y `OrdenesTab`: botón Excel por fila (junto al PDF) + botón "Excel" en header que exporta la lista filtrada visible.
- **Nota de scope**: el export de lista usa campos de resumen, no detalle de ítems por fila (eso requeriría fetch por entidad).

### Vitest — setup creado, ⚠️ PENDIENTE DE INSTALL

Vitest **no estaba instalado y NO se instaló** (sin red garantizada en la sesión). Quedó listo para activar:
- `vitest.config.js` (environment jsdom, globals).
- `src/utils/formatters.test.js` (tests reales de `formatoPesoColombiano`, `parsePesoColombiano`).
- `src/hooks/useClientPagination.test.js` (paginación con `renderHook`).
- Script `"test": "vitest"` en package.json.

**Para activar**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm run test -- --run
```

### ESLint 33 → 4

Arreglado: unused vars (`useMemo`, `logo`, `autoTable`/`logoBase64`, `margenPromedio`, `hayStockOk`, `checked`, `catch (e)`), empty catch en `FormulacionModal`, refs durante render en `FormCostProducts` y `FormulacionModal` (`saveAndContinue` ref→state + factory de `onSubmit`), rules-of-hooks en `FormulacionesTable` (`useMemo` movido antes del return condicional), 3 `react-refresh/only-export-components` (extraídos `fmtFechaChip`→`utils/dateChip.js`, `getDateRange`→`Rentabilidad/components/dateRange.js`, `useIvaToggle`→`hooks/useIvaToggle.js`).

**Quedan 4 errores** (requieren refactor mayor, no afectan build/runtime):
- `CapasStockPanel:351` — `Date.now()` impuro en render.
- `FormulacionesTable:189` — memoization skip.
- `FormCostProducts:226` + `FormulacionModal:317` — 2 `setState in effect` (reset-on-open) que se "revelaron" al desbloquear la compilación; necesitan refactor del padre con `key`.

### `SummaryCard → FlowCard` — migración completa

Migrados los 6 archivos que usaban `SummaryCard`: `FacturasTable`, `CotizacionesTab`, `FacturacionTab`, `RemisionesTab`, `OrdenesTab`, `InventarioGlobalPage`. Mapeo `color → tone` (gray→neutral, blue→info, green→success, amber→warning, red→danger). Ningún uso pasaba `trend` (prop no soportada por FlowCard), migración limpia. `SummaryCard.jsx` quedó huérfano (sin importadores) — se dejó el archivo por si se quiere referencia, pero ya no se usa.

### Popovers mobile-safe

- `FormDate`: clampea `left` contra `window.innerWidth` (margen 8px) + `maxWidth` + `overflow-x-auto`.
- `DateRangePicker`: muestra 1 mes (no 2) en `<640px` + `max-w-[calc(100vw-1rem)]` + scroll.

### Marcar todas como leídas — ya existía

`NotificacionesDropdown.jsx` ya tenía el botón "Leer todas" + `useMarcarTodasLeidas` que llama `/notificaciones/leer-todas`. Sin cambios necesarios.

### Estado sidebar (reporte)

- `/pagos` — ruta en App.jsx pero sin entrada en `sidebarMenu.js` (acceso por URL/links). Intencional.
- `/sincronizacion`, `/configuracion` — ruta sin entry (Configuración se abre por el engranaje). Intencional.
- `/roles` — ya no es ruta (movido a tab del UserPanel, solo superadmin).

### Archivos de esta sesión

**Creados**: `SessionExpiryModal.jsx`, `ExportCotizacionExcel.js`, `ExportOrdenCompraExcel.js`, `vitest.config.js`, `formatters.test.js`, `useClientPagination.test.js`, `utils/dateChip.js`, `Rentabilidad/components/dateRange.js`, `hooks/useIvaToggle.js`.
**Modificados**: `Layout.jsx`, `authSlice.js`, `Login.jsx`, `apiRoutes.js`, `CotizacionesTab`, `OrdenesTab`, `FormDate`, `DateRangePicker`, `FormCostProducts`, `FormulacionModal`, `FormulacionesTable`, + los 6 de `SummaryCard→FlowCard`, package.json.

### Riesgos

1. **`FormulacionModal`**: `onSubmit` ahora es factory `(continuar) => async (data) => …` y `saveAndContinue` es state. Verificar manualmente "Guardar y continuar".
2. **Vitest no corre hasta el `npm install`** de los 4 dev-deps.
3. **4 ESLint restantes** no afectan build/runtime.
4. **`SummaryCard.jsx` huérfano** — borrable en un cleanup futuro.

---

> **Snapshot al cierre 2026-05-27**: Frontend con refresh token UX (modal "sesión por expirar" + extend silencioso), Export Excel en Cotizaciones/OCs, Vitest configurado (pendiente `npm install`), ESLint 4 errors (de 69 inicial, −94%), SummaryCard totalmente migrado a FlowCard, popovers mobile-safe.

---

## 25. Sesión 2026-05-29 — Dark mode foundation + virtualización + bulk actions + Vitest install

Sesión grande coordinada con backend (4 agentes paralelos: 2 backend, 2 frontend). El backlog DEV frontend queda **prácticamente cerrado**: solo dark mode tiene áreas con `bg-white` literal que requieren audit visual, queda búsqueda con debounce en drawers, y notificaciones real-time.

### Dark mode foundation completa

**Archivos**:
- `src/index.css` — agregado bloque `html.dark { ... }` con override completo de tokens (surfaces, content, borders, semantic-subtles, brand-subtle, sombras). `--color-scheme: dark` en `html.dark` para que scrollbars nativos respeten el tema. **Brand-primary amarillo Pinca intacto**.
- `index.html` — script anti-flash inline (`pinca:theme` + `prefers-color-scheme`) ANTES de hidratar React.
- `src/hooks/useTheme.js` (nuevo) — hook con 3 modos: `light`, `dark`, `system`. El modo `system` borra la key de localStorage y escucha `matchMedia('(prefers-color-scheme: dark)')` para auto-actualizar.
- `src/shared/UserPanel.jsx` — `PreferenciasTab` nueva sección "Tema" con 3 botones (Sol/Luna/Monitor) sobre "Apariencia y comportamiento".
- `src/shared/Topbar.jsx` — botón Sol/Moon rápido entre Sincronización y Notificaciones (toggle inmediato light↔dark).

**Paleta dark** (zinc-based, contraste alto):
- `surface-base: #18181b`, `surface-subtle: #09090b`, `surface-muted: #27272a`, `surface-strong: #3f3f46`, `surface-elevated: #27272a`, `surface-overlay: rgba(0,0,0,0.65)`.
- `content-primary: #fafafa`, `content-secondary: #d4d4d8`, `content-tertiary: #a1a1aa`, `content-muted: #71717a`, `content-inverse: #18181b`.
- `border-subtle: #27272a`, `border-base: #3f3f46`, `border-strong: #52525b`, `border-focus: #fafafa`.
- Semantic subtles usan `rgba(color, 0.15-0.18)` para mantener color sobre fondo oscuro.

**Cascadeo automático**: como todos los componentes usan tokens semánticos (`bg-surface-*`, `text-content-*`, etc.), no se tocó ningún módulo individual. Los tokens cambian y todo cascadea.

**Áreas que NO cascadean (follow-up con app corriendo)**:
- `bg-white` literal en algunos componentes (ej. `CapasStockPanel.jsx`, varios inputs). En dark se ven blancos.
- `bg-content-primary` (negro literal) usado para botones primary y backdrops — posible exceso de contraste en dark.
- `utils/avatarTheme.js` (gradientes hardcoded, intencional por diseño).

### Virtualización con `react-window` v2

- **Instalado** `react-window@2.2.7`. API v2 cambió: usa `List` con `rowComponent` + `rowProps`, filas como `<div>` (no `<tr>`).
- **`MovimientosTable`** virtualizado. Umbral `data.length > 200`. `ROW_HEIGHT=56`. Render normal (`ErpTable`) por debajo del umbral. Helpers `renderProductoCell`, `renderCantidadCell`, `renderFechaCreacion` factorizados para reuso entre modo virtual y normal.
- **`ProduccionTable`** virtualizado con mismo patrón.

**Trade-off**: en modo virtual los headers pierden el sort (es un rare path con >200 filas — aceptable, documentado).

### Bulk actions pilot en `FacturasTable` (Cartera)

`src/modules/Cartera/components/FacturasTable.jsx`:
- Nueva columna `__select` con checkbox por fila + checkbox header (indeterminate cuando selección parcial; selecciona las filas VISIBLES en la página actual).
- Estado local `selected: Set<facturaId>` + helpers `toggleSelected`, `toggleSelectAllVisible`, `clearSelection`.
- **Barra flotante** arriba del `TableShell` cuando `selected.size > 0`: pill amarilla con contador "N seleccionadas" + botón "Cambiar estado a Anulada" (variant=danger) + "Limpiar selección" (ghost).
- Confirmación con `openConfirm` (Zustand `variant: 'danger'`) antes de ejecutar.
- Acción batch: `Promise.allSettled(ids.map(id => cambiarEstadoAsync({id, estado: 'Anulada'})))`. Toast con resultado: "X actualizadas, Y con error". La mutation ya invalida `facturaKeys.lists()` en `onSuccess`.
- Comentario al final del archivo documenta el patrón para replicar en `CotizacionesTab` y `OrdenesTab`.

**Pendiente**: si N grande, agregar endpoint backend `POST /facturas/bulk/cambiar-estado` (documentado en el comment).

### Vitest install + tests críticos

- Instalado: `vitest@4.1.7`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `jsdom@29.1.1`, `@vitest/ui@4.1.7`.
- `vitest.config.js`: agregado `setupFiles: ['./src/test/setup.js']` para matchers de `jest-dom`.
- `src/test/setup.js` nuevo: importa `@testing-library/jest-dom`.

**Tests creados** (3 nuevos + 2 que ya estaban):
- `src/utils/formatters.test.js` (8 tests, ya existía).
- `src/hooks/useClientPagination.test.js` (5 tests, ya existía).
- `src/utils/cn.test.js` (7 tests) — clsx helper con strings, falsies, arrays anidados, objects, mezclas.
- `src/shared/StatusBadge.test.jsx` (9 tests) — tone por estado (Pendiente, Pagada, Anulada, desconocido), override tone, fixedWidth, minWidth.
- `src/hooks/useUrlSearch.test.js` (5 tests) — param vacío, lectura `q`, decode URL, param custom, ignorar otros. Usa `MemoryRouter` y `{clean: false}` para evitar cleanup que vacía el valor.

**Resultado**: `npm run test -- --run` → **5 archivos / 34 tests, 100% pass** en ~6.6s.

### ESLint 4 → 0 errors

Fixes:
- **`CapasStockPanel.jsx:351`** — `Date.now()` impuro en render → `useState(() => Date.now())` (pin al mount).
- **`FormulacionesTable.jsx:189`** — memoization skip → `useMemo` re-escrito inlineando lógica de `getCostoOverride`/`getOpcionEfectiva`.
- **`FormCostProducts.jsx:226`** — setState in effect reset-on-open → split en `FormCostProductsInner` + wrapper externo con `key={idCostos}`. Inner usa `useState(() => calcInitial())`.
- **`FormulacionModal.jsx:317`** — mismo patrón: renombrado a `FormulacionModalInner` + wrapper que monta inner solo cuando `isOpen` con `key={itemId ?? 'new'}`.

**ESLint final**: 0 errors + 13 warnings. **Build limpio ~9.1s**, main bundle 435.9 KB (gzip 136 KB).

### Coupling con backend (saber para no romper)

- El backend **migró 21 controllers** de shape de error CI4 nativo (`{status, error, messages}`) a `{ok, msg}` de `ApiResponse`. El `apiClient.js` ya tolera ambos para toasts (lee `.message || .messages.error || .msg`). Componentes que inspeccionen `.messages.error` directamente reciben `null`. Smoke-test recomendado para módulos: Auditoría, Configuración, Trazabilidad, Sincronización, Numeración, Cartera, Notificaciones, Empresa, CostosProduccion, Bodegas, Categoría, Unidad, Item, Capas, CostosItem, CostosIndirectos, Comparador, GestionesCobro, Clientes, Proveedor, Instalaciones.
- Endpoints documentados ahora en **Swagger UI**: `http://localhost:8080/swagger-ui.html` (52 ops, 8 tags).
- `apiSuccessFlat` existe en el backend trait — endpoints viejos que ya devuelven shape top-level (`login`, `refresh`, `me`, etc.) lo usan internamente sin cambios visibles para el frontend.

### Riesgos al cierre

1. **`bg-white` literal** en algunos componentes no cascadea a dark — requiere audit visual con la app corriendo (no se hizo en esta sesión por scope).
2. **`react-window` v2 sort en headers**: modo virtual no soporta sort. Documentado, rare path (>200 filas).
3. **Bulk actions** ejecuta N requests paralelos. Para N grande conviene endpoint bulk dedicado.
4. **`FormulacionModal` ahora usa `key={itemId ?? 'new'}`** para forzar remount al cambiar de OC. Si el flujo "Guardar y continuar" tenía estado que dependía de NO remountar, podría romperse — verificar manualmente.

### Lo que queda (PENDIENTES.md)

- Audit visual de dark mode (areas con `bg-white` literal).
- Búsqueda con debounce en drawers grandes.
- Notificaciones real-time (WebSockets/SSE).
- Replicar bulk actions en `CotizacionesTab` y `OrdenesTab`.
- Endpoint backend bulk dedicado para cambios masivos.

---

> **Snapshot al cierre 2026-05-29 (mañana)**: Frontend con dark mode foundation, virtualización `react-window` en 2 tablas, bulk actions pilot en Facturas, Vitest 34/34 PASS, ESLint 0 errors. Build limpio.

---

## 26. Sesión 2026-05-29 (tarde) — Fixes de auditoría profunda

Análisis profundo del sistema (3 agentes) → fixes accionables del lado frontend. Build limpio, lint 0 errors, 34/34 tests.

### Botones de modal de los Export\* invisibles en dark (CRÍTICO arreglado)

El audit de dark mode anterior excluyó los `Export*.jsx` **completos** (correcto para el PDF, que debe ser papel blanco). Pero esos componentes también tienen un **modal de preview (chrome de UI)** cuyos botones usaban `bg-content-primary text-white` → en dark `content-primary` flipea a claro = botón casi blanco con texto blanco, ilegible.

Arreglado en 8 archivos (`ExportFactura`, `ExportOrdenCompra`, `ExportCotizacion`, `ExportProduccion`, `ExportNotaCredito`, `ExportRecibo`, `ExportRemision`, `ExportTrazabilidad`):
- **Botones de acción "Descargar PDF"**: `bg-content-primary text-white` → `bg-brand-primary text-content-on-brand` (amarillo de marca + texto oscuro, legible en ambos modos).
- **Chrome no-botón** (icon-boxes de header, 1 toggle): `text-white` → `text-content-inverse` (que flipea; white no), conservando `bg-content-primary`.

**Regla aprendida**: cuando un componente Export tiene PDF + modal de preview, el PDF (`<PdfTemplate>` / lo capturado por html2canvas) NO se toca, pero el **chrome del modal SÍ debe usar tokens dark-aware**. El PDF quedó intacto en todos.

### Mutación optimista sin rollback (CRÍTICO arreglado)

`src/modules/Inventario/api/useItem.js` `updateMutation`: tenía `onMutate` con update optimista (snapshot de `inventarioKeys.all` vía `getQueriesData`) pero faltaba `onError` (revertir) y `onSettled` (invalidar). Si el PUT fallaba, la UI quedaba con datos editados incorrectos en caché. Agregado `onError` que restaura cada `[queryKey, data]` del snapshot + `onSettled` que invalida `inventarioKeys.all`.

### Otros

- **`useCatalogo.js`**: los 3 `onError` leían solo `e?.response?.data?.messages?.error` (shape viejo CI4). El backend migró a `{ok, msg}`. Agregado fallback `|| e?.response?.data?.msg`.
- **`SummaryCard.jsx` eliminado**: estaba 100% muerto (migrado a `FlowCard` en sesión anterior, 0 imports).

### Coupling con backend (esta sesión)

- Backend reforzó RBAC: `InventarioController::traspaso/ajusteManual/removeFromBodega` ahora requieren rol **operador+** (visor recibe 403). `RemisionesController::delete` es admin-only. Si el frontend muestra esos botones a un visor, van a recibir 403 — conviene ocultarlos por rol en la UI (pendiente menor).
- Backend: consumo MANUAL de capas ahora **falla** si las capas seleccionadas no suman la cantidad requerida. Si algún flujo del frontend permite sub-selección parcial de capas, el POST de producción va a dar error — revisar `CapasStockPanel`/preparación.

### Pendientes frontend del análisis (NO arreglados, en backlog)
- **recharts en chunk eager** (`vite.config.js` lo agrupa con lucide-react) → entra en bundle inicial aunque solo se use en Dashboard/Rentabilidad/CostosProduccion.
- **~30 hooks con rutas hardcodeadas** en vez de `API_ROUTES`.
- **Modal sin focus-trap** (a11y).
- **`CapasStockPanel` con 3 efectos que llaman callbacks del padre** (riesgo de re-render si el padre no memoiza — los warnings ESLint reales).
- **Ocultar por rol** los botones de mutación de inventario para el visor (espejo del RBAC backend).

---

> **Snapshot al cierre 2026-05-29 (tarde)**: Frontend con botones de modal Export legibles en dark, mutación optimista de inventario con rollback, fallback de error en catálogo, SummaryCard eliminado. Build limpio, lint 0 errors, 34/34 tests. Backlog: recharts chunk, apiRoutes hardcoded, focus-trap, ocultar acciones por rol.
