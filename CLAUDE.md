# GestorPinca — Contexto del Proyecto para Claude

> Pega este archivo al inicio de cada conversación nueva, o adjúntalo directamente.
> Actualízalo cada vez que agregues un módulo, cambies una convención o definas nuevas rutas.

---

## 1. Stack General

| Capa          | Tecnología                                                   |
|---------------|--------------------------------------------------------------|
| Frontend      | React + Vite, TanStack Query v5, Zustand, Tailwind CSS       |
| Backend       | PHP 8 + CodeIgniter 4 (RESTful)                              |
| Base de datos | MySQL 8 — `gestorpincadb`                                    |
| Auth          | JWT (header `Authorization: Bearer <token>`)                 |

---

## 2. Backend — CodeIgniter 4

### 2.1 Patrón de rutas

Todas las rutas viven bajo el grupo `api/`:

```
GET    api/{recurso}                    → index / listado
GET    api/{recurso}/{id}               → show / detalle
POST   api/{recurso}                    → create
PUT    api/{recurso}/{id}               → update
DELETE api/{recurso}/{id}               → delete
PATCH  api/{recurso}/{id}/estado        → cambio de estado puntual
POST   api/{recurso}/{id}/convertir     → acción especial
GET    api/{recurso}/{id}/detalle       → sub-recurso detalle
```

### 2.2 Rutas existentes (Routes.php)

```
USUARIOS        POST  api/login                    POST api/crear
EMPRESA         GET   api/empresa
ITEMS           GET|POST api/item_general           GET api/items
                GET|PUT|DELETE api/item_general/{id}
INSTALACIONES   CRUD  api/instalaciones
                GET   api/instalaciones/bodegas/{id}
BODEGAS         CRUD  api/bodegas
                POST  api/bodegas/item
                PUT   api/bodegas/item/{id}
                GET   api/bodegas/inventario/{id}
FORMULACIONES   GET   api/formulaciones
                GET   api/formulaciones/{id}
                GET   api/formulacion_item/{id}
                GET   api/formulaciones/costos/{id}
                GET   api/formulaciones/recalcular_costos/{id}/{segment}
PROVEEDORES     CRUD  api/proveedores
                GET   api/proveedor_items           GET api/proveedor_items/{id}
ITEM_PROV.      CRUD  api/item_proveedores
CLIENTES        CRUD  api/clientes
FACTURAS        CRUD  api/facturas
                GET   api/facturas/{id}/detalle
                GET   api/facturas/{id}/abonos
                GET   api/facturas/{id}/remision
                PATCH api/facturas/{id}/estado
INVENTARIO      POST  api/inventario/traspaso
COSTOS ITEM     PUT   api/costos_item/{id}
UNIDADES        CRUD  api/unidades
CATEGORIAS      GET   api/categorias
PREPARACIONES   GET|POST api/preparaciones
                GET   api/preparaciones/item/{id}
                GET|PUT  api/preparaciones/{id}
PAGOS CLIENTE   CRUD  api/pagos_cliente
COTIZACIONES    CRUD  api/cotizaciones
                GET   api/cotizaciones/{id}/detalle
                PATCH api/cotizaciones/{id}/estado
                POST  api/cotizaciones/{id}/convertir
REMISIONES      CRUD  api/remisiones
                GET   api/remisiones/{id}/detalle
                PATCH api/remisiones/{id}/estado
                POST  api/remisiones/{id}/convertir
```

### 2.3 BaseModel

Todos los modelos simples extienden `BaseModel`. Métodos disponibles:

```php
$this->get_all($table, $where = null)       // SELECT * FROM tabla
$this->get($id, $table)                     // SELECT por PK (id_{tabla})
$this->create_table($data, $table)          // INSERT — allowedFields dinámico
$this->update_table($id, $data, $table)     // UPDATE — allowedFields dinámico
$this->delete_table($id, $table)            // DELETE
```

La PK siempre sigue el patrón `id_{nombre_tabla}` (ej: `id_clientes`, `id_facturas`).

### 2.4 Patrón de Controller

