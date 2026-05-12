# 🔗 Plan de ejecución — Módulo "Sincronización"

> **Estado**: Plan documentado, listo para implementar. Frontend NO iniciado.
> **Última actualización**: 2026-05-12
> **Para retomar**: leé este archivo + `CLAUDE.md` antes de tocar código.

## Propósito del módulo

Centro de auditoría y depuración de la relación **`item_general` (Materia Prima) ↔ `item_proveedor`** (catálogo de proveedor).

Permite ver de un vistazo:
- Cuántas MP tienen proveedores y cuántas no
- Mejor/peor precio por MP entre proveedores
- Items del catálogo de proveedores pendientes de vincular a una MP existente
- MP que se parecen entre sí (posibles duplicados a depurar)
- MP huérfanas (sin proveedor activo)

---

## Decisiones tomadas (cambiables)

| Decisión | Valor por defecto | Por qué |
|---|---|---|
| **UI presentación** | Drawer XL desde Topbar | Acceso rápido tipo herramienta, no pierde la pantalla actual. Si preferís página dedicada, ver Apéndice A. |
| **Nombre** | "Sincronización" | Directo, técnico, breve. Alternativas: "Centro de Datos Maestros", "Auditoría de Catálogo". |
| **Icono** | `GitMerge` de lucide-react | Sugiere unir/sincronizar dos fuentes. |
| **Ubicación en Topbar** | Entre `Calculator` (calculadora actual) y `Bell` (notificaciones) | Donde dijiste. |
| **Roadmap** | MVP primero (Tabs 1-3), luego avanzados (4-5) | Reduce riesgo. |
| **Estrategia backend** | Endpoints específicos del módulo (`/sincronizacion/*`) | Más limpio que sobrecargar `/catalogo`. |

Si querés cambiar alguna, modifica este archivo antes de empezar.

---

## Arquitectura del módulo

```
src/modules/Sincronizacion/
├── SincronizacionDrawer.jsx           # Drawer raíz con tabs
├── components/
│   ├── DashboardTab.jsx               # Tab 1 — KPIs + cobertura
│   ├── MaestroTab.jsx                 # Tab 2 — Tabla de MP con proveedores
│   ├── PendientesTab.jsx              # Tab 3 — item_proveedor sin vincular
│   ├── DuplicadosTab.jsx              # Tab 4 — Pares similares (Fase 5)
│   ├── HuerfanosTab.jsx               # Tab 5 — MP sin proveedores (Fase 6)
│   └── SugerenciaCard.jsx             # Card de sugerencia de vinculación reutilizable
└── api/
    ├── sincronizacionKeys.js          # Query keys
    └── useSincronizacion.js           # React Query hooks
```

**Integración**:
- `src/shared/Topbar.jsx` — agregar botón con icono `GitMerge` que llama `openDrawer('SYNC_PANEL')`.
- `src/Layout.jsx` o `src/App.jsx` — montar `<SincronizacionDrawer />` global (igual que `<UserPanel />`).
- `src/api/apiRoutes.js` — agregar namespace `SINCRONIZACION` con sus rutas.

---

## Pre-requisitos: endpoints backend

**Estado actual**: 3/7 endpoints necesarios YA existen. Los otros 4 hay que crearlos.

### Endpoints existentes (reutilizar)

| Endpoint | Para qué se usa |
|---|---|
| `GET /catalogo` | Datos base de Tab 2 (Maestro) — ya retorna count proveedores y stock_total |
| `GET /item_general/buscar?q=...&tipos=1,2` | Fuzzy search — para sugerencias de vinculación en Tab 3 |
| `PATCH /item_proveedores/{id}/vincular` | Acción de "vincular" en Tab 3 (botón) |

### Endpoints a crear en backend (PHP)

Cada uno con su spec detallado abajo. Si vos o el dev backend implementa, copien el SQL y el shape de respuesta esperada.

#### 1. `GET /sincronizacion/stats` → Tab 1 (Dashboard)

Retorna KPIs y cobertura.

```json
{
  "total_mp": 85,
  "mp_con_proveedor": 72,
  "mp_sin_proveedor": 13,
  "mp_un_solo_proveedor": 24,
  "mp_dos_o_mas_proveedores": 48,
  "items_proveedor_total": 234,
  "items_proveedor_pendientes": 8,
  "duplicados_potenciales": 3
}
```

