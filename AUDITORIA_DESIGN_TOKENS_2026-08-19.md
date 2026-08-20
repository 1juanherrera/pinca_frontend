# Auditoria Design Tokens — 2026-08-19

> Hallazgos de la auditoria de consistencia del design system Pinca 2.0.
> Estado general: **bien migrado** (0 clases Tailwind hardcoded, 528+ usos de tokens).
> Pendientes: 6 puntos documentados abajo, ordenados por impacto.

---

## 1. Bug: Chart invisible en dark mode

**Archivo:** `src/modules/CostosProduccion/components/EvolucionCostoChart.jsx` (lineas 131-144)

**Problema:** Recharts no soporta CSS custom properties. Los colores estan hardcoded como `stroke="#18181B"` y `dot={{ fill: '#18181B' }}`. En dark mode el fondo de la card es `#18181B` (surface-base), asi que la linea del chart desaparece.

**Fix:** Leer los tokens via `getComputedStyle` al montar el componente y pasarlos como props a `<Line>`.

```jsx
// Ejemplo de solucion
const root = document.documentElement;
const cs = getComputedStyle(root);
const inkColor = cs.getPropertyValue('--content-primary').trim();
const successColor = cs.getPropertyValue('--semantic-success').trim();

<Line stroke={inkColor} dot={{ fill: inkColor }} ... />
<Line stroke={successColor} dot={{ fill: successColor }} ... />
```

---

## 2. Bug: Barra de progreso invisible en ordenes de preparacion

**Archivo:** `src/modules/Formulaciones/components/preparationModal/PreparationSubComponents.jsx` (linea 30)

**Problema:** La barra de progreso intenta oscurecer el color de fondo manipulando strings:

```jsx
cfg.bg.replace('50', '300').replace('100', '400')
```

Pero `cfg.bg` viene de `UNIT_CONFIG` (en `constants.js`) que usa tokens como `bg-semantic-info-subtle`, no clases numericas de Tailwind. El `.replace()` no matchea nada, la barra queda del mismo color que el fondo y es invisible.

**Fix:** Agregar una propiedad `barColor` a cada entrada de `UNIT_CONFIG` en `constants.js`:

```js
// constants.js — agregar barColor a cada entrada
'GALON': { ..., barColor: 'bg-semantic-success' },
'CUÑETE': { ..., barColor: 'bg-semantic-info' },
// etc.
```

```jsx
// PreparationSubComponents.jsx linea 30 — reemplazar
<div className={`h-full ${cfg.barColor ?? 'bg-content-secondary'}`} style={{ width: `${pct}%` }} />
```

---

## 3. Modales custom sin componente shared (7 archivos)

**Problema:** Estos archivos construyen su propio overlay `fixed inset-0` en vez de usar `<Modal>` o `<Drawer>` de `src/shared/`. Consecuencias: sin focus-trap, z-index potencialmente inconsistente, animaciones diferentes, y en un caso `bg-black/60` en vez del token `bg-surface-overlay`.

| Archivo | Tipo actual | Deberia ser |
|---|---|---|
| `src/modules/Catalogo/components/CatalogoForm.jsx:65` | Modal custom | `<Modal size="lg">` |
| `src/modules/Comercial/Cotizaciones/components/CotizacionForm.jsx:225` | Drawer custom | `<Drawer size="4xl">` |
| `src/modules/Comercial/Remisiones/components/RemisionForm.jsx:177` | Drawer custom | `<Drawer size="3xl">` |
| `src/modules/Formulaciones/components/FormCostProducts.jsx:70` | Modal custom | `<Modal size="sm">` |
| `src/modules/Formulaciones/components/ClonarFormulacionModal.jsx` | Modal custom | `<Modal size="sm">` |
| `src/modules/Formulaciones/components/preparationModal.jsx` | Modal custom | `<Modal size="xl">` o `<Drawer>` |
| `src/modules/Trazabilidad/components/ExportTrazabilidad.jsx:80` | Overlay con `bg-black/60` | Usar `bg-surface-overlay` |

**Fix por archivo:**
- Reemplazar el markup del overlay por el componente shared correspondiente
- Mover el contenido al `children` del componente
- Mover los botones de accion al prop `footer`
- El caso de ExportTrazabilidad solo necesita cambiar `bg-black/60` por `bg-surface-overlay`

**Nota:** CotizacionForm y RemisionForm son drawers complejos con formularios de multiples pasos. Migrarlos requiere verificar que el estado interno y los handlers de cierre (confirmacion de descarte) funcionen dentro de `<Drawer>`.

---

## 4. Tablas raw sin ErpTable (34 de 55 tablas)

**Problema:** 34 tablas usan `<table>` directo y 21 usan `<ErpTable>`. Las raw no tienen density toggle, variante cards, sticky header, ni estados empty/loading unificados.

