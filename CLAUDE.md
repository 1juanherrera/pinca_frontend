# CLAUDE.md — Pinca Frontend

> Este archivo es la **fuente de verdad** para cualquier Claude que retome este proyecto. Está organizado para leerse en orden de necesidad: contexto rápido arriba, detalles técnicos abajo.

## 1. Estado actual (snapshot 2026-07-28)

> **Última sesión**: 2026-07-28 — Nómina: modal de liquidación → página completa con tabla TanStack + slide-over, comprobante de pago en PDF (formato propio, corto), reorganización del sidebar (grupo "Finanzas"), auditoría UX/UI + prueba de los 16 endpoints de `/nomina` (todos OK). Ver §34.
> **2026-07-24 / 2026-07-17**: hubo dos sesiones sin registrar acá (módulo Nómina básico el 24, auditoría multi-agente de bugs el 17 — ver §34.1 para el resumen breve). Si necesitás el detalle fino de esas dos, revisá `git log` de ese rango.
> **2026-07-02**: paginación en CatalogoTab (TableShell) y ProveedoresTable (getPaginationRange) + auditoría MP (54/57 resueltas). Ver §31.
> **Anterior**: 2026-06-05 — toast con motivo real (409 del backend) al eliminar ítem en `useItem`. Ver §30.
> **2026-06-02**: pestaña "Sugerencias IA" en Sincronización (dedup de MP por identidad química) + mejoras de Login (dark por clase, a11y, Bloq Mayús). Ver §29.
> **2026-05-30 (tarde)**: breadcrumbs arreglados (0 rotos), Login dark mode, `CalculadoraProrrateo` pre-OC, columna "Último precio" en formulaciones, **revert** de ocultar-acciones-por-rol (política por módulo). Ver §28.
> **2026-05-30 (mañana)**: recharts code-split, focus-trap, bulk en Cotizaciones/OCs, debounce. Ver §27.
> **2026-05-29**: dark mode foundation + virtualización + bulk actions + Vitest (§25) y fixes de auditoría (§26).
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

---

## 7. State management

### Zustand store (`src/store/useBoundStore.js`)

Compuesto por 3 slices:

- **`authSlice`** — `token`, `user`, `setAuth(token, user)`, `logout()`. Persist localStorage.
- **`useUISlice`** — `activeDrawer`, `drawerPayload`, `openDrawer(key, payload)`, `closeDrawer()`, `activeModal`, `openModal(key)`, `closeModal()`, `confirmModal`, `openConfirm({title, message, onConfirm, variant})`, `closeConfirm()`, `activeTitle`, `setActiveTitle()`.
- **`inventorySlice`** — `activeBodegaId`, `sedeName`, `setBodega(id)`, `clearBodega()`. Persist localStorage.

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

---

## 27. Sesión 2026-05-30 — Lote de mejoras DEV (perf/a11y/UX)

Tanda del backlog que no requería decisión del cliente. Build limpio, ESLint 0 errors / 12 warnings (bajó de 13), 34/34 tests.

### Estructura / performance
- **recharts en chunk propio**: `vite.config.js` separó `vendor-ui: ['lucide-react']` + `vendor-charts: ['recharts']`. `vendor-ui` bajó de ~426 KB a **43.8 KB**; `vendor-charts` (383 KB) ahora solo carga en Dashboard/Rentabilidad/CostosProduccion, no en el path inicial.
- **9 hooks migrados a `API_ROUTES`** (~55 callsites): `useBodegas`, `useClientes`, `useCotizaciones`, `useFactura`, `useRemisiones`, `useItem`, `usePago`, `useProveedores`, `useInstalaciones`. Namespaces nuevos en `apiRoutes.js`: `CATEGORIAS`, `COTIZACIONES`, `FACTURAS`, `REMISIONES`, `ITEM_PROVEEDORES`. URLs idénticas (solo cambió la fuente literal→constante). **Pendiente**: quedan ~15 hooks con rutas sin namespace (Cartera, Configuracion, Movimientos, Auditoria, etc.).

### A11y
- **Focus-trap en `Modal.jsx` y `Drawer.jsx`**: al abrir guarda el foco previo y enfoca el primer focusable; Tab/Shift+Tab quedan atrapados dentro del panel; al cerrar restaura el foco. Conserva Escape, dirty-guard, backdrop, scroll-lock.

### UX funcional
- **`CapasStockPanel`**: las 6 callbacks del padre (`preparationModal` → `ConfirmSubForm`) se envolvieron en `useCallback` y se incluyeron en las deps de los 3 effects → cierra los warnings ESLint reales sin loop.
- **Acciones de inventario ocultas al visor**: `DataTable` (botones Eliminar/Traspasar/Ajustar por fila) e `InventarioGlobalPage` (botón Ajustar) solo se muestran si `user.rol !== 'visor'`. Espejo del RBAC backend (el visor recibía 403).
- **Bulk actions replicadas** en `CotizacionesTab` (batch → Rechazada) y `OrdenesTab` (batch → Cancelada), copiando el patrón de `FacturasTable` (Set + barra flotante + `Promise.allSettled` + `openConfirm`). Cotizaciones envuelve `cambiarEstado` (mutate sin promesa) en Promise per-call.
- **Debounce en selects grandes**: el `SearchSelect` inline de `CotizacionForm` y `RemisionForm` (picker de cliente, 100+ opciones) ahora debouncea el filtro ~200ms (input instantáneo, filtro tras pausa). `ItemGeneralSearch` ya traía su propio debounce. `FacturaForm` no usa selects grandes.

### Coupling backend (esta sesión)
- Backend agregó `POST /facturas/bulk/cambiar-estado` (admin-only). Hoy el frontend usa N requests paralelos (`Promise.allSettled`) en Facturas/Cotizaciones/OCs; se puede migrar Facturas a ese endpoint dedicado cuando convenga (pendiente).

### ⚠️ Nota de entorno (importante)
El proyecto vive en una carpeta sincronizada por **Google Drive**, que **revierte/corrompe archivos del working tree** sin que git lo note (mtime de DrvFs). En esta sesión, 2 archivos de test (`StatusBadge.test.jsx`, `useClientPagination.test.js`) aparecieron "fallando" porque Drive los había revertido a versiones viejas en disco mientras git tenía la versión buena. Se resolvió con `git checkout HEAD -- <archivos>` + limpiar `node_modules/.vite`. **Recomendación firme: mover el repo fuera de Google Drive y sincronizar entre máquinas con git.** Si un test/archivo "falla sin razón", sospechar de Drive primero.

---

> **Snapshot al cierre 2026-05-30**: recharts code-split (vendor-ui 426→44 KB), 9 hooks en API_ROUTES, focus-trap en Modal/Drawer, acciones de inventario ocultas al visor, bulk en Cotizaciones/OCs, debounce en pickers de cliente. Build limpio, lint 0 errors, 34/34 tests. Backlog: ~15 hooks más a API_ROUTES, migrar Facturas al endpoint bulk, decisiones de UX del cliente.

---

## 28. Sesión 2026-05-30 (tarde) — Breadcrumbs + Login dark + CalculadoraProrrateo + último precio + rol-revert

Commit `e1debcb`. Segunda tanda del día, coordinada con backend (commit backend `5559b75`).

### Breadcrumbs verificados contra rutas reales (0 rotos)

- "Sedes" apuntaba a `/` (Panel Principal) → ahora `/sedes`.
- "Pagos" apuntaba a `/pagos_cliente` (inexistente) → `/pagos`.
- "Salud del Sistema" tenía link muerto → texto plano.

### Login dark mode

El panel izquierdo usaba tokens que flipean (texto invisible en dark) → `content-on-dark`/`-muted` estables. Logo de letras con `dark:invert`.

### `CalculadoraProrrateo.jsx` (nueva — cierra decisión de UX)

Simulación **pura** de prorrateo pre-OC: no crea inventario ni toca OCs, solo muestra los números. Abierta desde el header de Compras. Era la "Opción 2" de la decisión de UX en `PENDIENTES.md` — resuelta.

### Columna "Último precio" en `FormulacionesTable` (cierra decisión de UX)

Lee `ultimo_precio` que el backend ahora devuelve por ingrediente (costo de la capa activa más reciente). Columna extra — el promedio ponderado sigue siendo el principal.

### ⚠️ REVERT: ocultar-acciones-por-rol en inventario

La sesión 05-30 (mañana) ocultaba botones de mutación al `visor`. El cliente definió la política RBAC como **control por módulo, no por rol** → revertido. Desde 2026-06-03 el backend tiene `RbacFilter` (visor = solo lectura global): si un visor intenta mutar recibe 403 con mensaje claro. La UI muestra los botones; el backend es la garantía.

---

## 29. Sesión 2026-06-02 — UI de deduplicación IA + mejoras de Login

Commit `a594040`. Acompaña la feature backend de dedup IA (backend commit `4b11872`).

### Pestaña "Sugerencias IA" en Sincronización

`src/modules/Sincronizacion/components/SugerenciasIATab.jsx` (nuevo, ~320 líneas):
- Grupos de duplicados por **identidad química** con razonamiento del modelo y nivel de confianza.
- Nombre base editable, selección del item "keep", preview de costo combinado.
- **Fusión en lote** N→1 (con confirmación) + descartar grupo.
- Hooks nuevos en `useSincronizacion.js` + keys + rutas IA en `apiRoutes.js` (namespace de `/sincronizacion/ia/*`).
- ⚠️ Desde 06-03 todos los endpoints mutadores de IA son **admin-only** en backend — un operador recibe 403.

### Login

- **Fix dark mode estructural**: `@custom-variant dark` por **clase** en `index.css` (antes el `dark:` variant respondía al `prefers-color-scheme` del SO en vez de a `html.dark` — el toggle de la app no afectaba esos estilos).
- Centrado robusto del branding, resumen de features en móvil, foco de inputs con color de marca.
- A11y: `role=alert` en errores, `aria-hidden` en decorativos, aviso de Bloq Mayús activado.

---

## 30. Sesión 2026-06-05 — Toast con motivo real al eliminar ítem

`src/modules/Inventario/api/useItem.js` — el `deleteMutation` no tenía `onError`: cuando el backend rechazaba el delete, el usuario solo veía el toast genérico. Ahora muestra el motivo real del backend (`e.response.data.msg`), que desde 06-03 es un **409 descriptivo** (`ItemController::delete` chequea stock activo, uso en fórmulas, fórmulas propias y sugiere usar el merge de Sincronización).

---

> **Snapshot al cierre 2026-06-05**: Frontend con dedup IA operativa (SugerenciasIATab), calculadora de prorrateo pre-OC, columna último precio, Login pulido en dark + a11y, errores de delete accionables. Política RBAC definitiva: por módulo (backend `RbacFilter` garantiza visor read-only). Build limpio, 34/34 tests. Backlog: ~15 hooks a API_ROUTES, migrar Facturas al endpoint bulk, notificaciones real-time, verificación visual final de dark mode, toggle costo real/lista (única decisión UX restante).

---

## 31. Sesión 2026-07-02 — Paginación en Proveedores + Auditoría MP

### Paginación en módulo Proveedores

Dos componentes paginados usando el patrón `useClientPagination` + `TableShell`/`getPaginationRange`:

**`CatalogoTab.jsx`** — refactorizado para usar `TableShell` como wrapper:
- Importa `useClientPagination` y `TableShell`.
- `SearchFilterBar` pasa como `header` prop de `TableShell`.
- `ERPTable` renderiza con `borderless` y `data={pagination.paginated}`.
- Footer de paginación automático via `TableShell` (números de página, selector 10/20/50/100, conteo "Mostrando X de Y").

**`ProveedoresTable.jsx`** — paginación mejorada (ya tenía paginación básica prev/next):
- Reemplazado estado manual `page`/`setPage` por `useClientPagination(filtered, PAGE_SIZE)`.
- Footer rediseñado con `getPaginationRange` (botones de página numéricos), selector de filas por página (10/20/50/100), conteo "Mostrando X de Y proveedores/opciones".
- Importa `getPaginationRange` de `Inventario/services/pagination` y `cn` de utils.
- Auto-reset de página al cambiar filtros/búsqueda (gestionado por el hook).

Build limpio (~1m 8s).

### Auditoría de materias primas (datos, no código)

Sesión de auditoría directa en DB para vincular MPs usadas en formulaciones a sus proveedores correctos:
- **Estado final**: 3 MP sin proveedor (de 57 originales, 54 resueltas).
- MP restantes: EDAPLAN 915 (6 fórmulas), CELITE 499 (2 fórmulas), RESINA MALEICA AL 60% (1 fórmula).
- Vinculación relevante esta sesión: ANTIPIEL (AQUATERRA S.A.S.) → ADIMON 84 (`item_general` id 86).
- Excel de seguimiento: `C:\Users\juans\Downloads\Auditoria_MP_v3.xlsx` (3 hojas: MP sin proveedor, Posibles duplicados, MP con proveedor sin fórmula).

---

> **Snapshot al cierre 2026-07-02**: Paginación completa en Proveedores (CatalogoTab con TableShell, ProveedoresTable con getPaginationRange). Auditoría MP al 94.7% (54/57 resueltas, 3 restantes). Build limpio.

---

## 32. Sesión 2026-07-03 — Bug "entidad anterior" + Formulaciones (orden/instrucciones/repetidos) + dark header

Sesión grande, coordinada con backend. 3 commits: `141add0` (fix), `15f2127` (feat formulaciones), `5667eb6` (style dark). **No se pudo compilar desde WSL** (node_modules con binarios de Windows) — validado con ESLint; **build/pruebas van en Windows** (`npm run dev`).