```php
// Controller simple — usa BaseModel
class ClientesController extends ResourceController {
    protected $modelName = BaseModel::class;

    public function clientes() {
        $data = $this->model->get_all('clientes');
        return $this->respond($data);
    }
    public function create() {
        $data = json_decode($this->request->getBody(), true);
        $result = $this->model->create_table($data, 'clientes');
        return $result ? $this->respondCreated($result) : $this->fail($result);
    }
}

// Controller con modelo propio (lógica compleja)
class InventarioController extends ResourceController {
    protected $modelName = InventarioModel::class;
    // usa $this->model->metodoPropio(...)
}
```

### 2.5 Formato de respuesta del backend

```json
// Lista simple
[{ "id_clientes": 1, "nombre_empresa": "Acme" }]

// Lista paginada (cuando aplica)
{
  "data": [],
  "pagination": { "totalPages": 5, "totalItems": 98, "currentPage": 1, "perPage": 20 }
}

// Error
{ "status": 400, "message": "Descripción del error" }
```

> ⚠️ El interceptor de axios maneja errores globalmente — `toast.error(message)` automático y logout en 401.

---

## 3. Frontend — React

### 3.1 apiClient (axios)

```js
// src/api/apiClient.js
// baseURL = VITE_API_BASE_URL (env)
// Interceptor request  → inyecta Bearer token desde localStorage
// Interceptor response → retorna response.data directamente
//                        toast.error automático en error
//                        logout + redirect /login en 401
```

Por esto en los hooks se escribe:
```js
queryFn: () => apiClient.get('/clientes')  // ya devuelve el body, sin .data
```

### 3.2 TanStack Query — patrón de hooks

**Estructura de archivos por módulo:**
```
src/modules/{modulo}/
├── api/
│   ├── {modulo}Keys.js       ← query keys
│   └── use{Modulo}.js        ← hooks (useQuery + useMutation)
├── components/               ← componentes del módulo
├── services/                 ← lógica pura JS (formateo, validación, cálculos)
└── {Modulo}Page.jsx          ← página principal
```

**Query keys (patrón):**
```js
export const clienteKeys = {
  all:     ['clientes'],
  lists:   () => [...clienteKeys.all, 'list'],
  details: () => [...clienteKeys.all, 'detail'],
  detail:  (id) => [...clienteKeys.details(), id?.toString()],
};
```

**Hook patrón completo:**
```js
export const useClientes = (id = null) => {
  const queryClient = useQueryClient();

  const queryClientes = useQuery({
    queryKey: clienteKeys.lists(),
    queryFn:  () => apiClient.get('/clientes'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/clientes', data),
    onSuccess: (response, variables) => {
      // 1. Update optimista
      queryClient.setQueryData(clienteKeys.lists(), (old) =>
        [...(old ?? []), response?.data ?? variables]
      );
      toast.success('Cliente creado');
      // 2. Revalidar
      queryClient.invalidateQueries({ queryKey: clienteKeys.lists() });
    },
    onError: () => toast.error('Error al crear'),
  });

  return {
    clientes:         queryClientes.data ?? [],
    isLoadingClientes: queryClientes.isLoading,
    create:           createMutation.mutate,
    createAsync:      createMutation.mutateAsync,
    isCreating:       createMutation.isPending,
  };
};
```

### 3.3 Estado global — Zustand (`useBoundStore`)

```js
import { useBoundStore } from '../../../store/useBoundStore';

// Drawer (formularios laterales)
openDrawer('CLIENTE_FORM')          // crear — payload vacío
openDrawer('CLIENTE_FORM', item)    // editar — payload con datos

// Modal de confirmación global
openConfirm({
  title:     'Eliminar Cliente',
  message:   '¿Estás seguro?',
  onConfirm: async () => await removeAsync(id),
});
```

### 3.4 Componentes compartidos (`src/shared/`)