**Archivos con tablas raw** (excluye PDFs):

| Modulo | Archivo | Notas |
|---|---|---|
| Catalogo | `CatalogoTable.jsx:94` | Tabla principal del catalogo |
| Catalogo | `SuministroTab.jsx:27` | Tab de suministro |
| Clientes | `ClientesTable.jsx:103` | Tabla de clientes |
| Comercial | `CotizacionDrawer.jsx:157` | Items dentro del drawer (read-only) |
| Comercial | `CotizacionForm/ItemsTable.jsx:31` | Items editables del form |
| Comercial | `FacturaDrawer.jsx:107` | Items dentro del drawer (read-only) |
| Comercial | `FacturaForm/ItemsTable.jsx:20` | Items editables del form |
| Comercial | `RemisionDrawer.jsx:153` | Items dentro del drawer (read-only) |
| Comercial | `RemisionForm/ItemsTable.jsx:31` | Items editables del form |
| Compras | `CalculadoraProrrateo.jsx:87` | Tabla de calculo |
| Compras | `RecibirProrrateoModal.jsx:169` | Items a recibir |
| Configuracion | `AuditoriaTab.jsx:105, :172` | Dos tablas de auditoria |
| Configuracion | `CatalogosTab.jsx:95, :175` | Dos tablas de catalogos |
| Configuracion | `NumeracionTab/SeriesActivasTable.jsx:7` | Series de numeracion |
| Configuracion | `NumeracionTab/SeriesInactivasDetails.jsx:11` | Series inactivas |
| CostosProduccion | `CostoDetalleDrawer/IngredientesTable.jsx:9` | Ingredientes del costo |
| Formulaciones | `FormulacionesTable.jsx:219` | Tabla anidada de ingredientes |
| Formulaciones | `CostProductsTable.jsx:124` | Productos asociados |

**Criterio para migrar:** Las tablas dentro de drawers/modales en modo read-only y las tablas editables de formularios son candidatas mas dificiles (necesitan inputs inline). Priorizar las tablas principales de listado (CatalogoTable, ClientesTable, AuditoriaTab, CatalogosTab).

---

## 5. Border radius hardcoded (no tokenizado)

**Problema:** Los componentes usan clases Tailwind default (`rounded-lg`, `rounded-xl`) en vez de los tokens custom (`rounded-radius-lg`, etc.). Los valores coinciden hoy, pero no estan centralizados.

**Conteo actual:**
- `rounded-lg`: 347 usos
- `rounded-xl`: 268 usos
- `rounded-md`: 95 usos
- `rounded-full`: 111 usos
- `rounded-pill`: 21 usos (el unico token adoptado)

**Fix:** Esto es deuda de mantenibilidad, no un bug visual. Si se decide centralizar, hacer un sed masivo verificando que los valores target coincidan:

```bash
# Solo ejecutar despues de verificar que --radius-lg == 0.75rem (12px) == rounded-lg de Tailwind
# En Tailwind v4 el @theme ya los expone, asi que rounded-lg ya usa --radius-lg si esta definido
```

**Nota:** En Tailwind v4, si `--radius-lg` esta definido en `@theme`, la clase `rounded-lg` **ya lo usa automaticamente**. Verificar con `npx tailwindcss --help` o inspeccionando el CSS compilado. Si es asi, esto no es un problema real.

---

## 6. PDFs con paleta propia (aceptable, no requiere accion)

Los archivos `*FactusStyleDoc.jsx` y `generarPdfProduccion.js` usan hex hardcoded porque `@react-pdf` y jsPDF no soportan CSS custom properties. Los valores estan alineados con la paleta de tokens. No requiere cambios.

**Archivos (referencia):**
- `src/modules/Comercial/Cotizaciones/components/CotizacionFactusStyleDoc.jsx`
- `src/modules/Comercial/Remisiones/components/RemisionFactusStyleDoc.jsx`
- `src/modules/Compras/components/OrdenCompraFactusStyleDoc.jsx`
- `src/modules/Nomina/components/DocComprobantePago.jsx`
- `src/modules/Pagos/components/ReciboFactusStyleDoc.jsx`
- `src/modules/Produccion/components/ExportProduccion/generarPdfProduccion.js`

---

## Orden sugerido de ejecucion

| Prioridad | Item | Esfuerzo | Tipo |
|---|---|---|---|
| 1 | Chart dark mode (#1) | 15 min | Bug visual |
| 2 | Barra progreso ordenes (#2) | 10 min | Bug visual |
| 3 | ExportTrazabilidad overlay (#3 parcial) | 5 min | Token fix |
| 4 | Modales custom → shared (#3) | 2-3 horas | Refactor |
| 5 | Tablas principales → ErpTable (#4) | 3-4 horas | Refactor |
| 6 | Verificar radius en Tailwind v4 (#5) | 15 min | Investigacion |