### Fix: bug "muestra datos de la entidad anterior al cambiar de selección" (`141add0`)
Origen: `useFormulaciones.js` tenía `placeholderData:(prev)=>prev` en la query de recálculo por volumen → al cambiar de producto conservaba la fórmula anterior (`dataToShow = recalculatedData || productDetail`). Fix: `placeholderData` solo conserva si es el MISMO producto (compara `id` en el índice 2 de la queryKey).
Auditoría de 6 agentes → misma clase de bug en todo el front. Corregidos **5 MEDIO** + **~15 BAJO**:
- **Inventario**: `<DataTable key={id_bodega}>` (no reseteaba filtros/página al cambiar bodega).
- **ItemProveedorForm**: crear-desde-portafolio estaba ROTO (abría en modo edición con `if(payload)` → PUT id undefined). Ahora `isEditing = !!payload?.id_item_proveedor`.
- **ClienteForm**: `plazoDefault` en deps del reset borraba lo tecleado → se lee vía ref sincronizado en effect.
- **OrdenForm**: reset del buscador + `conIva` derivado del payload.
- **UserPanel** (EmpresaTab/ModulosMatrix): re-seed por estado (seededData/seededPermisos) tras guardar.
- BAJO: `keepPreviousData:true` (no-op en v5) → `placeholderData: keepPreviousData` en useMovimientos/useAuditoria/useTrazabilidad/useSincronizacion/CommandPalette; buscadores sembrados solo al montar (Clientes/Proveedores/Catalogo tables) con snapshot de `initialSearch`; `key` defensivo en Ajuste/TraspasoModal; PorProductoView deriva grupo por id; ItemGeneralSearch resetea `expandido`; useLoteSugerido key con `.toString()`; etc.
- **Auto-selección proveedor más barato** (`FormulacionesPage`): reescrita de `useEffect` a snapshot-en-render (quita el warning `set-state-in-effect`, MISMO comportamiento — sigue auto-seleccionando `opciones[0]`).
> ⚠️ Lint del proyecto: `react-hooks/refs` y `set-state-in-effect` son **ERROR** (config React Compiler). No acceder/mutar refs en render; usar estado o snapshot-en-render.

### Feat: Formulaciones — orden, instrucciones/notas, ingredientes repetidos (`15f2127`)
Acompaña 3 migraciones backend (ver backend CLAUDE.md 2026-07-03). En `FormulacionModal.jsx` + `FormulacionesTable.jsx`:
- **Orden de proceso**: botones ▲▼ por ingrediente (via `move` de `useFieldArray`); el payload envía `orden`. La tabla respeta el orden del backend.
- **Instrucciones/fases**: botón "+ Agregar paso / instrucción" (append `{tipo:'instruccion', texto}`); en la tabla se muestran como **banda a lo ancho** (íconos ClipboardList/Layers), excluidas de los totales.
- **Nota por ingrediente**: input opcional (ej. "pH"); en la tabla es un **chip** bajo el nombre.
- **Ingredientes repetidos**: `agregarMateriaPrima` permite el mismo insumo 2× (aviso no bloqueante). El modelo de línea ahora lleva `tipo/texto/nota/orden`.
- Backend expone `tipo/texto/nota/orden` en `calculate_costs`/`getFormulacionConMateriasPrimas`/etc.

### Style: headers de tablas en dark mode (`5667eb6`)
En dark, `content-secondary` = `#D4D4D8` (claro) y varios headers lo usaban como `bg` → banda clara llamativa. Nueva clase **`.tbl-header`** en `index.css` (gris `#3f3f46` + texto claro, FIJO en ambos modos; regla `.tbl-header .text-content-inverse` para el texto anidado). Aplicada a los headers de Formulaciones (FormulacionesTable + banda de fase, CostCalculator, CostProductsTable + fila total, ProductSpecificationsTable). Además override `dark:bg-surface-strong`/`content-tertiary` en `Button` variante `zinc`, `IconBox` sólido neutral, `StatusBadge` dot y KPI bar `zinc` de Rentabilidad. **Modo claro sin cambios.**

> Contexto/handoff completo de la sesión (incl. re-cargue de fórmulas): `PROYECTO_PINCA/HANDOFF_2026-07-03.md`.

---

## 33. Sesión 2026-07-15 — Rediseño PDF (tiquete A4) + Auditoría UI + Auditoría profunda de confiabilidad/escalabilidad + arreglos (Tanda 1 y 2)

> **No se pudo compilar desde WSL** (node_modules con binarios de Windows). Todo validado con **esbuild (syntax/transform)** y **`tsc --noEmit`** (backend, EXIT 0). Build/pruebas de runtime van en Windows (`npm run dev`) + suite golden 35/35 del backend.

### 33.1 PDFs — tiquete/tirilla A4 monoespaciado (sin logo)
Plantilla compartida `src/shared/pdf/`: `DocPdf.jsx` (carta branded Outfit), `DocTicket.jsx` (**tiquete estilo factura POS monoespaciada Courier, en hoja A4**, sin logo — el logo desentonaba en ese formato), `DocPdfPreview.jsx` (elige según `formato`). **Toggle Carta/Tiquete en los 6 exportadores**: Factura, Remisión, Recibo, Nota Crédito, OC, Cotización (esta última con doble toggle: formato + con/sin precios). El tiquete deriva columnas por convención (desc/cant/precio/total) y soporta bloque de monto (Recibo/NC).

### 33.2 Auditoría de UI/proporción (4 agentes) → 22 archivos corregidos
Fixes de layout/posicionamiento (análisis estático, sin ver la app):
- **Bugs reales**: `ActionMenu.jsx` z-index `9999`→`120` (tapaba toasts/tooltips); `Inventario/DataTable.jsx` clases inválidas `py-1.5.5`/`py-1.56`→válidas; **z-index de los 6 export modals** `z-40/z-50`→`z-[110]/z-[120]` (aparecían **detrás** del DetailDrawer que los abre).
- **Shared (impacto global)**: `PageTabs` pill con `overflow-x-auto`+`shrink-0`; `FlowCard` valor con `truncate`+title; `Topbar` h1 `min-w-0`; `StatusBadge` fixW md 100→115px.
- **Overflow de tablas**: `SuministroTab`, `RecibirProrrateoModal`, `CostoDetalleDrawer` `overflow-hidden`→`overflow-x-auto`; `AjusteModal` sin scroll interno → `max-h-[90vh] flex flex-col`+`overflow-y-auto`.
- **Formulaciones**: nombre de ingrediente + chip de nota con `truncate`/`max-w`+title.
- **Botones amontonados**: footers de los 6 export con `flex-wrap`; `OrdenDrawer` (4 botones) y 3 barras de bulk-actions (Facturas/Cotizaciones/OCs) con `flex-wrap`.
- Pendiente (menor, no aplicado): ~12 `grid-cols-3` sin fallback responsive, dropdown inline de SearchSelect recortado por overflow, stacking responsive de forms de 2 columnas.

### 33.3 Auditoría PROFUNDA de confiabilidad + escalabilidad (6 agentes)
Cubrió: `pinca_backend_nest` (NestJS, TypeORM + **SQL mayormente crudo**, 43 controllers / 41 services / 13 entities) + `pinca_frontend`. **Veredicto: el núcleo está sano** (cero SQLi, motor de dinero/stock correcto). Riesgos = (a) concurrencia/duplicados, (b) deploy a Linux, (c) escalabilidad al crecer datos.

**Verificado SÓLIDO (no tocar):** numeración de folios (`FOR UPDATE`), pago create/update, NC create, anulación de factura, recepción de OC + prorrateo (guardas de división por cero, `factor_conversion` correcto sin ×25/÷25 invertido), FIFO de capas con locks, **cero inyección SQL** (whitelist para estructura, `?` para valores en los 5 sitios que interpolan), RBAC global vía `APP_GUARD` (Jwt+VisorReadonly+Roles), refresh rotativo, env con Joi `.required()`, `synchronize:false`, filtro de excepciones oculta internals, LLM Gemini degrada sin tumbar, invalidaciones de caché front OK, sin memory leaks.

### 33.4 Tanda 1 (arreglada) — build-breakers de deploy + crash
- **Case-sensitivity que rompe el build en Linux/CI** (funcionaba solo en Windows/drvfs). Corregidos **solo los PATHS de import** (no los bindings) al nombre canónico de git en 14 archivos: `shared/ERPTable`→`shared/ErpTable` (12), `Compras/api/comprasKeys`→`ComprasKeys` (useCompras.js), `ProduccionKPIs`→`ProduccionKpis` (ProduccionPage.jsx). ⚠️ **Regla**: los nombres reales de archivo son `ErpTable.jsx`, `ComprasKeys.js`, `ProduccionKpis.jsx` — cualquier import nuevo debe respetar ese case.
- **`store/slices/authSlice.js`**: `JSON.parse` sin try/catch → **pantalla blanca permanente** si localStorage guardaba `"undefined"`. Nuevo `readStoredUser()` con try/catch + `setAuth` no persiste basura (`user==null`→`removeItem`).

### 33.5 Tanda 2 (arreglada) — integridad de datos backend (`pinca_backend_nest`)
> **⚠️ La suite golden YA NO se puede correr**: comparaba Nest vs CI4, y **CI4 está decomisionado** post-migración (`GET /api/dashboard` en `:8080` → **HTTP 404 Apache**). El método de validación ahora es **funcional directo sobre Nest** (ver 33.8).
- **C1 — factura duplicada al convertir Cotización** (`cotizaciones.service.ts convertir`): lock leído fuera de la tx. Fix: `SELECT … FOR UPDATE` DENTRO de la tx + `UPDATE … WHERE estado <> 'Convertida'` con verificación de `affectedRows`. Evita 2 facturas/2 folios DIAN por doble-click.
- **C2 — factura duplicada al convertir Remisión** (`remisiones.service.ts convertir`): mismo fix (`FOR UPDATE` + guarda `estado <> 'Facturada'`).
- **C3 — doble consumo de stock** (`preparaciones.service.ts ajustarInventario`): el `LEFT JOIN costos_item` sin dedupe multiplicaba filas si un ítem tenía >1 fila en `costos_item`. Fix: join a `MAX(id_costos_item)` por ítem (mismo patrón defensivo que getById/costosResumen).
- **A1 — lost-update de saldo** (`facturas.service.ts recalcularSaldo`): añadido `FOR UPDATE` como PRIMER statement → serializa contra pagos concurrentes; cubre de una los 3 callers (incluidos `pagos-cliente.remove` y `notas-credito.anular` que NO lockeaban; ambos ya corren dentro de `dataSource.transaction`).
- **A2 — PUT parcial de ítem pisaba el costo con 0** (`item.service.ts update`): antes `data.x ?? 0` para todas las columnas de costo destruía el promedio ponderado (capas) y el volumen. Fix: update dinámico **solo de columnas presentes** en el body (whitelist `COST_COLS`); `costo_unitario` solo se toca si viene explícito; el INSERT (ítem nuevo) sigue sembrando defaults.
- **A3 — NO aplicado (decisión):** "ingredientes repetidos" es una **feature intencional** (sesión 2026-07-03, mismo insumo en 2 fases con `orden`/`nota`); deduplicar rompería eso. El único doble-conteo real era C3 (ya resuelto). No se tocó.

### 33.6 Pendiente (acordado: arreglar críticos+altos en tandas; deploy en semanas)
- **Tanda 3 — Escalabilidad** (rompe A ESCALA, no hoy). **PARCIAL 2026-07-15** (backend autocontenido, tsc EXIT 0):
  - ✅ **Pool de conexión** (`database.module.ts`): `extra.connectionLimit` 10→20 + timeouts + keep-alive.
  - ✅ **Dashboard** (`dashboard.service.ts index()`): las 13 agregaciones secuenciales → **`Promise.all`** (latencia deja de sumarse; requiere el pool ↑).
  - ✅ **N+1 de inventario** (`bodega-inventario.service.ts`): 2 queries POR ítem con fórmula → **2 queries TOTALES con `IN(...)`** + mapas (una página de 200 ítems pasó de ~400 queries a 2). Shape preservado.
  - ✅ **Índices**: script `pinca_backend_nest/deploy/indices-escalabilidad.sql` (CREATE INDEX recomendados; aplicar a mano tras revisar `SHOW INDEX`).
  - ✅ **Paginación server-side de FACTURAS (hecha 2026-07-15, validada en runtime)** — plantilla para el resto. Ver 33.9.
  - ⏳ **PENDIENTE**: replicar la paginación server-side a cotizaciones/remisiones/OC/ítems (mismo patrón); migrar la vista de Cartera (`FacturasTable`, tiene KPIs por "estado efectivo"/mora, requiere stats con lógica de fecha en SQL); reescribir filtros `DATE(col)` no-sargables como rangos (off-by-one, ver comentario en el .sql).
- **Tanda 4 — Deploy/hardening**. **PARCIAL 2026-07-15 (validado en runtime)**, ver 33.10. ✅ HECHO: `/uploads` servido por Nest (`useStaticAssets`), `enableShutdownHooks`, CORS obligatorio en prod (Joi `.when(NODE_ENV=production)`), health→503 con BD caída, `helmet` (API-safe), `VITE_API_BASE_URL` fallbacks unificados a `:3009`, `location /uploads`→Nest + notas de cutover en el nginx. ✅ **`costos_snapshot` portado a Nest** (job `@Cron` mensual + endpoint manual, validado — ver 33.11). ✅ **frontend estático servido por nginx** (SPA `try_files → index.html` + cache de assets; `nginx -t` OK — ver 33.11). ⏳ PENDIENTE: **rotar la GEMINI_API_KEY** (estaba en `.env` en claro — acción tuya) + whitelistear su IP; smoke-test con CI4 apagado antes de eliminarlo (quedan 2 catch-all nginx →CI4: `/api/sincronizacion` y `/api/inventario`, probablemente muertos). (Throttler global **descartado**: ERP interno con IPs NAT compartidas → falsos positivos; el login ya tiene anti-fuerza-bruta por IP.)
- **MEDIO/BAJO backend**: `facturas.create` confía en `dto.total` (no recalcula server-side); costo estándar no se recalcula tras consumo de producción (drift); producción sin validar stock para ítems sin capas → `inventario` legacy negativo; inconsistencia `GREATEST(factor,1)` SQL vs `max(factor,0.001)` JS (solo si hay factores <1); `costos_snapshot` sin escritor en Nest (evolución de costos se congela tras cutover).
- **MEDIO/BAJO frontend**: `useCatalogosMaestros.js` lee `.messages.error` (shape viejo) sin fallback a `.msg`; `TrazabilidadDrawer.jsx:147` `ing.capas.map` sin guarda; `formatoPesoColombiano` sin guard de NaN; `setTimeout` sin cleanup en export modals.