**SQL referencia** (todo en una sola query con CTEs o varias queries):
```sql
SELECT
  COUNT(*) FILTER (WHERE ig.tipo = 1) AS total_mp,
  COUNT(DISTINCT ig.id_item_general) FILTER (WHERE ig.tipo = 1 AND ip.id_item_proveedor IS NOT NULL) AS mp_con_proveedor,
  -- etc.
FROM item_general ig
LEFT JOIN item_proveedor ip ON ip.item_general_id = ig.id_item_general
WHERE ig.tipo = 1
```

#### 2. `GET /sincronizacion/maestro` → Tab 2 (Tabla principal)

Lista materias primas con info agregada de sus proveedores.

```json
[
  {
    "id_item_general": 12,
    "codigo": "MP-001",
    "nombre": "Resina Acrílica A",
    "tipo": 1,
    "stock_total": 1250.5,
    "categoria_nombre": "Resinas",
    "costo_unitario": 4500,
    "proveedores_count": 3,
    "precio_min_kg": 4200,
    "precio_max_kg": 4800,
    "spread_pct": 14.3,
    "proveedores": [
      { "id_proveedor": 5, "nombre_empresa": "Quimicos XYZ", "precio_kg": 4200, "factor_conversion": 25 },
      { "id_proveedor": 8, "nombre_empresa": "Industrial ABC", "precio_kg": 4500, "factor_conversion": 1 },
      ...
    ]
  },
  ...
]
```

**SQL referencia**:
```sql
SELECT
  ig.id_item_general, ig.codigo, ig.nombre, ig.tipo,
  (SELECT SUM(cantidad) FROM inventario WHERE item_general_id = ig.id_item_general) AS stock_total,
  cat.nombre AS categoria_nombre,
  -- costo_promedio del último cierre
  COUNT(ip.id_item_proveedor) AS proveedores_count,
  MIN(ip.precio_unitario / NULLIF(ip.factor_conversion, 0)) AS precio_min_kg,
  MAX(ip.precio_unitario / NULLIF(ip.factor_conversion, 0)) AS precio_max_kg
FROM item_general ig
LEFT JOIN item_proveedor ip ON ip.item_general_id = ig.id_item_general
LEFT JOIN categoria cat ON cat.id_categoria = ig.categoria_id
WHERE ig.tipo IN (1, 2)
GROUP BY ig.id_item_general
ORDER BY ig.nombre
```

Subarray `proveedores` se puede obtener con una query secundaria o GROUP_CONCAT y parsear en backend.

#### 3. `GET /sincronizacion/pendientes` → Tab 3

Items del catálogo de proveedor con `item_general_id IS NULL`, con sugerencias de a qué MP existente podrían vincularse.

```json
[
  {
    "id_item_proveedor": 145,
    "nombre": "RESINA ACRILICA TIPO A",
    "codigo": "RA-100",
    "precio_unitario": 105000,
    "factor_conversion": 25,
    "unidad_compra_nombre": "BULTO",
    "proveedor_id": 5,
    "nombre_empresa": "Quimicos XYZ",
    "sugerencias": [
      { "id_item_general": 12, "nombre": "Resina Acrílica A", "score": 92 },
      { "id_item_general": 47, "nombre": "Resina Acrílica B", "score": 68 }
    ]
  },
  ...
]
```

**SQL referencia**:
```sql
-- Pendientes
SELECT ip.*, p.nombre_empresa, u.nombre AS unidad_compra_nombre
FROM item_proveedor ip
JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
LEFT JOIN unidad u ON u.id_unidad = ip.unidad_compra_id
WHERE ip.item_general_id IS NULL
ORDER BY ip.creado_en DESC;

-- Para sugerencias: por cada pendiente, llamar a ItemModel::buscarFuzzy(nombre, [1, 2])
-- y agregar top 3 al resultado.
```

#### 4. `GET /sincronizacion/duplicados` → Tab 4 (Fase 5)

Pares de `item_general` con `tipo=1` que se parecen entre sí.

```json
[
  {
    "score": 95,
    "a": { "id_item_general": 12, "codigo": "MP-001", "nombre": "RESINA ACRILICA A", "proveedores_count": 2, "stock_total": 1200 },
    "b": { "id_item_general": 87, "codigo": "MP-001-B", "nombre": "RESINA ACRÍLICA A", "proveedores_count": 0, "stock_total": 0 }
  },
  ...
]
```

**Algoritmo**: por cada par de items_general del mismo `tipo`:
1. Normalizar nombres (lowercase, sin tildes, sin espacios extras).
2. Calcular Levenshtein o `LIKE %x%` cruzado.
3. Bonus si comparten `categoria_id`.
4. Threshold: score ≥ 70 → es par sospechoso.