| Componente       | Uso                                                              |
|------------------|------------------------------------------------------------------|
| `HeaderSection`  | Cabecera de página — props: `title, subtitle, description, icon, breadcrumbs` |
| `Button`         | Botón estándar — props: `variant, icon, onClick, disabled`       |
| `ButtonSquare`   | Botón cuadrado con solo ícono                                    |
| `SkeletonRow`    | Fila skeleton para tablas                                        |
| `SkeletonCard`   | Card skeleton para grids                                         |
| `ConfirmModal`   | Modal de confirmación global (se activa con `openConfirm`)       |
| `ERPTable`       | Tabla estándar — props: `columns, data, isLoading, emptyMessage, onRowClick` |
| `StatusBadge`    | Badge de estado — prop: `estado` (string)                        |
| `SummaryCard`    | Card de métrica — props: `label, value, icon, color, sub`        |
| `SearchFilterBar`| Barra de búsqueda + selects de filtro                            |
| `AmountDisplay`  | Monto formateado — props: `value, color`                         |
| `DetailDrawer`   | Panel lateral de detalle — props: `isOpen, onClose, title, subtitle, width` |

### 3.5 Utilidades globales

```js
// src/utils/formatters.js
fmt(value)                          // → "$ 1.500.000" (alias corto usado en módulos nuevos)
formatoPesoColombiano(value)        // → "$ 1.500.000" (alias legacy, módulos viejos)
formatLetterDate(isoString)         // → "15 mar 2025"

// src/modules/inventario/services/pagination.js
getPaginationRange(currentPage, totalPages)  // → [1, 2, '...', 8, 9]
```

### 3.6 Patrones de UI — dos tipos de drawer

#### Patrón A — Formulario (FacturaForm, ClienteForm)
Para crear/editar. Estructura manual con overlay + panel fixed.
```jsx
// Wrapper externo decide si montar — nunca useEffect para resetear
const MiForm = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload      = useBoundStore((s) => s.drawerPayload);
  const closeDrawer  = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'MI_FORM') return null;
  return <MiFormContent key={payload?.id ?? 'new'} editData={payload} closeDrawer={closeDrawer} />;
};

// Contenido — estado inicializado con lazy init, key lo resetea
const MiFormContent = ({ editData, closeDrawer }) => (
  <>
    <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={closeDrawer} />
    <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50"> ... </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5"> ... </div>
      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2"> ... </div>
    </div>
  </>
);
```

#### Patrón B — Detalle (FacturaDrawer, HistorialPagos)
Para ver información. Usa el componente `DetailDrawer` de shared.
```jsx
const MiDrawer = ({ itemId, isOpen, onClose }) => {
  const { data, isLoading } = useAlgunHook(itemId);
  return (
    <DetailDrawer isOpen={isOpen} onClose={onClose} title="Título" subtitle="subtítulo" width="lg">
      {isLoading ? (
        <div className="p-5 space-y-3">
          {[90, 75, 88].map((w, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : (
        <>{/* contenido */}</>
      )}
    </DetailDrawer>
  );
};
```

### 3.7 Patrón de columnas ERPTable

```js
const columns = [
  {
    key: 'numero',
    label: 'Número',
    render: (v) => <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{v}</span>,
  },
  {
    key: 'estado',
    label: 'Estado',
    align: 'center',                          // 'left' | 'center' | 'right'
    render: (v) => <StatusBadge estado={v} />,
  },
  {
    key: 'acciones',
    label: '',
    align: 'right',
    render: (_, row) => (                     // segundo arg = fila completa
      <button onClick={(e) => { e.stopPropagation(); handleAccion(row); }}>...</button>
    ),
  },
];
```

### 3.8 Patrón de página con tab (FacturacionTab)

Las páginas con pestañas usan componentes Tab separados en lugar de una sola Page grande:
```
ComercialPage.jsx          ← página con tabs (Cotizaciones | Remisiones | Facturas)
└── components/
    ├── CotizacionesTab.jsx
    ├── RemisionesTab.jsx
    └── FacturacionTab.jsx ← cada tab es autónoma: estado, filtros, métricas propias
```