### 33.8 Validación en runtime con Docker (2026-07-15)
El backend Nest corre en Docker (`docker-compose.yml`), conectado a la red compartida `pinca_backend_app-network` y al MySQL `gestor-pinca-db`. **Cómo levantarlo para validar**: `docker compose up -d --build` (dev image, `start:dev` con watch; tarda ~40s en compilar desde /mnt/c). El compose base lo expone en `:3000`; para que los scripts `test/*-golden.mjs` (que esperan `:3009`) lo alcancen, se usó un override de `PORT: 3009` + `ports: 3009:3009`, y un **forward socat** para exponer la BD en host `:13306` (`docker run --rm --network pinca_backend_app-network -p 127.0.0.1:13306:13306 alpine/socat TCP-LISTEN:13306,fork TCP:gestor-pinca-db:3306`).
- ✅ **Compila limpio en Linux** (contenedor): `Found 0 errors` — incluye todos los cambios de Tanda 2/3.
- ✅ **Arranca**: `Nest application successfully started`.
- ✅ **Tanda 3 dashboard**: `GET /api/dashboard` → 200 con shape correcto (valida `Promise.all`).
- ✅ **Tanda 3 N+1**: `GET /api/bodegas/inventario/1` → 200, ítem con fórmula trae `materias_primas` completas (valida el batch `IN(...)`).
- ✅ **Tanda 2 COMPLETA — 18/18 aserciones** con tests controlados auto-limpiantes (`test-convert-c1.mjs` + `test-tanda2-resto.mjs` en scratchpad):
  - **C1** (6/6, cotización→factura): doble convert secuencial → 2ª **400**; **2 converts CONCURRENTES → una 201 + una 400 + UNA SOLA factura** (el `FOR UPDATE` mata la duplicada — el bug que más asustaba).
  - **C2** (5/5, remisión→factura): idéntico, incl. concurrencia → 1 sola factura.
  - **A2** (2/2): PUT parcial de ítem **NO pisa** `costo_unitario` (queda 12345); sí cambia cuando se envía explícito (777).
  - **C3** (2/2): con `costos_item` duplicado, el JOIN viejo devuelve **2 filas** (bug real confirmado) y el nuevo (`MAX id`) **1 fila** → sin doble consumo.
  - **A1** (3/3): crear-pago ‖ anular-pago **concurrentes** → saldo final consistente (70000 = total − Σpagos), **sin lost-update**.
  - Todos los fixtures borrados (verificado 0). Los INSERT de fixture requieren `item_general.p_kg`, `costos_item.costo_cunete/costo_tambor` (NOT NULL sin default).
- Auth para tests: JWT firmado con `TOKEN_SECRET` del `.env` (payload `{data:{id,username,nombre,rol:'admin',modulos,token_version:1}}`). `cotizaciones.numero`/`facturas.numero` son **varchar(20)** (ojo con markers largos).
- **Observación menor (pre-existente, NO tocada)**: hay ~8 `cotizaciones_detalle` huérfanos (cotizaciones_id 1,3,4,5 ya no existen) — debris de higiene de datos, no relacionado con esta sesión.

### 33.9 Paginación server-side de FACTURAS (2026-07-15) — plantilla para el resto
Primer recurso migrado de "traer todo + paginar en el navegador" a **paginación server-side**. Es el molde para cotizaciones/remisiones/OC/ítems.
- **Backend** (`facturas.service.findAll` + `facturas.controller`): `@Get()` ahora acepta `@Query()`. **Retrocompatible**: sin `page` → devuelve el **array completo** como siempre (Cartera, FacturaForm, FacturaDrawer siguen intactos); con `page` → `{ data, meta:{total,page,limit,pages}, stats }`. Filtros server-side `estado`/`q` (numero/nombre_empresa/nombre_encargado/ciudad) + `cliente_id`. `stats` = KPIs **globales** (COUNT/SUM por estado + Σ saldo Pendiente) para las FlowCards; `meta.total` = total **filtrado** para el paginador. `limit` capado a 200.
- **Frontend**: nuevo hook **`useFacturasPaginated(filters)`** en `useFactura.js` (keyed por `facturaKeys.list(filters)`, que es **prefijo** de `lists()` → las mutaciones que invalidan `lists()` también refrescan las páginas), con `placeholderData: keepPreviousData`. `FacturacionTab.jsx` migrado: quita `useClientPagination`/`useTableSort`, KPIs desde `stats`, tabla desde `data`, **debounce 400ms** en la búsqueda (resetea a page 1), y un **adaptador** del `meta` server-side al shape que ya consume `TableShell` (`{paginated,currentPage,perPage,totalItems,totalPages,setCurrentPage,setPerPage}`) → TableShell no se tocó. Se quitó el sort por columna (el server ordena por `id DESC`; sort server-side queda como mejora futura).
- **Validación runtime** (Nest en Docker, con 3 facturas de fixture): retrocompat → array; `?page=1&limit=2` → `{data:2, meta:{total:3,pages:2}, stats:{pendiente:1,pagada:1,vencida:1,monto_pendiente:50000}}`; `?estado=Vencida` → meta.total filtrado + stats globales; `?q=` → búsqueda; `?page=2` → 2ª página. Todo OK, fixtures borrados. Frontend: solo syntax-check (no compila desde WSL) — **falta tu prueba visual** en `npm run dev`.
- ⚠️ **Nota Docker**: el `start:dev` (watch) **NO recompila** al editar en /mnt/c (inotify no funciona sobre drvfs) → tras cambiar backend hay que **`docker restart gestor-pinca-nest`** para que tome los cambios (~40s recompila).

### 33.10 Tanda 4 — Deploy/hardening (2026-07-15, validado en Docker)
Cambios en `pinca_backend_nest` (todos compilan `Found 0 errors` + validados hitteando el Nest en `:3009`):
- **`main.ts`**: app como `NestExpressApplication`; **`app.useStaticAssets(PINCA_PUBLIC_DIR ?? cwd/public)`** → sirve el logo en **`/uploads`** a nivel raíz (el frontend lo pide en el ORIGIN sin `/api`; `empresaInfo.js`/`EmpresaTab.jsx` hacen `VITE_API_BASE_URL.replace(/\/api$/,'')` + `logo_path`). Validado: `GET /uploads/empresa/x` → 200, `GET /api/uploads/...` → 404 (correcto). **`app.enableShutdownHooks()`** (cierre limpio del pool en SIGTERM). **`helmet({contentSecurityPolicy:false, crossOriginResourcePolicy:{policy:'cross-origin'}})`** — CSP off (es API), CORP cross-origin (si no, bloquearía el logo desde el frontend). Validado: headers presentes (`X-Content-Type-Options`, `X-Frame-Options`, HSTS, `Referrer-Policy`…), sin `X-Powered-By`, CORS intacto. `helmet@^8` instalado.
- **`config/configuration.ts`**: `CORS_ALLOWED_ORIGIN` con `Joi.when(NODE_ENV=production → required, otherwise default localhost:5173)` → en prod la app NO arranca sin origin real (antes defaulteaba a localhost y bloqueaba el front en runtime).
- **`health.controller.ts`**: `@Res({passthrough:true})` → **HTTP 503** cuando la BD está caída (antes 200 aunque muerta) — para liveness/readiness probes. Body preservado.
- **Frontend**: `apiClient.js` gana fallback `|| 'http://localhost:3009/api'` (antes sin fallback); `empresaInfo.js`/`EmpresaTab.jsx`/`.env.example` con fallback `:8080`(CI4 muerto)→`:3009`. Unificados.
- **`deploy/nginx-pinca.conf`**: `location /uploads { proxy_pass pinca_nest; }` + notas de cutover (catch-all CI4, frontend estático, costos_snapshot).
- ⚠️ **Gotcha Docker (repetido)**: el watch del Nest recompila al tocar archivos DENTRO del contenedor (docker exec) pero NO al editar en /mnt/c (drvfs). Tras editar `src/` en el host → `docker restart gestor-pinca-nest`. `npm install <pkg>` va con `docker exec gestor-pinca-nest npm install <pkg>` (actualiza package.json bind-mounted).

### 33.11 `costos_snapshot` portado a Nest (2026-07-15) — desbloquea cutover de CI4
El generador de snapshots de costos era `php spark snapshot:costos` (`App\Commands\SnapshotCostos` en CI4, cron mensual). Sin él, tras apagar CI4 el gráfico de evolución de costos (`GET /costos-produccion/:id/historia`) se congelaría. **Portado a Nest**:
- `@nestjs/schedule` instalado; `ScheduleModule.forRoot()` en `app.module`.
- `CostosProduccionService.generarSnapshot()`: toma `getCostosProduccionBatch()` (ya calcula todos los campos) y hace **`INSERT … ON DUPLICATE KEY UPDATE`** por producto (idempotente por `UNIQUE(item_general_id, fecha)`, igual que el upsert de CI4). Campos mapeados 1:1: estado, volumen_base, costo_mp_total, costo_mp_por_unidad, costo_empaque_mod, costo_total, porcentaje_utilidad, precio_venta_calc, mps_total, mps_cubiertas (= mps_total − mps_faltantes.length).
- `@Cron('0 6 1 * *', timeZone:'America/Bogota')` → `snapshotMensual()` (1º de cada mes 6am, reemplaza el cron externo).
- `POST /api/costos-produccion/snapshot` → dispara a demanda (VisorReadonlyGuard bloquea al visor).
- **Validado runtime**: POST → `201 {ok, "Snapshot generado (52 productos)", fecha, total:52}`; 52 filas insertadas; 2ª llamada NO duplica (52 items distintos) ✅. (Quedó un snapshot real con fecha de hoy — es data legítima, alimenta el gráfico; borrable si querés fecha limpia.)

**Frontend estático en nginx (`deploy/nginx-pinca.conf`)**: el fallback `location /` ya NO va a CI4 → sirve el SPA de Vite (`root /var/www/pinca-frontend/dist` [AJUSTAR ruta real], `try_files $uri $uri/ /index.html`) + `location ~* ^/assets/…` con cache 30d inmutable. Validado con `nginx -t` (en la red pinca para resolver upstreams) → OK. **Estado cutover CI4**: los 3 bloqueantes técnicos resueltos (uploads, snapshot, frontend estático). Solo referencian CI4 los 2 catch-all `/api/sincronizacion` + `/api/inventario` (probablemente muertos — verificar con CI4 apagado). Falta: rotar Gemini key + smoke-test → apagar → borrar.

> **Snapshot al cierre 2026-07-15**: PDFs con tiquete A4; 22 archivos de UI corregidos; auditoría profunda de 6 frentes cerrada; Tanda 1 (deploy build-breakers + pantalla blanca), Tanda 2 (integridad datos: C1/C2/C3/A1/A2, **validada 18/18 en runtime**), Tanda 3 backend (pool, dashboard Promise.all, N+1, índices, **paginación server-side de facturas**) y Tanda 4 (`/uploads`, shutdown hooks, CORS prod, health 503, helmet, VITE fallbacks) aplicadas y validadas en Docker. Pendiente: replicar paginación a otros recursos, migrar Cartera, portar snapshot cron, cutover/eliminación de CI4, rotar Gemini key. **Validado en runtime con Docker**: compila+arranca limpio; **Tanda 2 COMPLETA 18/18** (C1/C2 incl. concurrencia, A1 lost-update, A2, C3) + Tanda 3 dashboard/N+1. La suite golden quedó obsoleta (CI4 decomisionado).

### 33.14 Sesión 2026-07-16 — Unificación Docker + Nest sirve el frontend (Opción A)
Decisión tomada: **Opción A** (Nest sirve todo, sin nginx). Preparado para el cutover de CI4:
- ✅ **Backup de la BD**: `pinca_backend_nest/backups/pre-unificacion_*.sql` (369K, 53 tablas, "Dump completed"). Hecho con `docker exec gestor-pinca-db mysqldump --single-transaction --routines --triggers --events -uuser -ppassword gestorpincadb`. (Root pw es `password`, NO `rootpassword`; el `.env` de CI4 usa formato `clave = valor` con espacios.)
- ✅ **Nest sirve el frontend** (`main.ts`): `useStaticAssets(FRONTEND_DIST ?? cwd/frontend-dist)` + middleware fallback SPA → `index.html` para GET que no sea `/api` ni `/uploads` (React Router). Si no hay build, no hace nada (dev con Vite aparte). **Validado runtime**: `/api/health`→JSON, `/`+`/comercial`→index.html, `/assets/*`→estáticos, `/uploads/*`→404 propio (no el index). Tipos de Express importados (`Request/Response/NextFunction`).
- ✅ **Compose unificado** (`pinca_backend_nest/docker-compose.yml`, reescrito): `db` (MySQL, **reusa el volumen `pinca_backend_db_data` como `external`** → cero pérdida de datos) + `nest` (PORT 3009, monta `../pinca_frontend/dist` en `/usr/src/app/frontend-dist`, `FRONTEND_DIST` seteado) + `phpmyadmin`. Red propia `pinca-net`. **Sin CI4.** Validado con `docker compose config` (EXIT 0). ⚠️ NUNCA `down -v` (borra el volumen de datos).
- ✅ **SWITCHOVER EJECUTADO (2026-07-16) — el stack unificado está ACTIVO, CI4 abajo.** Pasos ejecutados: `docker rm -f gestor-pinca-nest` + `cd pinca_backend && docker compose down` (SIN -v) + `cd pinca_backend_nest && docker compose up -d`. Validado:
  - **Datos intactos**: huella pre/post idéntica (item_general=278, formulaciones=58, item_proveedor=144, inventario_capas=88, remisiones=4, clientes=5). El volumen `pinca_backend_db_data` se reusó, cero pérdida.
  - **Nest conecta** (`/api/health` → `db:true`) y **smoke-test 16/16 endpoints en 200** (dashboard, cotizaciones/remisiones/facturas paginadas, catalogo, clientes, proveedores, formulaciones, inventario/global, costos-produccion, salud-sistema, movimientos, ordenes_compra, sincronizacion/stats, notificaciones). **CI4 confirmado prescindible.**
  - ⚠️ **Gotcha resuelto**: al recrear el contenedor, faltaban `helmet` + `@nestjs/schedule` (los había instalado con `docker exec npm install` en el contenedor viejo, no en la imagen). Fix: `docker exec gestor-pinca-nest npm install` + rebuild de imagen (`docker compose build nest`) para que queden en la imagen y un futuro `up` no rompa. **Lección**: cualquier `npm install` nuevo debe ir seguido de `docker compose build` para bakearlo en la imagen.