```php
// Algo así en PHP (Levenshtein nativo)
foreach ($items as $a) {
  foreach ($items as $b) {
    if ($a->id >= $b->id) continue;  // evitar duplicados (a,b) y (b,a)
    $nA = normalize($a->nombre);
    $nB = normalize($b->nombre);
    $max = max(strlen($nA), strlen($nB));
    $dist = levenshtein($nA, $nB);
    $score = round((1 - $dist / $max) * 100);
    if ($a->categoria_id === $b->categoria_id && $a->categoria_id !== null) $score += 10;
    if ($score >= 70) $pairs[] = [...];
  }
}
```

#### 5. `GET /sincronizacion/huerfanos` → Tab 5 (Fase 6)

MP sin proveedores vinculados activos.

```json
[
  {
    "id_item_general": 47,
    "codigo": "MP-099",
    "nombre": "Pigmento Obsoleto",
    "stock_total": 0,
    "ultima_compra": "2024-01-15",
    "ultima_produccion": "2023-12-01"
  },
  ...
]
```

**SQL referencia**:
```sql
SELECT ig.*,
  (SELECT SUM(cantidad) FROM inventario WHERE item_general_id = ig.id_item_general) AS stock_total,
  (SELECT MAX(fecha) FROM detalle_oc do JOIN orden_compra oc ON oc.id_orden_compra = do.orden_compra_id
   WHERE do.item_proveedor_id IN (SELECT id_item_proveedor FROM item_proveedor WHERE item_general_id = ig.id_item_general)
  ) AS ultima_compra
FROM item_general ig
WHERE ig.tipo = 1
  AND NOT EXISTS (SELECT 1 FROM item_proveedor ip WHERE ip.item_general_id = ig.id_item_general);
```

#### 6. (Opcional, fase 7+) `POST /sincronizacion/merge`

Body: `{ keep_id: 12, remove_id: 87 }`.

Lógica:
1. Mover todos los `item_proveedor` de `remove_id` → `keep_id` (UPDATE item_proveedor SET item_general_id = keep_id).
2. Mover registros de inventario, capas, formulaciones, movimientos, etc. (CUIDADO — esto es complejo y peligroso).
3. Marcar `keep_id` como obsoleto o eliminar.
4. Auditoría: registrar en tabla `merge_log` qué se mergeó cuándo y por quién.

**Recomendación**: dejar para fase 7+, no MVP. Mientras tanto, ofrecer botón "Marcar para revisar" que solo crea una nota.

---

## FASES DE EJECUCIÓN

> Cada fase es **autocontenida**: empiezas, terminas, validas, commiteas. Si te interrumpen en medio de una fase, no rompiste nada.

### Fase 0 — Pre-flight (5 min)

**Objetivo**: Confirmar entorno listo.

```bash
cd pinca_frontend
npm run dev          # debe arrancar sin errores
npm run build        # debe pasar
```

Si fallan, **detener**. Revisar `CLAUDE.md` para entender el estado del proyecto.

---

### Fase 1 — Infraestructura del módulo (30-45 min)

**Objetivo**: Crear el esqueleto del módulo y el botón en Topbar. Drawer abre vacío con tabs.

#### Pasos

1. **Crear estructura de carpetas**:
   ```bash
   mkdir -p src/modules/Sincronizacion/components
   mkdir -p src/modules/Sincronizacion/api
   ```

2. **Crear `api/sincronizacionKeys.js`**:
   ```js
   export const sincKeys = {
     all:        ['sincronizacion'],
     stats:      () => [...sincKeys.all, 'stats'],
     maestro:    (filters) => [...sincKeys.all, 'maestro', filters],
     pendientes: () => [...sincKeys.all, 'pendientes'],
     duplicados: () => [...sincKeys.all, 'duplicados'],
     huerfanos:  () => [...sincKeys.all, 'huerfanos'],
   };
   ```

3. **Crear `api/useSincronizacion.js`** con hooks vacíos por ahora (que devuelvan mock o array vacío):
   ```js
   import { useQuery } from '@tanstack/react-query';
   import apiClient from '../../../api/apiClient';
   import { API_ROUTES } from '../../../api/apiRoutes';
   import { sincKeys } from './sincronizacionKeys';

   export const useSincStats = () => useQuery({
     queryKey: sincKeys.stats(),
     queryFn: () => apiClient.get(API_ROUTES.SINCRONIZACION.STATS),
     // TEMP mock mientras backend no está:
     placeholderData: { total_mp: 0, mp_con_proveedor: 0, mp_sin_proveedor: 0, /* ... */ },
   });
   // ... similar para useSincMaestro, useSincPendientes, etc.
   ```

