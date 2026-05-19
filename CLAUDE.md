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