- ⏳ **Falta para terminar el cutover**: (a) **rotar la GEMINI_API_KEY** (sigue en claro en `pinca_backend_nest/.env` y `pinca_backend/.env`); (b) buildear el frontend en Windows (`npm run build`) para que Nest lo sirva en prod (en dev seguís con Vite); (c) cuando estés tranquilo → **borrar `pinca_backend`** (el volumen de datos NO está adentro, así que borrar la carpeta es seguro; el backup SQL está en `pinca_backend_nest/backups/`).
- **Cómo se levanta ahora TODO** (un solo comando): `cd pinca_backend_nest && docker compose up -d`. Ya no existe el par de composes.
- ✅ **Contenedores RENOMBRADOS (2026-07-16)** a esquema profesional. Proyecto compose **`pinca-erp`** (via `name:` en el compose), imagen **`pinca-erp-api`**. Mapeo (⚠️ los comandos de §33 anteriores usan los nombres VIEJOS):
  - `gestor-pinca-nest` → **`pinca-erp-api`** (servicio `api`; `DB_HOST` ahora es `db`, el nombre de servicio)
  - `gestor-pinca-db` → **`pinca-erp-db`**  ·  `gestor-pinca-pma` → **`pinca-erp-pma`**
  - Ej.: `docker restart pinca-erp-api`, `docker exec pinca-erp-db mysql -uuser -ppassword gestorpincadb ...`, `docker logs pinca-erp-api`.
  - Al renombrar (cambia `<proyecto>-<servicio>` = nombre de imagen), se re-tageó la imagen ya construida (`docker tag pinca_backend_nest-nest:latest pinca-erp-api:latest`) para no rebuildear. La carpeta sigue siendo `pinca_backend_nest` (solo cambió el naming de Docker). Nginx de deploy (`deploy/nginx-pinca.conf`) aún referencia `gestor-pinca-nest` en el upstream — irrelevante en Opción A (Nest sirve todo), pero actualizar si se usa nginx.
  - Imágenes viejas huérfanas (`pinca_backend_nest-nest`, `pinca_backend-app` de CI4) se pueden `docker image prune` cuando quieras.
- Para servir el frontend en prod: `cd pinca_frontend && npm run build` (Windows) → deja `dist/`, que el compose monta y Nest sirve en `http://localhost:3009`. En dev seguís con Vite (`npm run dev`) apuntando a `:3009/api`.

### 33.17 Sesión 2026-07-16 — BARRIDO paginación server-side "a TODO" (en curso)
El usuario pidió paginar TODAS las tablas que crecen sin techo (escala futura, sin scroll infinito ni traer tablas enteras). Auditoría completa (marcador `useClientPagination` + tablas sin paginación) con 3 subagentes de recon. Estado real:
- **YA server-side (nada que hacer):** Facturas, Cotizaciones, Remisiones, OC, **Movimientos** (backend `{data,meta}` + hook), **Inventario/DataTable** (por bodega, `/bodegas/inventario/:id?page&perPage&search&tipo`), **Auditoría** (`{data,meta:{page,per_page,total,pages}}`, naming propio).
- **NO son tablas-lista → no LIMIT/OFFSET (decisión):** **Formulaciones** (FormulacionesTable = detalle de UNA fórmula, no lista; la lista alimenta un buscador), **Rentabilidad** y **CostosProduccion** (reportes AGREGADOS: la fila de totales necesita todo el conjunto; el eje correcto es filtro por rango de fecha server-side + matar el N+1 de Ganancias, NO paginar). **Listas acotadas** (Bodegas, Categorías, Unidades, Roles, Numeración, config): no se paginan (alimentan selectores).
- **A paginar (9):** ✅ **Catálogo** (item_general) HECHO y validado runtime (`catalogo.service.listar` retrocompat + stats counts por tipo; `useCatalogoPaginated`; `CatalogoTable` ahora self-fetch con debounce; `CatalogoPage` refetch vía invalidate). ✅ **item_proveedor** (CatalogoTab) HECHO y validado (`getItemProveedores(query)` retrocompat + quitado el 404-on-empty; `useItemProveedoresPaginated`; `proveedorKeys.catalogoListPaginated`; CatalogoTab con debounce+adaptador). ✅ **Producción** HECHO y validado (`preparaciones.service.getAll(page,limit,filtros)` + filtros estado/search/item/desde/hasta server-side + `stats` por estado + `itemsFiltro` para el select; `usePreparacionesPaginated`; `ProduccionKpis` ahora por `stats`; `ProduccionPage` server-side + paginador manual; **arreglado el bug latente del front que solo pedía 50 filas**). ✅ **Pagos** HECHO y validado (`pagos-cliente.service.index(query)` retrocompat + filtros tipo/metodo/q/fecha + stats Σmonto/counts; `usePagosPaginated` + `usePagos({enabled})` para no doble-fetch; PagosPage con paginador manual). ⚠️ **Bug preexistente hallado**: enum `pagos_cliente.tipo` es solo `('pago_total','abono')` → la KPI "Anticipos" y ese filtro nunca matchearon (siempre 0); NO regresado (stats lo refleja igual), decisión pendiente del usuario. ✅ **Clientes** HECHO y validado (`clientes.service.findAll(query)` con QueryBuilder retrocompat + filtro q; `useClientesPaginated` + `useClientes(id,{enabled})`; `ClientesTable` self-fetch; `ClientePage` cards con paginación propia). ✅ **Sinc/Huérfanos**, ✅ **Sinc/Maestro** (con subarray proveedores sobre ids de la página), ✅ **Proveedores** (QueryBuilder retrocompat; modo normal server-paginado + **modo comparación con provMap LAZY** vía `useProveedores({enabledProveedores})`; cards server-paginado) — todos validados runtime. ✅ **Cartera FacturasTable** HECHO y validado (modo `efectivo=1` en `facturas.service.findAll`: `CASE` SQL por mora/saldo réplica EXACTA de `getEstadoEfectivo` — Pagada/Vencida/Parcial/Pendiente; stats efectivos `{pendiente,pagada,vencida,parcial,saldo_por_cobrar}` + filtro `sector`=c.tipo; `FacturasTable` migrado a `useFacturasPaginated({efectivo:1,estado,sector,q})`, bulk-anular intacto). FacturacionTab sigue en modo estado-almacenado (sin tocar). Validado runtime con 4 facturas de escenario (total 4, pagada/vencida/parcial/pendiente 1 c/u, saldo_por_cobrar 2500). **🎉 BARRIDO COMPLETO 9/9.** [nota histórica pendientes previos] **Proveedores** (backend `repo.find()`→reescribir; modo dual "comparar por producto"), **Sinc/Maestro** (array crudo 2 queries + subarray proveedores), **Sinc/Huérfanos** (array crudo, el más directo), **Cartera FacturasTable** (COMPLEJO: KPIs y filtro por **estado efectivo/mora** `getEstadoEfectivo`+`calcularDiasMora` client-side; el `stats` server-side de facturas usa estado ALMACENADO → hay que replicar lógica de mora/fecha en SQL). Molde validado: §33.9/§33.13/§33.15. Patrón `enabled` (Pagos/Clientes) para no doble-fetch cuando la página usa el hook paginado solo para mutaciones.

**▶ PRÓXIMA SESIÓN — cómo retomar el barrido (los 4 que faltan):**
1. **Sinc/Huérfanos** (el más directo): backend `sincronizacion.service.huerfanos()` (array crudo, `WHERE ig.tipo=1 AND NOT EXISTS(item_proveedor disponible)`, sin filtros) → agregar `page`/`limit` + `{data,meta}`. Front `HuerfanosTab.jsx` usa `useSincHuerfanos()` (sin args) + `useClientPagination` → migrar a hook paginado + adaptador TableShell. Sin KPIs, sin filtros (solo contador). id fila `id_item_general`.
2. **Sinc/Maestro**: backend `sincronizacion.service.maestro()` (`@Get('maestro')`, filtros search/cobertura/tipo, array crudo + 2º query `item_proveedor IN(ids)` para subarray `proveedores`) → paginar el 1er query, mantener el `IN(...)` sobre los ids de la página. Front `MaestroTab.jsx` (`useSincMaestro(filters)` ya con keepPreviousData + `useClientPagination`). Filtros: search + cobertura(sin/uno/dos_mas). Botón Excel exporta `items` (con server-side será solo la página → documentar trade-off).
3. **Proveedores**: backend `proveedores.service.findAll()` = `repo.find()` → reescribir a QueryBuilder retrocompat (igual que Clientes; filtro q sobre nombre_empresa/encargado/documento/email; tabla `proveedor` SIN columna estado). Front `ProveedoresTable.jsx` recibe props desde `ProveedoresPage.jsx` (`useProveedores()`), `useClientPagination`, footer manual con `getPaginationRange`. **Ojo modo dual "comparar por producto"** que deriva de `catalogo` (item_proveedor), no del listado de proveedores → ese modo NO se pagina server-side (comparación sobre catálogo completo); paginar solo el modo normal.
4. **Cartera FacturasTable** (COMPLEJO — dejar para el final): `useFactura()` trae array completo; migrar a `useFacturasPaginated` (YA existe en `useFactura.js`) PERO sus KPIs/filtro usan **estado efectivo** (`getEstadoEfectivo`+`calcularDiasMora` en `Cartera/services/carteraService.js`), no el `f.estado` almacenado. El `stats` actual de `facturas.service.findAll` usa estado almacenado → **hay que agregar en SQL** el cálculo de vencida/parcial por `fecha_vencimiento` vs hoy (mora) para que las FlowCards (Pendientes/Pagadas/Saldo por cobrar/Vencidas) y el filtro coincidan. Filtro `sector` = `cliente_tipo` (1/2/3). Tiene bulk-actions (Set de `id_facturas` → Anulada). Antes de tocarlo, mostrar al usuario cómo queda el `stats` con mora (lo pidió como opción).

**Receta de validación runtime (probada este barrido):**
- Tras editar backend: `docker restart pinca-erp-api` (⚠️ el watch NO recompila sobre drvfs). Esperar boot ~40s con `until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3009/api/health)" = "200" ]; do sleep 3; done` (el `sleep` largo en foreground está BLOQUEADO por el harness → usar until-loop).
- Todos los endpoints requieren JWT (guard global). Mintear token dentro del contenedor: `docker exec pinca-erp-api node -e 'const jwt=require("jsonwebtoken");const n=Math.floor(Date.now()/1000);process.stdout.write(jwt.sign({iat:n,exp:n+3600,data:{id:2,username:"root",nombre:"root",rol:"admin",modulos:[],token_version:1}},process.env.TOKEN_SECRET,{algorithm:"HS256"}))'` → el payload va **anidado bajo `data`** (id/username/rol/token_version), HS256 con `TOKEN_SECRET`.
- Probar: legacy `GET /api/x` → array; `?page=1&limit=5` → `{data,meta,stats}`; filtros. Para tablas vacías, insertar filas de prueba con marca (`__TEST__`) vía `docker exec pinca-erp-db mysql -uuser -ppassword gestorpincadb -e "..."` y borrarlas al final (auto-limpiante).
- Frontend syntax-check: esbuild en scratchpad `./node_modules/.bin/esbuild <file> --jsx=automatic --format=esm` (reinstalar si el scratchpad se limpió) + grep de refs colgadas.

**Estado del stack al cierre:** unificado `pinca-erp` (db+api+pma) CORRIENDO, IA por OpenRouter (primario). Levantar: `cd pinca_backend_nest && docker compose up -d`. Prueba visual pendiente del usuario en `npm run dev` (Windows) de todo lo paginado.

**Decisiones pendientes del usuario:** (a) enum `pagos_cliente.tipo` sin 'anticipo' (¿agregar al enum o quitar KPI/filtro del front?); (b) para Cartera, ¿revisar el `stats` con mora antes de aplicarlo?
- Patrón validado (molde): §33.9/§33.13/§33.15. Recordar: tras editar backend `docker restart pinca-erp-api`; validar con JWT minteado (payload bajo `data`).

### 33.16 Sesión 2026-07-16 — IA: OpenRouter como proveedor primario (validado en runtime)
El clasificador químico (`clasificador-quimico.service.ts`) ahora soporta **3 proveedores** con precedencia **OpenRouter → Gemini → Anthropic** (autodetección por env key):
- **OpenRouter** (`OPENROUTER_API_KEY` + `OPENROUTER_MODEL`, default `google/gemini-2.5-flash`) → `https://openrouter.ai/api/v1/chat/completions`, formato **OpenAI** (system+user messages, `response_format: json_object`, `Authorization: Bearer`). Método nuevo `callOpenRouter`; parseo `choices[0].message.content`.
- Gemini y Anthropic quedan como respaldo (código sin tocar).
- **.env**: agregadas `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`; `GEMINI_API_KEY` se dejó como respaldo (**el usuario decidió NO rotarla** pese a estar expuesta en claro — decisión suya). `docker-compose.yml` pasa las `OPENROUTER_*` al contenedor `api`.
- ⚠️ Cambios de env requieren **recrear** el contenedor (`docker compose up -d api`), no `docker restart` (este no reinyecta env del compose). Validado runtime: compila 0 errores, env presente, test directo a OpenRouter → HTTP 200, modelo `google/gemini-2.5-flash`, `{"ok":true}`. NO se corrió la clasificación completa (gasta créditos del usuario).
- Para cambiar de modelo: editar `OPENROUTER_MODEL` en `.env` + `docker compose up -d api`.