4. **Agregar rutas en `src/api/apiRoutes.js`**:
   ```js
   SINCRONIZACION: {
     STATS:      '/sincronizacion/stats',
     MAESTRO:    '/sincronizacion/maestro',
     PENDIENTES: '/sincronizacion/pendientes',
     DUPLICADOS: '/sincronizacion/duplicados',
     HUERFANOS:  '/sincronizacion/huerfanos',
     MERGE:      '/sincronizacion/merge',
   },
   ```

5. **Crear `SincronizacionDrawer.jsx`**:
   ```jsx
   import { useState } from 'react';
   import { GitMerge, LayoutDashboard, Table2, Link2, Copy, Ban } from 'lucide-react';
   import { useBoundStore } from '../../store/useBoundStore';
   import Drawer from '../../shared/Drawer';
   import PageTabs from '../../shared/PageTabs';
   import DashboardTab from './components/DashboardTab';
   import MaestroTab from './components/MaestroTab';
   import PendientesTab from './components/PendientesTab';
   // import DuplicadosTab from './components/DuplicadosTab';   // Fase 5
   // import HuerfanosTab from './components/HuerfanosTab';     // Fase 6

   const TABS = [
     { key: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
     { key: 'maestro',    label: 'Maestro',     icon: Table2 },
     { key: 'pendientes', label: 'Pendientes',  icon: Link2 },
     { key: 'duplicados', label: 'Duplicados',  icon: Copy,  disabled: true }, // Fase 5
     { key: 'huerfanos',  label: 'Huérfanos',   icon: Ban,   disabled: true }, // Fase 6
   ];

   const SincronizacionDrawer = () => {
     const activeDrawer = useBoundStore(s => s.activeDrawer);
     const closeDrawer  = useBoundStore(s => s.closeDrawer);
     const [tab, setTab] = useState('dashboard');

     if (activeDrawer !== 'SYNC_PANEL') return null;

     return (
       <Drawer
         isOpen
         onClose={closeDrawer}
         icon={GitMerge}
         title="Sincronización"
         description="Auditoría de la relación catálogo ↔ proveedores"
         size="4xl"
       >
         <PageTabs tabs={TABS} value={tab} onChange={setTab} className="mb-4" />
         {tab === 'dashboard'  && <DashboardTab />}
         {tab === 'maestro'    && <MaestroTab />}
         {tab === 'pendientes' && <PendientesTab />}
       </Drawer>
     );
   };

   export default SincronizacionDrawer;
   ```

6. **Crear stubs vacíos** de los 3 tabs (placeholders):
   ```jsx
   // components/DashboardTab.jsx
   const DashboardTab = () => <div className="p-4 text-sm text-content-tertiary">Dashboard — pendiente Fase 2</div>;
   export default DashboardTab;
   ```
   Igual para `MaestroTab.jsx` y `PendientesTab.jsx`.

7. **Montar drawer global** en `src/Layout.jsx` (junto a `<UserPanel />`, `<ConfirmModal />`):
   ```jsx
   import SincronizacionDrawer from './modules/Sincronizacion/SincronizacionDrawer';
   // ...
   <SincronizacionDrawer />
   ```

8. **Agregar botón en `src/shared/Topbar.jsx`** entre Calculator y Bell:
   ```jsx
   import { GitMerge } from 'lucide-react';
   // ...
   <button
     onClick={() => openDrawer('SYNC_PANEL')}
     className="p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-inverse"
     title="Sincronización"
   >
     <GitMerge size={16} />
   </button>
   ```

#### Validación

- `npm run dev` → entrar a la app → click en el icono nuevo del Topbar → Drawer abre con tabs visibles (3 activos, 2 deshabilitados).
- Click en cada tab muestra el placeholder.
- Build limpio: `npm run build`.

#### Commit sugerido
`feat(sync): scaffold Sincronizacion module with Topbar entry`

---

### Fase 2 — Tab Dashboard (45-60 min)

**Objetivo**: KPIs visuales + barras de cobertura.

#### Pasos

1. **Implementar `DashboardTab.jsx`**:
   - 8 FlowCards (2 filas de 4) con: total MP, con proveedor, sin proveedor, pendientes, con 1 prov, con 2+ prov, duplicados detectados, ahorro potencial.
   - 2 barras de cobertura con `ProgressPill`: cobertura general (% MP con ≥1 prov), diversificación (% con ≥2).
   - Loading state con skeletons.

2. **Conectar al hook `useSincStats()`** (Fase 1).

3. **Si backend NO está listo**: el hook devuelve `placeholderData` definido en Fase 1. Adelantar Fase 3 (Tab Maestro) usando datos del endpoint existente `/catalogo`.

