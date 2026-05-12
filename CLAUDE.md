# CLAUDE.md — Pinca Frontend

> Este archivo es la **fuente de verdad** para cualquier Claude que retome este proyecto. Está organizado para leerse en orden de necesidad: contexto rápido arriba, detalles técnicos abajo.

## 1. Estado actual (snapshot 2026-05-12)

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

20 módulos en total. Cada uno sigue el patrón:

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