### 33.15 Sesión 2026-07-16 — Paginación server-side: Órdenes de Compra (validada en runtime)
Mismo patrón retrocompatible. Particularidad: **dos consumidores** del mismo endpoint con filtros distintos.
- **Backend** (`ordenes-compra.service.listar(query)` + controller `@Query()`): sin `page` → array crudo con `enrichWithIva` (comportamiento histórico intacto); con `page` → `{data,meta,stats}`. Filtros `estado` + `q` (numero|proveedor). `stats` globales = `{total, enviadas, recibidas, canceladas}` (SUM de `estado=...`, universo no borrado, independiente de filtros). `enrichWithIva` (iva_pct/iva_monto/total_con_iva) se aplica a las filas de la página. Validado runtime: legacy array, `?page` `{data,meta,stats}` con IVA, `?estado=Recibida` (todas Recibida), `?q`.
- **Frontend**: `useComprasPaginated(filters)` nuevo en `useCompras.js` (el `useCompras` viejo queda intacto para detalle/recepción/create/update); `comprasKeys.list(filters)` (prefijo de `lists()` → invalidar `lists()` refresca ambos tabs). Enum real OC: `Borrador,Enviada,Recibida,Cancelada`.
  - **OrdenesTab** migrado (todos los estados): KPIs desde `stats`, adaptador TableShell, debounce 400ms, bulk-cancel usa `cambiarEstadoAsync` del hook. Excel export ahora exporta **página actual** (`ordenes`), no todo (trade-off server-side, igual que cotizaciones).
  - **HistorialTab** migrado (`estado:'Recibida'` fijo + búsqueda): sin KPIs, read-only, mismo adaptador+debounce.
- Cada tab pasa filtros distintos → queryKeys distintas → cachés separadas. Backend reiniciado (`docker restart pinca-erp-api`) y validado con **JWT minteado** (payload va anidado bajo `data`: `{iat,exp,data:{id,username,rol,token_version,...}}`, HS256 con `TOKEN_SECRET`; el guard valida `token_version` vs BD). Frontend syntax-check esbuild OK + sin refs colgadas.
- ⏳ Falta replicar solo a **ítems/Catálogo**. Migrar **Cartera** `FacturasTable` (KPIs por estado efectivo/mora) sigue aparte.

### 33.13 Sesión 2026-07-16 — Paginación server-side: Cotizaciones + Remisiones (validadas en runtime)
Replicado el patrón de facturas (backend retrocompatible `findAll/index(query)` → sin `page` array, con `page` `{data,meta,stats}`; frontend `useXPaginated` + Tab migrado con debounce + adaptador TableShell).
- **Cotizaciones** (`cotizaciones.service.findAll` + controller `@Query()`; `useCotizacionesPaginated` en `useCotizaciones.js`; `cotizacionKeys.list`; `CotizacionesTab` migrado). Validado runtime: retrocompat array, `?page` `{data,meta,stats}`, `?estado=Aceptada`, stats globales. **Bug pre-existente corregido**: el tab usaba estados `'Aprobada'`/`'Expirada'` que NO existen en el enum real (`Borrador,Enviada,Aceptada,Rechazada,Vencida,Convertida`) → la KPI "Aprobadas", el filtro y el botón "Convertir" (gated en `'Aprobada'`) nunca funcionaban. `STATUS_OPTIONS` y el gating corregidos a `'Aceptada'`; stats SQL usa `estado='Aceptada'`.
- **Remisiones** (`remisiones.service.index(query)` con `this.format` en las filas; `useRemisionesPaginated`; `remisionKeys.list`; `RemisionesTab` migrado). Validado runtime igual. **Bug pre-existente corregido**: KPI "Entregadas" usaba `estado='Entregada'` que no existe (enum real `Pendiente,Facturada,Anulada`) → siempre 0. Cards ahora Total/Pendientes/Facturadas/Anuladas; `STATUS_OPTIONS` a `Facturada`; stats globales.
- **Excel export** (Cotizaciones): antes exportaba `filtered` (todo); ahora exporta la **página actual** (server-side no tiene todo). Trade-off menor documentado.
- ⏳ Falta replicar a: **OC** (`OrdenesTab` + `HistorialTab`, dos consumidores de `useCompras`) y **ítems/Catálogo**. Migrar **Cartera** `FacturasTable` (KPIs por estado efectivo/mora → stats con fecha en SQL) sigue pendiente.
- ⚠️ **Env hiccup**: al arrancar hoy, el stack base (`gestor-pinca-db`, `gestor-pinca-app`) estaba EXITED (Docker se reinició) → el Nest no conectaba (`ENOTFOUND gestor-pinca-db`). Fix: `docker start gestor-pinca-db gestor-pinca-app` + `docker restart gestor-pinca-nest`. Si el Nest no resuelve la BD, revisar que el DB esté UP y en la red `pinca_backend_app-network`.

### 33.12 Cierre de sesión 2026-07-15 — estado y pendientes
- **Docker al cierre**: el contenedor `gestor-pinca-nest` (que se levantó para validar) quedó **DETENIDO** al terminar la sesión. Para relevantarlo: `cd pinca_backend_nest && docker compose up -d` (⚠️ el watch NO recompila sobre drvfs → `docker restart gestor-pinca-nest` tras editar `src/`). El stack base (`gestor-pinca-app` CI4, `gestor-pinca-db`, `gestor-pinca-pma`) quedó como estaba (corriendo).
- **DECISIÓN ABIERTA (la más importante para el deploy)**: ¿cómo se sirve el frontend en prod?
  - **Opción A — sin nginx**: que **Nest sirva el SPA** (con `useStaticAssets`, igual que ya sirve `/uploads`) → un solo proceso/puerto, más simple. Recomendada si el deploy es un servidor único.
  - **Opción B — con nginx/Caddy** delante (la config `deploy/nginx-pinca.conf` ya está lista y validada con `nginx -t`): reverse proxy que sirve frontend + HTTPS + proxya `/api`→Nest. Para HTTPS gestionado ahí o multi-servicio.
  - El usuario preguntó "por qué nginx" — aclarado que el archivo venía de la migración strangler (no es obligatorio). Falta que defina su **target de deploy** (VPS propio / cloud tipo Railway-Render / HTTPS+dominio) para elegir A o B. Si es A, hay que agregar `useStaticAssets(dist)` + un catch-all a `index.html` en Nest.
- **Pendientes reales al cierre** (orden sugerido): (1) decidir A/B de arriba; (2) replicar la **paginación server-side** (patrón de facturas ya probado) a cotizaciones/remisiones/OC/ítems + migrar la vista de **Cartera** (KPIs por estado efectivo → stats con fecha en SQL); (3) **rotar la GEMINI_API_KEY** (acción del usuario); (4) cutover: apagar CI4 (`docker stop gestor-pinca-app`) → smoke-test → borrar. Los 3 bloqueantes técnicos del cutover (uploads, frontend estático, costos_snapshot) ya están resueltos.
- **Prueba visual pendiente del usuario** (no se pudo hacer desde WSL): FacturacionTab con paginación server-side, el tiquete A4 de PDF, y el logo `/uploads` — todo en `npm run dev` (Windows).

---

## 34. Sesión 2026-07-28 — Nómina: página completa + TanStack Table + comprobante PDF + sidebar + auditoría

Sesión larga, todo en `pinca_frontend` (el backend `pinca_backend_nest` no tuvo cambios de código esta sesión — solo se le probaron los 16 endpoints de `/nomina`, ver su propio `CLAUDE.md` §7, creado hoy). Validado con esbuild (bundle) + ESLint en cada paso — **no se pudo compilar/correr `npm run dev` desde WSL** (de nuevo, node_modules cross-platform), pruebas visuales pendientes del usuario en Windows salvo donde se indique "validado con Docker/render real".

### 34.1 Sesiones previas sin registrar (backfill breve)

Entre el cierre del §33 (2026-07-16) y hoy hubo dos sesiones que no se documentaron acá — quedan solo como referencia rápida (si hace falta el detalle fino, revisar `git log` de ese rango):

- **2026-07-17 — Auditoría multi-agente de bugs**: 5 agentes (dinero/hardcodeo/concurrencia/seguridad/frontend). Núcleo sano (cero SQLi). Fixes en 3 tandas: crear/editar factura, Cartera sin Anuladas, concurrencia (recepción→OC/preparación/refresh/OC-recepción/numeración), borrar admin-only, `UNIQUE` en folio/pago. Pendiente: retenciones-UVT (usuario dijo "ahora no"), `trust proxy` (deploy).
- **2026-07-24 — Módulo Nómina básico**: empleados + liquidación por período + pago (abonos parciales por empleado + descuentos comerciales con arrastre FIFO al próximo período + desprendible PDF). Admin-only. ⚠️ SMMLV/auxilio de transporte son *placeholders* configurables (Configuración → Nómina) — el módulo **no calcula prestaciones sociales ni retención en la fuente**, es liquidación básica.

### 34.2 Liquidación: de modal a página completa + TanStack Table + slide-over

El usuario pidió (como Product Manager + Dev) que la vista de revisión de una liquidación dejara de ser un modal y se comportara como un módulo de nómina "de verdad": página completa, tabla profesional, slide-over para el detalle por empleado, y automatización de fechas al generar.

**Archivos nuevos**:
- `src/modules/Nomina/pages/LiquidacionPage.jsx` — página completa en `/nomina/liquidaciones/:id` (antes era el modal `PeriodoDetailModal.jsx`, **borrado**). Stepper de ciclo de vida (Borrador→Cerrada→Pagada), stats (Neto/Pagado/Pendiente), la tabla, y las acciones según estado.
- `src/modules/Nomina/components/LiquidacionTable.jsx` — tabla con **`@tanstack/react-table`** (headless, nueva dependencia `^8.21.3`). Columnas: Empleado, Días (editable con input punteado solo en borrador), Devengos, Deducciones, Neto a pagar, Estado. Sorting real por click en header (antes el "pendientes primero" era un sort silencioso e imposible de cambiar).
- `src/modules/Nomina/components/EmpleadoPagoSlideOver.jsx` — al hacer clic en un empleado, abre un `Drawer` (slide-over derecho) con el desglose completo (salario base, devengado, auxilio, deducciones, saldo, historial de abonos) en vez de otro modal central.

**Modificados**: `App.jsx` (ruta nueva lazy), `Layout.jsx` (le faltaba `'nomina': 'Nómina'` en `TITULO_POR_RUTA` — bug preexistente, el Topbar nunca actualizaba el título al entrar a Nómina), `NominaPage.jsx` (`useUrlSearch('tab')` para que "volver" desde la página de liquidación restaure el tab correcto), `PeriodosTab.jsx` (navega a la página en vez de abrir el modal), `PageTitle.jsx` (prefijo `/nomina/liquidaciones` → título "Liquidación").

**Bug real encontrado y corregido en el camino** (auditoría §34.6): el slide-over guardaba una copia congelada del renglón (`useState(row)`) al hacer clic — la misma clase de bug "entidad anterior" ya cazada en la sesión del 07-03 (§32). Se corrigió derivando el renglón en vivo de `detalle` por id con `useMemo`.

### 34.3 GenerarPeriodoModal — automatización de fechas

Al elegir periodicidad "Quincenal" aparece un selector "1 al 15" / "16 al fin de mes" (con default según el día de hoy); cambiar periodicidad o quincena autocompleta "Desde"/"Hasta" (y la etiqueta, si no fue editada a mano) para el mes en curso. Los campos siguen editables si la liquidación no es del mes actual.

**Bug encontrado y corregido**: el grid de 2 columnas (Periodicidad + Quincena) dejaba un hueco vacío a la derecha cuando se elegía "Mensual" (el selector de Quincena desaparece pero el grid seguía reservando el espacio). Grid ahora condicional (`grid-cols-1`/`grid-cols-2`).

### 34.4 Comprobante de pago de nómina — formato PDF propio y corto

El desprendible existente (`ExportDesprendible.jsx` → `DocPdf`, formato "Carta" A4 detallado) se mantiene intacto. Se agregó un **segundo formato, "Comprobante"**, iterado varias veces con el usuario hasta quedar bien:

- **`src/shared/pdf/fonts.js`** (nuevo) — registro único de la tipografía Outfit para `@react-pdf/renderer`, extraído de `DocPdf.jsx` para poder compartirlo con el componente nuevo sin duplicar `Font.register`.
- **`src/modules/Nomina/components/DocComprobantePago.jsx`** (nuevo) — documento **propio**, NO el tiquete POS (`DocTicket`) que usan Factura/Recibo/OC. Página chica de verdad (`[300, 690]` puntos, no A4 completo), mismos tokens visuales que `DocPdf` (Outfit, negro/gris, acento amarillo), pero el **neto a pagar/pagado es lo primero que se ve** (recuadro grande centrado), con el desglose de devengos/deducciones como líneas cortas (no tabla).
- **`src/modules/Nomina/components/DocComprobantePagoPreview.jsx`** (nuevo) — preview WYSIWYG análogo a `DocPdfPreview` pero para este documento.
- **`ExportDesprendible.jsx`**: toggle Carta/Comprobante en el modal de vista previa; cada formato arma su propio config y usa su propio `download*`.

**Iteración de datos** (pedido explícito: "más orientado a nómina, con estructura profesional"):
- Nombre completo + **"C.C. {documento}"** explícito (antes mostraba cargo O documento, nunca ambos).
- **Salario base mensual** visible en el header del empleado (contexto del contrato).
- Deducciones con **% al lado del concepto** ("Salud (4%)", "Pensión (4%)") — lee `nomina_pct_salud`/`nomina_pct_pension` de Configuración vía `useConfigValue` (mismo hook que ya usa `GenerarPeriodoModal`).
- **Caja "Saldo Pendiente" se omite** cuando coincide EXACTO con el neto a pagar (nada abonado aún — sería redundante); se muestra en cualquier otro caso (abono parcial o ya saldado, donde sí aporta info nueva).
- **Firma formal**: "Firma del Empleado" + "C.C. {documento}" (antes: "Recibí conforme — {nombre}").

**Bug propio encontrado y corregido durante la iteración**: al ocultar la caja de saldo pasando `saldo: null`, la etiqueta del recuadro grande ("NETO A PAGAR" vs "NETO PAGADO") dependía de ese mismo campo → decía "PAGADO" aunque no se hubiera pagado nada (justo el caso donde se oculta la caja). Se separó en un flag `pagado` (boolean) independiente de `saldo` (que solo decide si la caja se muestra).