#### Spec visual

```jsx
const DashboardTab = () => {
  const { data: s, isLoading } = useSincStats();

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="flex flex-col gap-4">
      {/* Fila 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard icon={Layers} tone="info"    label="Total MP"        value={s.total_mp} />
        <FlowCard icon={Check}  tone="success" label="Con proveedor"   value={s.mp_con_proveedor} />
        <FlowCard icon={X}      tone="warning" label="Sin proveedor"   value={s.mp_sin_proveedor} />
        <FlowCard icon={Link2}  tone="danger"  label="Pendientes"      value={s.items_proveedor_pendientes} />
      </div>
      {/* Fila 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard icon={AlertTriangle} tone="warning" label="1 solo proveedor"  value={s.mp_un_solo_proveedor} sub="riesgo concentración" />
        <FlowCard icon={Network}       tone="success" label="2+ proveedores"    value={s.mp_dos_o_mas_proveedores} sub="diversificado" />
        <FlowCard icon={Copy}          tone="info"    label="Duplicados"        value={s.duplicados_potenciales} sub="pendiente depurar" />
        <FlowCard icon={TrendingDown}  tone="brand"   label="Ahorro potencial"  value={fmt(s.ahorro_potencial)} sub="cambiar a mejor prov" />
      </div>

      {/* Cobertura */}
      <div className="bg-surface-base border border-border-base rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-content-primary">Cobertura del catálogo</h3>
        <ProgressPill
          value={(s.mp_con_proveedor / s.total_mp) * 100}
          label="MP con al menos 1 proveedor"
          tone="success"
        />
        <ProgressPill
          value={(s.mp_dos_o_mas_proveedores / s.total_mp) * 100}
          label="MP con 2+ proveedores (diversificadas)"
          tone="info"
        />
      </div>
    </div>
  );
};
```

#### Validación
- Tab Dashboard muestra los 8 cards con datos (mock o reales).
- Las barras se llenan según porcentajes.
- Loading state se ve bien.

#### Commit
`feat(sync): implement Dashboard tab with KPIs and coverage`

---

### Fase 3 — Tab Maestro (60-90 min)

**Objetivo**: Tabla de MP con sus proveedores expandibles.

#### Pasos

1. **Implementar `MaestroTab.jsx`** con `ErpTable variant="cards"`:
   - Columnas: Código, Nombre, Tipo (StatusBadge), Stock, # Proveedores (badge), Mejor $/kg, Spread (%), Acciones.
   - Filtros: `SearchFilterBar` con búsqueda por nombre/código + filtro de cobertura (todos/sin proveedor/1 prov/2+ prov).
   - Click en fila → expandible mostrando lista de proveedores con sus precios (compacto).

2. **Hook `useSincMaestro(filters)`** que llama `/sincronizacion/maestro`. Si backend no está, usar `/catalogo` y calcular agregados en cliente.

3. **Acciones por fila**:
   - "Ver detalle" → abre `ItemDetailModal` existente (`Catalogo/components/ItemDetailModal.jsx`).
   - Si spread > 20% → mostrar `StatusBadge tone="warning"` con tooltip "Oportunidad de negociación".

#### Spec visual (esqueleto)

```jsx
const MaestroTab = () => {
  const [search, setSearch] = useState('');
  const [cobertura, setCobertura] = useState(''); // '', 'sin', 'uno', 'dos_mas'
  const { data, isLoading } = useSincMaestro({ search, cobertura });

  const columns = [
    { key: 'codigo',  label: 'Código', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'nombre',  label: 'Nombre' },
    { key: 'tipo',    label: 'Tipo', align: 'center',
      render: (v) => <StatusBadge tone={TIPO_TONE[v]} label={TIPO_LABEL[v]} dot={false} size="sm" />
    },
    { key: 'stock_total', label: 'Stock', align: 'right',
      render: (v) => <span className="tabular-nums">{fmt(v)} kg</span>
    },
    { key: 'proveedores_count', label: 'Prov.', align: 'center',
      render: (v) => <StatusBadge
        tone={v === 0 ? 'danger' : v === 1 ? 'warning' : 'success'}
        label={String(v)}
        icon={Users}
        dot={false}
        size="sm"
      />
    },
    { key: 'precio_min_kg', label: 'Mejor $/kg', align: 'right', render: fmtCOP },
    { key: 'spread_pct', label: 'Spread', align: 'right',
      render: (v) => v > 20
        ? <StatusBadge tone="warning" label={`+${v}%`} dot={false} size="sm" />
        : <span className="text-xs text-content-tertiary tabular-nums">+{v}%</span>
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <SearchFilterBar
        search={search} onSearch={setSearch}
        placeholder="Buscar MP por código o nombre..."
        filters={[
          { key: 'cobertura', label: 'Cobertura',
            options: [
              { value: 'sin',     label: 'Sin proveedor' },
              { value: 'uno',     label: '1 proveedor' },
              { value: 'dos_mas', label: '2+ proveedores' },
            ]
          }
        ]}
        values={{ cobertura }}
        onChange={(_, v) => setCobertura(v)}
      />
      <ErpTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        variant="cards"
        emptyMessage="No hay materias primas"
      />
    </div>
  );
};
```