Cada Tab sigue esta estructura interna:
```jsx
const MiTab = () => {
  const { data, isLoading } = useHook();
  const { openConfirm } = useBoundStore();
  const [search, setSearch]   = useState('');
  const [filters, setFilters] = useState({ estado: '' });
  const [selected, setSelected] = useState(null);

  const metrics  = useMemo(() => { /* calcular sobre data */ }, [data]);
  const filtered = useMemo(() => { /* filtrar data */ }, [data, search, filters]);

  const columns = [ /* definición de columnas */ ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{/* SummaryCards */}</div>
      <SearchFilterBar ... />
      <ERPTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={setSelected} />
      <MiDrawer itemId={selected?.id} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
```

### 3.9 Convenciones de estilo

- Paleta principal: `gray-*` (módulos nuevos). `zinc-*` solo en módulos viejos (inventario).
- Botón acción ver:     `p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600`
- Botón acción pago:    `p-1.5 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600`
- Botón acción eliminar:`p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600`
- Código/número:        `font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded`
- Fechas:               `text-[12px] font-semibold uppercase` con `formatLetterDate()`
- Saldo positivo:       `text-amber-700 font-mono text-sm tabular-nums`
- Saldo en cero:        `text-emerald-600 font-mono text-sm tabular-nums`
- `fieldset` + `legend` para agrupar campos en formularios
- `focus:outline-none focus:ring-2 focus:ring-gray-900` en todos los inputs

---

## 4. Módulos — Estado actual

| Módulo        | Frontend          | Backend            | Notas                                              |
|---------------|-------------------|--------------------|----------------------------------------------------|
| Inventario    | ✅ Completo       | ✅ Completo        | Tabla zinc, traspasos, bodegas                     |
| Clientes      | ✅ Completo       | ✅ Completo        | Cards grid + CRUD drawer                           |
| Formulaciones | ✅ Completo       | ✅ Completo        | Costos, recalcular por volumen                     |
| Preparaciones | ✅ Completo       | ✅ Completo        | 0=Pendiente 1=En proceso 2=Completada 3=Cancelada  |
| Proveedores   | ✅ Completo       | ✅ Completo        |                                                    |
| Comercial     | ✅ Completo       | ✅ Completo        | Tab: Cotizaciones + Remisiones + Facturas          |
| Cartera       | 🔧 En desarrollo  | ✅ Rutas listas    | FacturasTable + ModalRegistrarPago + HistorialPagos|
| Cotizaciones  | ✅ En Comercial   | ✅ Rutas listas    | Flujo: Borrador→Enviada→Aceptada→Convertida        |
| Remisiones    | ✅ En Comercial   | ✅ Rutas listas    | Flujo: Pendiente→Facturada→Anulada                 |

---

## 5. Base de datos — Tablas clave

### Módulo Cartera / Comercial

```sql
facturas              id_facturas, numero, cliente_id, fecha_emision, fecha_vencimiento,
                      total, saldo_pendiente, subtotal, descuento, impuestos, retencion,
                      estado (Pendiente|Pagada), observaciones, movimiento_inventario_id, creado_en

facturas_detalle      id_detalle, facturas_id, descripcion, cantidad, precio_unit,
                      descuento_pct, subtotal

pagos_cliente         id_pagos_cliente, fecha_pago, monto, metodo_pago,
                      tipo (pago_total|abono), numero_referencia, observaciones,
                      clientes_id, facturas_id, creado_en

cotizaciones          id_cotizaciones, numero, cliente_id, fecha_cotizacion, fecha_vencimiento,
                      subtotal, descuento, impuestos, retencion, total,
                      estado (Borrador|Enviada|Aceptada|Rechazada|Vencida|Convertida),
                      observaciones, facturas_id, creado_en

cotizaciones_detalle  id_detalle, cotizaciones_id, descripcion, cantidad,
                      precio_unit, descuento_pct, subtotal

remisiones            id_remisiones, numero, cliente_id, fecha_remision,
                      estado (Pendiente|Facturada|Anulada), direccion_entrega,
                      observaciones, facturas_id, movimiento_inventario_id, creado_en

remisiones_detalle    id_detalle, remisiones_id, descripcion, cantidad,
                      precio_unit, subtotal
```

### Otras tablas relevantes