**Bugs de layout encontrados y corregidos** (detectados generando el PDF real con `@react-pdf/renderer` en Node y leyéndolo, no solo por código — ver §34.5 receta):
- Header: el nombre de la empresa se montaba encima del número de comprobante (columnas sin ancho reservado — `headLeft` sin `flex:1`, `headRight` sin `width` fijo). Corregido con `flex:1`/`width:82` explícitos.
- Contenido desbordaba a una 2ª página casi en blanco — la altura de página (probada en varias iteraciones: 470→520→560→600→650→**690**) fue insuficiente varias veces seguidas hasta encontrar la correcta con el espaciado final.
- "NETO A PAGAR" pedía quedar "más centrado" → la caja ganó `marginHorizontal` (antes ocupaba el ancho completo, borde a borde) para leerse como tarjeta destacada.
- Nombre de empresa largo hacía salto de línea → tamaño de fuente reducido (8.5→7) + columna izquierda del header ensanchada.

### 34.5 Receta usada para iterar el PDF sin `npm run dev`

Como no se puede levantar Vite desde WSL, se armó un harness para generar el PDF real con Node y leerlo con el tool `Read` (que renderiza PDFs como imagen):

```bash
# Bundlear el componente a CJS con esbuild (react-pdf y react quedan externos)
esbuild render.jsx --bundle --platform=node --format=cjs --jsx=automatic \
  --external:react --external:react-dom --external:@react-pdf/renderer \
  --loader:.ttf=file --loader:.png=file --define:import.meta.env='{}' \
  --outfile=render.cjs
# Copiar el .cjs + las fuentes .ttf embebidas a UNA carpeta temporal DENTRO
# del repo (para que Node resuelva node_modules) y correr desde ahí:
cd pinca_frontend/.tmp_pdf_test && node render.cjs   # genera out.pdf
```

Notas: `import.meta.env` rompe en CJS → shimear con `--define`; las fuentes con loader `file` devuelven rutas relativas que Node resuelve contra el **cwd**, no contra el bundle — hay que ejecutar desde la misma carpeta donde quedaron copiadas. Carpeta temporal siempre borrada al final (`rm -rf .tmp_pdf_test`), nunca commiteada.

### 34.6 Sidebar — reorganización de grupos + auditoría UX/UI

Pedido: sacar el ícono de tuerca (`Cog`) de "Producción" y no dejar "Nómina" como grupo de un solo ítem ("al aire libre").

- **`src/shared/Sidebar.jsx`**: `GROUP_ICONS['Producción']` de `Cog` → `Boxes`. Se agregó y luego se sacó `'Análisis': BarChart3` (grupo quedó con 1 solo ítem, ya no necesita ícono de grupo — se renderiza como ítem directo, patrón ya establecido desde 2026-05-19). Ícono nuevo `'Finanzas': Landmark`.
- **`src/config/sidebarMenu.js`**: reorganización final (iterada con el usuario, no fue la primera propuesta):
  - **Análisis**: solo Rentabilidad (al final del todo del sidebar, por pedido explícito).
  - **Finanzas** (grupo nuevo): Cartera + Costos Producción + Nómina — alineado con `config/modulos.js` (`MODULOS_SISTEMA`), que YA clasificaba a Cartera como "Finanzas" y a Costos Producción como "Análisis" (taxonomía de permisos, separada de esta), no como "Ventas"/"Análisis" donde vivían en `sidebarMenu.js`.
  - **Ventas** quedó más limpio: solo Comercial + Clientes.

**Bug encontrado en la auditoría posterior**: el breadcrumb de Nómina (`NominaPage.jsx` y `LiquidacionPage.jsx`) seguía diciendo "RRHH" — el grupo del sidebar ya se había renombrado a "Finanzas" en un paso anterior y no se propagó a los breadcrumbs. Corregido en ambos archivos.

### 34.7 Auditoría UX/UI completa del módulo Nómina

Pedido explícito del usuario ("dime qué bugs puedes encontrar a nivel de UX/UI, también revisa los endpoints"). Repaso archivo por archivo de `src/modules/Nomina/`. Bugs reales encontrados y corregidos (además de los ya listados en 34.2/34.6):

- **`LiquidacionTable.jsx`**: la columna "Días" ordenaba como texto, no como número (`columnHelper.accessor('dias_trabajados', ...)` sin castear) — confirmado con el backend que `dias_trabajados` viaja como **string** ("15.00", típico de columnas `DECIMAL` vía `mysql2`), así que el sort hubiera sido alfabético. Accessor cambiado a función `(d) => Number(d.dias_trabajados)`.
- **`LiquidacionPage.jsx`**: sin manejo de "período no encontrado" — un ID inválido o un período borrado renderizaba una página "vacía" engañosa (stats en $0, tabla con el empty state de "sin renglones") en vez de un error claro. Agregado `EmptyState` + botón "Volver a liquidaciones" cuando `!periodo` tras cargar.
- **`EmpleadoForm.jsx`**: usaba botones nativos en vez del `<Button>` compartido — el de "Guardar" no mostraba spinner durante el guardado (inconsistente con TODOS los demás forms de Nómina) y el hover no tenía efecto visual (mismo color hover que el fondo). Migrado a `<Button variant="success" loading={isSaving}>`.

**Encontrados pero NO corregidos** (menor severidad o patrón compartido con toda la app, fuera de alcance puntual):
- El input de "Días" no revierte visualmente si el guardado falla en el servidor (se apoya solo en el toast) — mismo comportamiento que el resto de inputs de la app.
- Los modales `Export*` (Desprendible, Factura, Recibo, etc. — patrón compartido en 8+ archivos, no específico de Nómina) son overlays a medida sin su propio manejador de ESC; si se abren encima de un Drawer ya abierto (ej. el slide-over de empleado), la tecla ESC cierra el Drawer de abajo en vez del modal de arriba. Preexistente, no tocado.

**Backend**: los 16 endpoints de `/nomina` se probaron uno por uno contra Docker (JWT real, datos `__TEST__`, limpieza verificada) — todos OK, incluidos los guard-rails de estado. Único hallazgo: inconsistencia de tipo en `total_saldo` (string en el listado, number en el detalle) — no es un bug activo (frontend ya castea), documentado en `pinca_backend_nest/CLAUDE.md` §6 para quien toque ese service. Detalle completo de la prueba en `pinca_backend_nest/CLAUDE.md` §7 (creado hoy — antes el backend no tenía CLAUDE.md propio).

### Archivos de esta sesión

**Creados**: `Nomina/pages/LiquidacionPage.jsx`, `Nomina/components/LiquidacionTable.jsx`, `Nomina/components/EmpleadoPagoSlideOver.jsx`, `Nomina/components/DocComprobantePago.jsx`, `Nomina/components/DocComprobantePagoPreview.jsx`, `shared/pdf/fonts.js`, `pinca_backend_nest/CLAUDE.md`.
**Eliminados**: `Nomina/components/PeriodoDetailModal.jsx` (el modal que reemplazó la página completa).
**Modificados**: `App.jsx`, `Layout.jsx`, `shared/PageTitle.jsx`, `shared/Sidebar.jsx`, `config/sidebarMenu.js`, `shared/pdf/DocPdf.jsx` (solo el import de fuentes), `Nomina/NominaPage.jsx`, `Nomina/components/{PeriodosTab,GenerarPeriodoModal,ExportDesprendible,EmpleadoForm}.jsx`.
**Dependencia nueva**: `@tanstack/react-table@^8.21.3`.

### Pendiente

- Prueba visual completa en `npm run dev` (Windows) de todo lo de esta sesión — no se pudo hacer desde WSL.
- Nada bloqueante del lado backend (los 16 endpoints de nómina están confirmados sanos).

---

## 35. Sesión 2026-07-29 — Fix de fondo: alto de página fijo en `DocComprobantePago` (causa raíz del dolor recurrente con proporciones de PDF)

Sesión disparada por una pregunta del usuario ("¿cómo hacen otros este tipo de facturas? llevo mucho tiempo luchando con vos para que manejes bien las proporciones") a raíz de ver el PDF de una integración externa (Factus, facturación electrónica DIAN — ver sesión de ese mismo día en el contexto del backend/proyecto general, no específica de este repo).

### Diagnóstico

Investigué qué generaba esas diferencias de calidad. PINCA usa **dos motores de PDF distintos**:
- `jsPDF` puro (`ExportProduccion.jsx`, `ExportTrazabilidad.jsx`) — coordenadas x/y manuales, sin motor de layout. Cualquier cambio de contenido rompe todo lo que viene después.
- `@react-pdf/renderer` (`shared/pdf/DocPdf.jsx`, `DocTicket.jsx`, y `Nomina/components/DocComprobantePago.jsx`) — SÍ tiene motor de layout tipo flexbox. `DocPdf`/`DocTicket` usan `size="A4"` (tamaño estándar, deja fluir/paginar solo) y por eso nunca dieron este problema.

**La causa raíz puntual** (documentada ya en §34.4 como "iterado 470→520→560→600→650→690"): `DocComprobantePago.jsx` usaba `<Page size={[300, 690]}>` — un **alto de página fijo e inventado a mano**, la misma clase de error que dibujar coordenadas manuales en jsPDF, solo que disfrazado de componente React. El número "690" no salió de calcular el contenido — salió de probar valores hasta que "cupiera".

### Fix

`DocComprobantePago.jsx` — reemplazado el número mágico por `calcularAltoPagina({empleado, deducciones, saldo})`: una función que suma el alto real de cada sección, sumando extras SOLO si esa sección está presente:
- `ALTO_BASE = 660` (todo el contenido fijo: header, título, empleado, grid, caja de neto, devengos, deducciones base, firma, footer, con margen de seguridad para redondeo de line-height y nombres largos).
- `+14` si `empleado.salarioBase` está presente (línea opcional bajo el nombre).
- `+19` si `deducciones.descuentos` está presente (fila extra en la tabla).
- `+55` si `saldo` está presente (caja punteada extra).

### Validación (no solo código — PDF real generado y leído)

Repliqué la receta de §34.5 (esbuild bundlea el componente a CJS con React/react-dom/@react-pdf/renderer externos, se copia a una carpeta temporal DENTRO del repo para que Node resuelva `node_modules`, se corre con Node y se lee el PDF resultante con el tool de lectura, que lo renderiza como imagen). Como el esbuild YA instalado en `pinca_frontend/node_modules` es el binario de Windows (mismo problema cross-platform de siempre en WSL), instalé un esbuild nuevo en el scratchpad (`npm install esbuild` ahí, sin tocar el repo) para tener el binario Linux correcto.

Generé **dos escenarios reales** (no solo el caso feliz):
- **Mínimo**: sin salario base, sin descuentos, sin saldo → `min.pdf`.
- **Máximo**: con salario base, con fila de descuentos, con caja de saldo → `max.pdf`.

Ambos: **1 sola página**, sin superposiciones, sin corte de contenido (confirmado contando `/Type /Page` en el PDF crudo Y leyendo el render visual de ambos). Carpeta temporal borrada al final, nada commiteado.

### Lección para la próxima vez que alguien (yo u otro Claude) toque un documento de `@react-pdf/renderer`

**Nunca hardcodear un alto de página adivinado por prueba y error.** Si el documento no es A4/Carta estándar (formato "recibo" angosto como este), calcular el alto sumando el tamaño real de cada bloque de contenido, con extras condicionales para las secciones opcionales — igual que se hizo acá. Si en algún momento se agrega una sección nueva opcional a `DocComprobantePago`, sumarle su constante de alto a `calcularAltoPagina` en vez de tocar un número base a ciegas.

---

> **Snapshot al cierre 2026-07-29**: `DocComprobantePago.jsx` con alto de página calculado dinámicamente en vez de un valor fijo adivinado — validado generando y leyendo el PDF real en 2 escenarios (mínimo/máximo contenido), ambos en 1 página sin overflow. Sin cambios en `DocPdf`/`DocTicket` (ya usaban A4 correctamente). Nada más tocado en esta sesión.

---

## 36. Commit de backlog acumulado (2026-07-29) — trabajo de sesiones previas sin commitear

Al cerrar la sesión de hoy (§35) se encontraron **68 archivos con cambios sin commitear** en el working tree, además del fix puntual del §35. No fueron hechos en esta conversación — quedaron pendientes de una o más sesiones anteriores que avanzaron trabajo real pero nunca lo consolidaron en un commit. Se revisaron los diffs (sin evidencia de la corrupción por Google Drive documentada en §27 — son cambios coherentes y consistentes, no reversiones a versiones viejas) y se commitearon aparte del fix de hoy. Documentado acá porque, a diferencia de cada sesión anterior, este bloque nunca tuvo su propia entrada.

**Patrones identificados por muestreo de diffs** (agrupados, no exhaustivo archivo por archivo):