#### Validación
- Tabla carga con datos (mock OK si backend pendiente).
- Filtro por cobertura funciona.
- Search filtra.
- Spread > 20% se ve resaltado.

#### Commit
`feat(sync): implement Maestro tab with MP-provider table`

---

### Fase 4 — Tab Pendientes (45-60 min)

**Objetivo**: Lista de `item_proveedor` sin vincular + sugerencias automáticas.

#### Pasos

1. **Implementar `PendientesTab.jsx`**:
   - Lista de cards (no tabla) — cada pendiente es una "tarjeta" con:
     - Info del item_proveedor (nombre, código, precio).
     - Info del proveedor (empresa).
     - **Sugerencias**: top 3 items_general con mayor score (mostrar `Sugerencia` cards).
     - Botones: "Vincular a sugerida" / "Buscar otra" (abre `ItemGeneralSearch`) / "Crear nueva MP".

2. **Crear `components/SugerenciaCard.jsx`** reutilizable.

3. **Conectar a `useSincPendientes()` hook**.

4. **Acción "Vincular"**:
   - Importar `useProveedores()` hook (ya existe en módulo Proveedores).
   - Llamar `vincularAsync({ id: pendiente.id_item_proveedor, data: { item_general_id: sugerencia.id } })`.
   - Invalidar query de pendientes para refrescar.

#### Spec visual