```sql
clientes       id_clientes, nombre_encargado, nombre_empresa, numero_documento,
               direccion, telefono, email, tipo (1=Empresa|2=Particular), estado (1=activo|2=inactivo)

item_general   id_item_general, nombre, codigo, tipo (0=producto|1=materia prima|2=insumo),
               categoria_id, unidad_id, costo_produccion

inventario     id_inventario, cantidad, item_general_id, bodegas_id,
               movimiento_inventario_id, tipo (1=ingreso|2=egreso), estado, fecha_update
```

---

## 6. Archivos del módulo Cartera

```
src/modules/cartera/
├── CarteraPage.jsx                ← página principal standalone con HeaderSection
├── carteraKeys.js                 ← solo keys de pagos_cliente (facturas usan facturaKeys)
├── carteraService.js              ← calcularDiasMora, getEstadoEfectivo, getBadgeClases,
│                                     METODOS_PAGO, ICONO_METODO, validarPago, fmt
├── useCartera.js                  ← usePagosCliente(clienteId), usePagos()
└── components/
    ├── FacturasTable.jsx          ← ERPTable + SummaryCards + SearchFilterBar
    │                                 usa useFactura() de comercial/facturas
    │                                 filtrado client-side con useMemo
    ├── ModalRegistrarPago.jsx     ← Patrón A (formulario): overlay + panel fixed right
    │                                 wrapper externo hace if(!factura) return null
    │                                 RegistrarPagoContent recibe key={factura.id_facturas}
    └── HistorialPagos.jsx         ← Patrón B (detalle): DetailDrawer isOpen/onClose
                                      usa usePagosCliente(clienteId)
```

**Hooks y rutas API usados en Cartera:**
```
useFactura()                     → GET api/facturas (lista completa, filtrado client-side)
useFactura(id)                   → GET api/facturas/{id}/abonos (en FacturaDrawer)
usePagosCliente(clienteId)       → GET api/pagos_cliente?cliente_id={id}
usePagos().registrarPagoAsync()  → POST api/pagos_cliente
usePagos().eliminarPagoAsync()   → DELETE api/pagos_cliente/{id}
```

**Invalidaciones tras registrar un pago:**
```
facturaKeys.lists()              → refresca saldo_pendiente en tabla
facturaKeys.abonos(facturaId)    → refresca abonos en FacturaDrawer
carteraKeys.pagos()              → refresca historial en HistorialPagos
```

---

## 7. Archivos del módulo Comercial (referencia de patrones)

```
src/modules/comercial/
├── ComercialPage.jsx              ← página con tabs
└── components/
    ├── FacturacionTab.jsx         ← REFERENCIA de patrón Tab completo
    ├── FacturaDrawer.jsx          ← REFERENCIA de patrón B (DetailDrawer)
    ├── FacturaForm.jsx            ← REFERENCIA de patrón A (form drawer manual)
    └── api/
        ├── facturaKeys.js         ← keys: lists, details, detail, detalle, abonos, remision
        └── useFactura.js          ← useFactura(id?) con todas las sub-queries
```

---

## 8. Cómo usar este archivo

**Al iniciar una sesión nueva:**
1. Adjunta `CLAUDE.md` + los archivos relevantes a la tarea
2. Describe qué quieres hacer

**Qué adjuntar según la tarea:**

| Tarea                          | Adjuntar además de CLAUDE.md                        |
|--------------------------------|-----------------------------------------------------|
| Nuevo módulo frontend          | Archivo Page vacío + componente de referencia       |
| Bug en componente              | El archivo con el bug                               |
| Nuevo endpoint backend         | El Controller y Model del módulo                    |
| Trabajo con DB                 | El schema SQL (`gestorpincadb.sql`)                  |
| Modificar archivo ya generado  | El archivo generado a modificar                     |
| Nuevo drawer de formulario     | `FacturaForm.jsx` como referencia                   |
| Nuevo drawer de detalle        | `FacturaDrawer.jsx` como referencia                 |
| Nueva tab en página existente  | `FacturacionTab.jsx` como referencia                |

---

*Última actualización: Cartera en desarrollo — FacturasTable, ModalRegistrarPago (patrón A), HistorialPagos (patrón B) generados y alineados con diseño de Comercial.*