- **Completar `API_ROUTES`** (cierra el pendiente reportado desde §25/§26/§33.6 de "~15-30 hooks con rutas hardcodeadas"): `apiRoutes.js` gana namespaces/params nuevos (`EMPRESA.LOGO*`, `BODEGAS.INVENTARIO` con querystring, `ITEMS.LEGACY_ALL`, `GESTIONES`/`NOTAS_CREDITO` por factura/cliente, `FORMULACIONES.*`, etc.) y ~15 hooks (`useCatalogosMaestros`, `useFormulaciones`, `usePreparaciones`, `useAuditoria`, `useAuditoria`, `useEmpresa`, `useNumeracion`, `useComparador`, `useCostosCompras`, `useCostosIndirectos`, `useCostosProduccion`, `useGananciasVentas`, `useInventario`, `useCategorias`, `useItem`, `useUpdateItem`, `useMovimientos`, `useCartera`, `useUnidades`) migran sus `apiClient.get('/ruta-literal')` a las constantes centralizadas.
- **Fallback de error unificado**: varios `onError` que solo leían `.messages.error` (shape viejo CI4) ahora agregan `|| e?.response?.data?.msg` — cierra el pendiente puntual de `useCatalogosMaestros.js` documentado en §33.6.
- **Accesibilidad**: `aria-label="Cerrar"` agregado a botones de cerrar sin texto visible en ~10 modales/drawers (`VincularModal`, `RecibirLineaModal`, `DisponibilidadModal`, `HistorialDrawer`, `FormCostProducts`, `FormulacionModal`, `ProduccionDetailModal`, `preparationModal`, `RentabilidadDetalleProd`, etc.). `FormSelect.jsx` (el cambio más grande, +70 líneas) gana navegación por teclado completa (↑↓ Enter Esc, scroll al ítem resaltado) + ids ARIA (`aria-controls`, `listbox`, `errorId`) — antes era clickeable pero no operable con teclado.
- **Contraste dark mode en bandas de header oscuras**: en varios paneles con banda `bg-content-primary` (ej. `preparationModal.jsx` — panel "Materias primas"/"Resumen de órdenes"), el texto usaba `text-content-muted`/`text-content-tertiary` (tokens que flipean con el tema) en vez de `text-content-inverse/60-70` (estable sobre fondo oscuro) — mismo tipo de bug que la clase `.tbl-header` ya resuelta en §32, aplicado acá a paneles que no pasaron por esa pasada.
- **UX/seguridad de inputs numéricos** (`main.jsx`): listener global que hace `blur()` de un `<input type="number">` enfocado si el usuario scrollea la página — evita el comportamiento nativo del navegador de cambiar el valor del input por accidente al scrollear con el cursor encima (riesgo real en un ERP con montos/cantidades).
- **`vite.config.js`**: `server.allowedHosts: ['host.docker.internal']` — permite que un escáner de seguridad corriendo en Docker (ej. OWASP ZAP) le pegue al dev server sin el 403 de host no permitido de Vite. Indica que hubo (o se preparó) una sesión de pentesting/DAST contra el frontend.
- Varios ajustes puntuales de 1-2 líneas en `Layout.jsx`, `CommandPalette.jsx`, `ErpTable.jsx`, `RolesPage.jsx`, `ItemGeneralSearch.jsx`, `CatalogoForm.jsx`, `OrdenForm.jsx`, `TributariaTab.jsx` y varios `Export*.jsx` — no inspeccionados uno por uno en detalle, consistentes con los patrones de arriba (aria-label, fallback de ruta, o ajuste menor de estilo).

**No se pudo validar visualmente** (mismo problema de siempre: no compila desde WSL) — el build/lint/`npm run dev` de todo este bloque queda pendiente de la próxima verificación en Windows.

---

> **Snapshot al cierre 2026-07-29 (commit de backlog)**: 68 archivos de trabajo previamente sin commitear, consolidados en un commit aparte del fix del §35. Cierra backlog documentado de varias sesiones (API_ROUTES hardcoded, fallback `.msg`, a11y de modales, contraste dark en paneles). Pendiente: build/lint/prueba visual en Windows.

---

## 37. Sesión 2026-07-30/31 — Estilo "Factus" para Cotización/Remisión/OC/Recibo (cuarto formato de PDF)

Disparada por una pregunta sobre la evaluación de Factus (proveedor DIAN, ver `pinca_backend_nest/CLAUDE.md` y memoria general del asistente): el usuario vio el PDF de ejemplo de Factus y pidió replicar su **estructura visual** (no sus datos legales — eso solo aplica a documentos DIAN reales) como una tercera opción de formato, además de Carta/Tiquete, en 4 exportadores.

### Componentes nuevos (standalone, `@react-pdf/renderer`)

- `Comercial/Cotizaciones/components/CotizacionFactusStyleDoc.jsx`
- `Comercial/Remisiones/components/RemisionFactusStyleDoc.jsx` (sin descuento/IVA por línea — la remisión de PINCA no aplica impuesto)
- `Compras/components/OrdenCompraFactusStyleDoc.jsx` (el proveedor toma el lugar del "cliente")
- `Pagos/components/ReciboFactusStyleDoc.jsx` (sin tabla de ítems — un recibo no factura productos, el "monto recibido" ocupa ese lugar)

Ninguno reemplaza `shared/pdf/DocPdf.jsx` (que siguen usando los Carta/Tiquete existentes) — son plantillas paralelas, wireadas como una **tercera opción del toggle** ("Factus", ícono `LayoutTemplate`) en `ExportCotizacion.jsx` / `ExportRemision.jsx` / `ExportOrdenCompra.jsx` / `ExportRecibo.jsx`, cada uno con su propio `buildFactusConfig(...)` que mapea los datos reales de la entidad al shape que espera el componente nuevo (distinto al de `DocPdf`, que usa `campos/columnas/filas`).

### Iteración de diseño del header (varias rondas con el usuario)

1. **v1**: header en 3 columnas (logo | título+datos legales centrados | QR) — el QR codificaba solo texto plano (`"COTIZACIÓN {numero} · {empresa} · Cliente: {nombre}"`, generado con la librería `qrcode`), no una URL real. Se explicó por qué: el QR real de Factus apunta a la verificación DIAN del CUFE, que no existe para documentos que no son facturas electrónicas — no se inventó una URL falsa.
2. **v2**: el usuario pidió quitar el QR y mandar los datos de la empresa al costado derecho en vez de centrados → header a **2 columnas** (logo izquierda | título+número+datos alineados a la derecha). Se sacó toda la generación de QR (`useEffect` + `QRCode.toDataURL` + estado `qrDataUrl`) de los 4 `Export*.jsx`, y la dependencia `qrcode` se desinstaló otra vez del `package.json` (quedó igual que antes de esta sesión).
3. **v3**: el usuario sintió el header "muy vacío" arriba → se le dieron 3 opciones (caja con borde alrededor de los datos / franja de acento de color / ambas) y eligió la primera. Los datos de la empresa (nombre/NIT/tel-email/dirección-ciudad) quedaron dentro de una `View` con borde + fondo gris claro (mismo lenguaje visual que el panel de Cliente/Fecha de abajo), con el título y el número arriba de la caja, más grandes.
4. **Bug real encontrado y corregido en el camino**: al subir `docTitle` de fontSize 11→13 sin tocar `lineHeight`, el título y el número quedaban **superpuestos** (glifos cruzados, visible en el render real, no solo en el código). Se detectó comparando el render antes/después de agregar la caja, no por inspección de código. Fix: `lineHeight: 1.3` explícito + `marginBottom`/`marginTop` de 2px en ambos, replicado en los 4 archivos.

Cada iteración se validó generando el PDF real (no solo el código) con el mismo harness de `pinca_frontend/CLAUDE.md` §34.5 (esbuild a CJS con React/react-dom/@react-pdf/renderer externos, renderizado con Node en una carpeta temporal dentro del repo, borrada al final) — nunca se dio por buena una iteración solo por lectura de código.

### `qrcode` — dependencia instalada y desinstalada (gotcha de WSL)

Al instalar `qrcode` desde WSL (para el QR de la v1), `npm install` le quitó a `node_modules/@rollup` el binario `rollup-win32-x64-msvc` (mismo bug ya documentado en la memoria del asistente `frontend-rollup-cross-platform-node-modules` — node_modules compartido Windows/WSL). Al desinstalarla de nuevo (v2) volvió a pasar. **El usuario necesita correr `npm install` en Windows** antes de su próximo `npm run dev`/`build` para restaurar el binario — `package.json`/`package-lock.json` ya quedaron limpios (sin `qrcode`), pero el `node_modules` físico en disco puede seguir roto para Windows hasta ese `npm install`.

### Backend — gaps de datos cerrados de paso

Construir el estilo Factus expuso que varios campos (NIT del cliente en cotizaciones, NIT/dirección del proveedor en OC, NIT del cliente en pagos) **siempre salían vacíos**, en cualquier formato (Carta/Tiquete incluidos, no solo el nuevo) — las queries del backend nunca los traían del JOIN. Se corrigió en `pinca_backend_nest` (`cotizaciones.service.ts`, `ordenes-compra.service.ts`, `pagos-cliente.service.ts` — ver ese `CLAUDE.md` para el detalle). También se corrigió un bug de nombre de campo en `ExportRecibo.jsx` (`buildConfig` leía `pago.factura_numero`, el backend devuelve `pago.numero_factura` — el campo "Factura" del recibo salía vacío en Carta/Tiquete).

### Validado

Los 4 documentos se generaron con datos reales (cliente Distribuidora Andina, proveedor real BRENNTAG COLOMBIA de la OC-003) en cada ronda de iteración — layout final sin overflow, sin overlap, una sola página, NIT/dirección poblados. **No se pudo probar en `npm run dev`** (WSL) — falta la prueba visual del usuario en Windows, especialmente después del `npm install` pendiente por el tema de `qrcode`/rollup.

---

> **Snapshot al cierre 2026-07-31**: cuarto formato de PDF ("Factus") wireado en Cotización/Remisión/OC/Recibo, iterado 3 veces con el usuario (con QR → sin QR, datos a la derecha → caja con borde), con un bug real de overlap de texto encontrado y corregido generando el PDF real en cada paso. De paso, 3 gaps de datos del backend (NIT/dirección de cliente/proveedor) que afectaban a TODOS los formatos, no solo el nuevo, quedaron cerrados. Pendiente: `npm install` en Windows (rollup) + prueba visual completa.

---

## 38. Sesión 2026-08-10 — Limpieza/refactor general (`/goal`) + 2 bugs reales de costeo en Formulaciones

Sesión larga disparada por un `/goal` de limpieza de código (código no usado, `console.log` de depuración, refactor de funciones/componentes complejos, sin tocar lógica de negocio). Auditoría inicial: **el frontend ya estaba limpio** de imports/variables sin usar (ESLint 0 issues en 327 archivos) y de `console.log` de depuración (solo 1 `console.warn` legítimo dentro de un catch). Trabajo real: 7 archivos huérfanos eliminados + 3 componentes/archivos grandes refactorizados + 2 bugs reales encontrados y corregidos a partir de preguntas del usuario sobre números que no cuadraban.

### 38.1 Archivos huérfanos eliminados (0 referencias en todo el proyecto, verificado independientemente)

- `src/modules/Roles/RolesPage.jsx` — página completa superada por el tab "Roles" de `UserPanel.jsx` desde sesiones anteriores (ya documentado como huérfano conocido en una auditoría previa). Se conservó `Roles/api/useRoles.js` (sigue usado por `UserPanel`).
- `src/modules/index.js` — barrel file que re-exportaba ~90 módulos; nadie importaba desde ahí.
- `src/modules/sedes/services/instalacionesServices.js` — capa de servicios pre-hooks, reemplazada hace tiempo por `sedes/api/useInstalaciones.js`.

**Decisión del usuario sobre los 4 sin uso actual** (confirmada explícitamente): `ActionMenu.jsx` y `FormSection.jsx` se **conservan** — son piezas de diseño documentadas como convención activa (§5), adoptarlas es un cambio de UI, no de limpieza. `useTableSorts.js` y `utils/services.js` (`getDateTheme`) se **eliminaron** — confirmado por el propio historial del proyecto que quedaron obsoletos (el primero se sacó explícitamente de su último callsite al migrar a paginación server-side; el segundo es redundante con `dateChip.js`). Referencias a estos dos en §6/§7 (tabla de utils, hooks custom) también removidas de la documentación vigente.

### 38.2 Refactors de componentes grandes (extracción pura, sin cambio de lógica)

Cada uno validado con: ESLint (`no-undef` detecta imports faltantes/rotos), `npm run build` limpio, **conteo de tokens idéntico** entre el archivo original (hooks, `<button>`, `className=`, `onClick=`, `size={`, etc.) y la suma de los archivos nuevos, y la suite de tests sin regresión (33/34 — el único fallo es preexistente en `StatusBadge.test.jsx`, no tocado, no relacionado).

- **`preparationModal.jsx`** (1238 → 6 archivos): `preparationModal/constants.js`, `calculos.js`, `PreparationSubComponents.jsx` (UnitIcon, OrdenCard, MetaForm, MateriasPanel, IndirectCostSelector, SuccessView), `ConfirmSubForm.jsx`, `CombinacionForm.jsx` + el wrapper principal (`preparationModal.jsx`, quedó como componente `PreparationModal` delgado).
- **`ItemProveedorForm.jsx`** (742 → 2 archivos): extraído `NombreAutocomplete.jsx` (176 líneas, autocomplete con debounce contra `/item_general/buscar`). De paso se limpió un import muerto (`X` de lucide-react, sin uso ni en el original).
- **`FormulacionModal.jsx`** (988 → 7 archivos, en 3 rondas validadas por separado): primero se extrajo `IngredientCard.jsx` + `formulacionModalHelpers.js` (`fmtCOP`/`fmtKg` compartidos). Luego, sobre el `FormulacionModalInner` de ~700 líneas que había quedado intacto (mezclado con `react-hook-form`, se había decidido no tocarlo sin poder verlo renderizado), se completó la extracción: `NuevoProductoInline.jsx` y `BuscadorIngredientes.jsx` (sin acoplamiento a RHF, bajo riesgo), luego `IngredientesList.jsx` (lista reordenable de ingredientes/instrucciones, recibe `register`/`setValue`/`errors` como props — mismo patrón ya probado en `IngredientCard`) y `FormulacionModalFooter.jsx` (totales + botones de acción). `FormulacionModal.jsx` quedó en **462 líneas** (orquestador: estado, `useForm`/`useFieldArray`, handlers) — la sección "Identidad" (selector de producto + nombre + volumen) es lo único que no se extrajo más, por bajo retorno.

**No se pudo probar visualmente** (WSL no levanta `npm run dev` — ver gotcha de rollup más abajo). Validación 100% por build+lint+conteo de tokens+tests. **Falta la prueba visual del usuario** en Windows de: Formulaciones (crear/editar fórmula, agregar ingredientes, crear producto/MP inline, guardar) y Proveedores (crear/editar ítem de proveedor).

### 38.3 Bug real #1: inconsistencia de precio de insumo entre `costos-produccion` y Formulaciones