```jsx
const PendientesTab = () => {
  const { data: pendientes, isLoading } = useSincPendientes();
  const { vincularAsync } = useProveedores();

  if (isLoading) return <SkeletonList />;
  if (!pendientes?.length) return (
    <EmptyState
      icon={CheckCircle2}
      title="Todo sincronizado"
      description="No hay items de proveedor pendientes de vincular."
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {pendientes.map(item => (
        <div key={item.id_item_proveedor} className="bg-surface-base border border-border-base rounded-xl p-4 shadow-card">
          {/* Header del pendiente */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-semibold text-content-primary">{item.nombre}</p>
              <p className="text-xs text-content-tertiary mt-0.5">
                {item.codigo} · {item.nombre_empresa} · {fmt(item.precio_unitario)} / {item.unidad_compra_nombre}
              </p>
            </div>
            <StatusBadge tone="warning" label="Sin vincular" dot size="sm" />
          </div>

          {/* Sugerencias */}
          {item.sugerencias?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                Sugerencias automáticas
              </p>
              {item.sugerencias.map(s => (
                <SugerenciaCard
                  key={s.id_item_general}
                  sugerencia={s}
                  onVincular={() => vincularAsync({
                    id: item.id_item_proveedor,
                    data: { item_general_id: s.id_item_general }
                  })}
                />
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
            <Button size="sm" variant="secondary" icon={Search}>
              Buscar otra MP
            </Button>
            <Button size="sm" variant="ghost" icon={Plus}>
              Crear nueva MP
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Validación
- Lista de pendientes se carga.
- Click en "Vincular" hace la mutation y refresca.
- Empty state se ve cuando no hay pendientes.

#### Commit
`feat(sync): implement Pendientes tab with auto-suggestions`

---

### 🎉 Fin del MVP — Validación general

Antes de seguir con Fases 5-6, validar:

```bash
npm run build
```

Tabular: dashboard, maestro, pendientes deberían funcionar. Build limpio.

**Commit suggestion**: `feat(sync): MVP complete (dashboard + maestro + pendientes)`

---

### Fase 5 — Tab Duplicados (60-90 min, OPCIONAL post-MVP)

**Objetivo**: Detectar pares de MP similares para depurar.

#### Pasos

1. Habilitar tab en `SincronizacionDrawer.jsx` (quitar `disabled: true`).
2. Implementar `DuplicadosTab.jsx`:
   - Lista de pares (cards lado a lado).
   - Por cada par: scores, info de cada lado (proveedores, stock).
   - Acciones: "Marcar como diferentes" (ignore list local en localStorage) / "Merge" (deshabilitado en MVP, mostrar tooltip "Próximamente").

3. Backend: endpoint `/sincronizacion/duplicados` con algoritmo Levenshtein (ver spec arriba).

4. Si backend NO listo: calcular en cliente usando `levenshtein-edit-distance` (npm install si hace falta) o implementar manual. Tomar `data` de Tab Maestro como input.

#### Commit
`feat(sync): add Duplicados tab with similarity detection`

---

### Fase 6 — Tab Huérfanos (30-45 min, OPCIONAL post-MVP)

**Objetivo**: MP sin proveedores activos.

#### Pasos

1. Habilitar tab.
2. Implementar `HuerfanosTab.jsx`:
   - Tabla con MP huérfanas, última compra, stock actual.
   - Acción "Buscar en catálogo de proveedores" (busca por nombre en `item_proveedor` sin vincular → ofrece sugerencias).
   - Acción "Marcar como obsoleta" (requiere endpoint nuevo o flag en `item_general`).

3. Backend: endpoint `/sincronizacion/huerfanos`.

#### Commit
`feat(sync): add Huerfanos tab`

---

### Fase 7 — Polish y export (30 min, opcional)

- Botón "Exportar a Excel" en Tab Maestro (usar `xlsx` que ya está en deps).
- Botón "Imprimir reporte de cobertura" (jsPDF, ya está).
- Atajos de teclado: `Ctrl+Shift+S` abre el drawer.
- Animaciones de entrada por tab.

---

## Especificación detallada de endpoints (para backend dev)

> Cada uno con request, response, SQL referencia, errores posibles.

### `GET /api/sincronizacion/stats`

**Auth**: requiere token. Solo `admin` y `operador`.

**Request**: sin params.

**Response 200**:
```json
{
  "total_mp": 85,
  "mp_con_proveedor": 72,
  "mp_sin_proveedor": 13,
  "mp_un_solo_proveedor": 24,
  "mp_dos_o_mas_proveedores": 48,
  "items_proveedor_total": 234,
  "items_proveedor_pendientes": 8,
  "duplicados_potenciales": 3,
  "ahorro_potencial": 1250000
}
```

**SQL ejemplo**:
```sql
WITH mp_proveedores AS (
  SELECT ig.id_item_general, COUNT(DISTINCT ip.id_item_proveedor) AS prov_count
  FROM item_general ig
  LEFT JOIN item_proveedor ip ON ip.item_general_id = ig.id_item_general
  WHERE ig.tipo = 1
  GROUP BY ig.id_item_general
)
SELECT
  COUNT(*) AS total_mp,
  COUNT(*) FILTER (WHERE prov_count >= 1) AS mp_con_proveedor,
  COUNT(*) FILTER (WHERE prov_count = 0) AS mp_sin_proveedor,
  COUNT(*) FILTER (WHERE prov_count = 1) AS mp_un_solo_proveedor,
  COUNT(*) FILTER (WHERE prov_count >= 2) AS mp_dos_o_mas_proveedores
FROM mp_proveedores;

SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE item_general_id IS NULL) AS pendientes
FROM item_proveedor;
```

**Errores**:
- 401 si sin token.
- 403 si rol = visor.

### `GET /api/sincronizacion/maestro`

**Query params**:
- `search` (opcional): filtro por nombre o código.
- `cobertura` (opcional): `'sin' | 'uno' | 'dos_mas'`.
- `tipo` (opcional): `1` (MP), `2` (Insumo), default ambos.

**Response 200**: array de objetos como se especificó arriba.

**SQL**: ver bloque arriba.

### `GET /api/sincronizacion/pendientes`

**Sin params**.

**Response 200**: array con `sugerencias` populado (top 3 por score usando `ItemModel::buscarFuzzy` interno).

**Implementación PHP** (en pseudo-código):
```php
$pendientes = $db->query("SELECT ip.*, p.nombre_empresa, u.nombre AS unidad_compra_nombre
                          FROM item_proveedor ip
                          JOIN proveedor p ON p.id_proveedor = ip.proveedor_id
                          LEFT JOIN unidad u ON u.id_unidad = ip.unidad_compra_id
                          WHERE ip.item_general_id IS NULL
                          ORDER BY ip.creado_en DESC");

$itemModel = new ItemModel();
foreach ($pendientes as &$p) {
  $matches = $itemModel->buscarFuzzy($p['nombre'], [1, 2]);
  $p['sugerencias'] = array_slice($matches, 0, 3);
}
return $pendientes;
```

### `GET /api/sincronizacion/duplicados`

**Sin params**.

**Response 200**: array de pares.

**Algoritmo**: Levenshtein con normalización + bonus por categoría compartida (ver código PHP arriba).

**Performance**: si hay > 200 MP, el O(n²) puede tardar. Considerar cache o filtrar por categoría primero.

### `GET /api/sincronizacion/huerfanos`

**Sin params**.

**Response 200**: array de MP sin proveedor + métricas adicionales (última compra, stock).

---

## Apéndice A — Alternativa: módulo como página dedicada

Si después de probar el Drawer decidís que necesita más espacio:

1. Cambiar `SincronizacionDrawer.jsx` → `SincronizacionPage.jsx` (remover wrapper Drawer).
2. Agregar ruta `/sincronizacion` en `App.jsx`.
3. Reemplazar botón Topbar por entrada en `sidebarMenu.js`.

El código de los tabs se reutiliza 1:1.

---

## Apéndice B — Stack de archivos a crear

| Archivo | Líneas estimadas | Fase |
|---|---|---|
| `src/modules/Sincronizacion/SincronizacionDrawer.jsx` | ~60 | 1 |
| `src/modules/Sincronizacion/api/sincronizacionKeys.js` | ~15 | 1 |
| `src/modules/Sincronizacion/api/useSincronizacion.js` | ~80 | 1 |
| `src/modules/Sincronizacion/components/DashboardTab.jsx` | ~90 | 2 |
| `src/modules/Sincronizacion/components/MaestroTab.jsx` | ~150 | 3 |
| `src/modules/Sincronizacion/components/PendientesTab.jsx` | ~140 | 4 |
| `src/modules/Sincronizacion/components/SugerenciaCard.jsx` | ~50 | 4 |
| `src/modules/Sincronizacion/components/DuplicadosTab.jsx` | ~130 | 5 |
| `src/modules/Sincronizacion/components/HuerfanosTab.jsx` | ~100 | 6 |
| **Total estimado** | **~815 líneas** | |

Archivos modificados:
- `src/shared/Topbar.jsx` (+10 líneas).
- `src/Layout.jsx` (+2 líneas, montar Drawer global).
- `src/api/apiRoutes.js` (+10 líneas, namespace SINCRONIZACION).

---

## Apéndice C — Para retomar desde casa

### Cuando arranques

1. Abrí terminal en `pinca_frontend/`.
2. `npm run dev`.
3. Leé el `CLAUDE.md` (sección 1 + 12, ~5 min).
4. Volvé a este archivo.
5. Identificá en qué fase estás (mirá los commits o el código existente).
6. Procedé con la siguiente fase.

### Si te asistís con Claude/IA

Pegale este archivo + `CLAUDE.md` al inicio del prompt. El plan está diseñado para ser autocontenido — cualquier AI debería poder continuar sin contexto adicional.

### Decisiones que podés cambiar sin replantear

- **Nombre del módulo** — cambialo donde aparezca "Sincronización".
- **Icono** — cualquier de lucide-react: `GitMerge`, `Network`, `Link2`, `Database`, `Layers`.
- **Color del botón Topbar** — actualmente neutral (text-content-muted), podés ponerle un dot brand si querés llamar atención.

### Decisiones que requieren replantear si cambiás

- **Drawer vs Página** — afecta el wrapper raíz.
- **Endpoints `/sincronizacion/*`** vs reutilizar endpoints existentes — afecta los hooks.

---

## Checklist de implementación

```
□ Fase 0 — Pre-flight
□ Fase 1 — Scaffold (drawer, tabs, topbar button, hooks vacíos)
□ Fase 2 — Dashboard tab
□ Fase 3 — Maestro tab
□ Fase 4 — Pendientes tab
   ✦ MVP listo aquí — usable y demostrable
□ Fase 5 — Duplicados tab (opcional)
□ Fase 6 — Huérfanos tab (opcional)
□ Fase 7 — Polish (export, atajos)
```

---

**Última nota**: si encontrás bugs en el sistema durante la implementación (ej: un endpoint que retorna `null` cuando debería retornar `[]`), documentalo aquí mismo en un nuevo apéndice antes de seguir. Eso ayuda a la persona/Claude que retome después.

Las dos preguntas más críticas que dejé sin decisión (por si querés contestar antes de empezar mañana):
- ¿Los endpoints backend los hace tu dev PHP o yo cuando retomemos? (afecta si el frontend arranca con mocks o no).
- ¿La detección de duplicados va al MVP o se deja para fase 5? (afecta la urgencia del algoritmo Levenshtein).