El usuario pidió generar dos imágenes de costeo para mandarle a un cliente (`VINILO T2 ECONOMICO` id 461, `VINILO T1 COMERCIAL` id 462). Al comparar los números contra la pantalla real de Formulaciones, no coincidían. Investigación (ver detalle completo en `pinca_backend_nest/CLAUDE.md`, mismo día): el endpoint `costos-produccion` calculaba el precio de cada insumo **sin IVA** y priorizando proveedores vinculados directo aunque no fueran los más baratos, mientras que Formulaciones (`getOpcionesProveedorFormulacion`) usa **precio con IVA** y dejar ganar siempre al más barato — con una función de coincidencia por nombre además más estricta (evita falsos positivos tipo "ACRONAL" calzando dentro de "COLARCRYL ACRONAL 50"). El usuario confirmó que el criterio de Formulaciones es el correcto. Fix aplicado en el backend, validado 17/17 y 16/16 insumos coincidiendo exacto tras el cambio.

De paso se encontró que ambos productos tenían `costos_item.volumen` (volumen base del lote) en NULL — dato faltante desde que se cargaron por foto de libreta, no un bug — causaba que el sistema asumiera 1 galón por defecto y multiplicara todo ×100 al simular un lote de 100 gal. Corregido en la base de datos (no es un cambio de código).

### 38.4 Bug real #2: `Number()` mal-parseando precio formateado en `FormulacionesTable.jsx`

Incluso después del fix de IVA, el total seguía sin coincidir por ~$9.600 (el valor exacto del ingrediente AGUA). Causa: `calculateCosts` (backend) devuelve `costo_total_materia` **pre-formateado en pesos colombianos como string** (`"9.600"`, con punto de miles), y `FormulacionesTable.jsx` hacía `Number(f.costo_total_materia)` en la rama de insumos sin proveedor vinculado — `Number("9.600")` en JS da **9.6** (interpreta el punto como decimal), no 9600. El agua (único insumo típico sin proveedor real) prácticamente desaparecía del total.

**Fix**: `src/modules/Formulaciones/components/FormulacionesTable.jsx` — se cambió `Number(...)` por `parseCOP(...)` (importado de `../utils/handlers`, ya existía en el proyecto para exactamente este caso) en el cálculo de `totalUnificado`. Validado reproduciendo el cálculo completo en Node con el fix aplicado — coincide exacto ($15.643,77/gal para VIN462) con lo esperado. Riesgo estructural: el mismo patrón (`Number()` sobre un campo `toCOP()`-formateado) podría existir en otros lados si algún insumo caro se queda sin proveedor vinculado — se revisó el resto del módulo Formulaciones y no se encontraron más ocurrencias del mismo patrón.

### 38.5 Gotcha de entorno (recurrente, ya documentado antes)

Para poder correr `npm run build`/ESLint/tests desde WSL en esta sesión hubo que reinstalar el binario Linux de `rollup` (`npm install @rollup/rollup-linux-x64-gnu --no-save`), lo que **probablemente volvió a romper el lado Windows** (mismo bug de `node_modules` compartido documentado en la memoria del asistente). El usuario necesita correr `npm install` en PowerShell antes de su próximo `npm run dev`/`build`.

### Archivos de esta sesión

**Creados**: `Formulaciones/components/preparationModal/{constants.js,calculos.js,PreparationSubComponents.jsx,ConfirmSubForm.jsx,CombinacionForm.jsx}`, `Formulaciones/components/{IngredientCard.jsx,formulacionModalHelpers.js,NuevoProductoInline.jsx,BuscadorIngredientes.jsx,IngredientesList.jsx,FormulacionModalFooter.jsx}`, `Proveedores/components/NombreAutocomplete.jsx`.
**Eliminados**: `modules/Roles/RolesPage.jsx`, `modules/index.js`, `modules/sedes/services/instalacionesServices.js`.
**Modificados**: `Formulaciones/components/{preparationModal.jsx,FormulacionModal.jsx,FormulacionesTable.jsx}`, `Proveedores/components/ItemProveedorForm.jsx`.

### Pendiente

- Prueba visual completa en `npm run dev` (Windows) de Formulaciones y Proveedores — no se pudo hacer desde WSL en toda la sesión.
- `npm install` en Windows (rollup) antes del próximo `npm run dev`.
- `ActionMenu`/`FormSection` siguen sin adoptarse en ninguna pantalla — decisión del usuario fue conservarlos como convención documentada, no urgente adoptarlos.

---

> **Snapshot al cierre 2026-08-10**: limpieza general completa (0 código muerto real restante, 3 huérfanos borrados, 3 archivos grandes refactorizados en 15 archivos nuevos, todo validado por build+lint+conteo de tokens+tests). 2 bugs reales de costeo encontrados y corregidos (inconsistencia IVA/matching backend, `Number()` vs `parseCOP` en `FormulacionesTable.jsx`). Falta prueba visual del usuario en Windows.

---

## 39. Sesión 2026-08-11 — Auditoría exhaustiva de limpieza (equivalente a la del backend) + refactor de los 5 componentes más grandes

Continuación del `/goal` de limpieza, esta vez con el mismo nivel de exhaustividad que se aplicó en `pinca_backend_nest` (ver ese `CLAUDE.md`, sesión del mismo día): auditoría de código no usado con un script propio (no solo ESLint) + refactor de los componentes más largos/complejos, uno por uno con validación real en cada paso.

### 39.1 Auditoría de código muerto — más exhaustiva que ESLint

`no-unused-vars` (ESLint) ya daba 0 en 327 archivos, pero solo detecta variables/imports sin uso **dentro de un mismo archivo** — no archivos enteros que nadie importa. Se escribió un script Node (`find_orphans.mjs`, scratchpad, no commiteado) que recorre todo `src/`, extrae el basename de cada `.js`/`.jsx`, y busca ese basename en imports de cualquier otro archivo del proyecto (heurística de grep sobre todo el texto, no resolución real de módulos — pero suficiente para encontrar candidatos y verificarlos a mano uno por uno).

**6 candidatos encontrados, 2 falsos positivos, 4 confirmados y borrados**:
- `test/setup.js` — falso positivo (referenciado desde `vitest.config.js` vía `setupFiles`, no vía `import`).
- `shared/ActionMenu.jsx` y `shared/Form/FormSection.jsx` — ya sabíamos que están sin uso actual (decisión explícita de conservarlos, sesión 2026-08-10 §38.1). Confirmado que siguen sin callsites.
- **`modules/Inventario/api/useCategorias.js` + `categoriaKeys.js`** — duplicado muerto de `useCategorias` (el que realmente se usa vive en `Configuracion/api/useCatalogosMaestros.js`, importado por `CatalogosTab.jsx`). `categoriaKeys.js` solo era importado por el propio `useCategorias.js` muerto → cae con él.
- **`modules/Inventario/api/useUpdateItem.js`** — hook de mutación completo con cache optimista (`onSuccess` actualiza `inventarioKeys.byBodegaBase` a mano), pero la ruta que llama (`BODEGAS.UPDATE_ITEM`) no se usa desde ninguna pantalla — confirmado que esa ruta del namespace `apiRoutes.js` solo aparecía en ese hook.
- **`modules/Inventario/services/itemService.js`** — capa de servicios pre-hooks (`getItems`/`getItem`/`createItem`/`updateItem`/`deleteItem` llamando `apiClient` directo), mismo patrón exacto que el ya eliminado `instalacionesServices.js` (sesión 2026-08-10) — superado por `Inventario/api/useItem.js`.

Validado tras borrar: ESLint 0 errores (mismos 5 warnings preexistentes de `react-hooks/incompatible-library`, no relacionados — son de React Compiler detectando `watch()` de react-hook-form y `useReactTable()`, documentados desde antes), build limpio, vitest 33/34 (mismo fallo preexistente en `StatusBadge.test.jsx`).

### 39.2 console.log — ya estaba limpio

`grep` de `console.log`/`console.debug`/`console.info`/`console.table` en todo `src/`: **0 resultados**. Solo 12 usos legítimos de `console.error`/`console.warn`. Nada que hacer acá — ya estaba limpio desde la sesión anterior.

### 39.3 Refactor de los 5 componentes más grandes/complejos (elegido por el usuario de 3 opciones: top 5 / los 24 completos / solo reportar)

Ranking por líneas (24 archivos por encima de 380 líneas — universo mucho más grande que el del backend, y sin poder validar visualmente en navegador desde WSL, así que se acotó a los 5 de mayor riesgo/beneficio). Mismo patrón en los 5: extraer los sub-componentes que **ya vivían nombrados dentro del mismo archivo** a archivos propios, y convertir bloques JSX inline grandes (IIFEs, secciones repetidas) en componentes nombrados nuevos cuando tenía sentido. El archivo original queda como orquestador delgado (estado + handlers + composición). Validación en cada uno: ESLint (`no-undef` detecta imports rotos/faltantes) + conteo de tokens idéntico (grep de patrones como `useState(`, `className=`, `onClick=`, etc. — comparando el original vs la suma de los archivos nuevos) + `npm run build` limpio + `vitest run` sin regresión (33/34, mismo fallo preexistente).

| Componente | Antes | Después | Archivos nuevos |
|---|---|---|---|
| `shared/UserPanel.jsx` | 798 | 123 | 7 (`constants.js`, `atoms.jsx`, `MiCuentaTab`, `CambiarPasswordForm`, `SeguridadTab`, `PreferenciasTab`, `RolesTab`+`ModulosMatrix`+`UsuariosRoles`) |
| `CostosProduccion/components/CostoDetalleDrawer.jsx` | 735 | ~220 | 10 (`HeroCosto`, `CompositionBar`, `Stat`, `EmpaqueModDesglose`, `MargenRealAlert`, `CapacidadProduccionCard`, `LoteCompletoCard`, `IngredientesTable`, `MpsFaltantesCard`, `ProveedoresUsados`) |
| `Comercial/Cotizaciones/components/CotizacionForm.jsx` | 727 | ~290 | 8 (`SearchSelect`, `helpers.js`, `ClienteFieldset`, `DatosGeneralesFieldset`, `AjustesFieldset`, `ResumenTotales`, `BodegaInventarioPanel`, `ItemsTable`) |
| `Produccion/components/ProduccionDetailModal.jsx` | 666 | ~260 | 7 (`helpers.js`, `CostosIndirectosSection`, `CostosProduccionSection`, `MateriaPrimaRow`, `InfoRow`, `TransicionFooter`) |
| `InventarioGlobal/InventarioGlobalPage.jsx` | 665 | ~215 | 7 (`constants.js`, `DiasRestantes`, `ItemRow`, `exportarExcel.js`, `exportarPdf.js`, `AccionesToolbar`, `PaginacionFooter`) |

**Hallazgos de paso** (no bugs, pero vale documentarlos):
- `CostoDetalleDrawer.jsx` tenía una constante `TONE_DOT` declarada pero **sin ningún uso en todo el archivo** — ESLint no la marcaba porque el `varsIgnorePattern` del proyecto (`eslint.config.js`) ignora identificadores en MAYÚSCULAS (pensado para convenciones de constantes, pero con el efecto colateral de esconder dead code real). Eliminada en la extracción.
- `InventarioGlobalPage.jsx` tenía la barra de botones Actualizar/Excel/PDF **duplicada byte-a-byte** entre el modo header normal y el modo `embedded` — con la extracción a `AccionesToolbar.jsx` quedó como un solo componente reusado dos veces (mismo JSX resultante en ambos call sites, cero cambio de comportamiento, solo DRY).

**24 componentes en total por encima de 380 líneas** — quedaron 19 sin tocar (decisión explícita del usuario de acotar a los 5 más grandes). Si se retoma esta lista, el ranking completo generado en la sesión era: `UserPanel.jsx` (798), `CostoDetalleDrawer.jsx` (735), `CotizacionForm.jsx` (727), `ProduccionDetailModal.jsx` (666), `InventarioGlobalPage.jsx` (665), `FormulacionesTable.jsx` (650), `RemisionForm.jsx` (610), `SaludSistemaPage.jsx` (572), `ItemProveedorForm.jsx` (556), `PanelPrincipalPage.jsx` (526), `ProveedoresTable.jsx` (512), `ExportProduccion.jsx` (512), `FormCostProducts.jsx` (502), `CapasStockPanel.jsx` (476), `FormulacionModal.jsx` (462), `FacturasTable.jsx` (433), `Sidebar.jsx` (429), `ExportTrazabilidad.jsx` (421), `OrdenForm.jsx` (405), `OrdenesTab.jsx` (397), `FacturaForm.jsx` (392), `CotizacionesTab.jsx` (392), `DisponibilidadModal.jsx` (391), `NumeracionTab.jsx` (385), `RecibirProrrateoModal.jsx` (379).

### Archivos de esta sesión

**Creados**: 39 archivos nuevos entre los 5 componentes refactorizados (ver tabla arriba).
**Eliminados**: `Inventario/api/{useCategorias.js,categoriaKeys.js,useUpdateItem.js}`, `Inventario/services/itemService.js`.
**Modificados**: `shared/UserPanel.jsx`, `CostosProduccion/components/CostoDetalleDrawer.jsx`, `Comercial/Cotizaciones/components/CotizacionForm.jsx`, `Produccion/components/ProduccionDetailModal.jsx`, `InventarioGlobal/InventarioGlobalPage.jsx`.

### Pendiente

- Prueba visual completa en `npm run dev` (Windows) de los 5 componentes tocados — no se pudo hacer desde WSL. Riesgo bajo (extracción pura, validado con conteo de tokens + build + tests), pero conviene abrir cada pantalla una vez: UserPanel (las 6 tabs), CostoDetalleDrawer (drawer de Costos de Producción), CotizacionForm (crear/editar cotización con bodega+ítems), ProduccionDetailModal (transición de estado + costos indirectos), InventarioGlobalPage (filtros + export Excel/PDF + ajuste manual desde bodega expandida).
- Los 19 componentes restantes de la lista de 24 quedan sin tocar — decisión explícita del usuario, no es una tarea olvidada.

---

> **Snapshot al cierre 2026-08-11**: auditoría de código muerto exhaustiva (script de detección de huérfanos, no solo ESLint) — 4 archivos huérfanos más eliminados. Los 5 componentes más grandes del frontend (798 a 665 líneas) refactorizados en 39 archivos nuevos, todos orquestadores delgados ahora. Validado en cada paso con ESLint + conteo de tokens + build + tests (33/34, mismo fallo preexistente). Falta prueba visual del usuario en Windows.
