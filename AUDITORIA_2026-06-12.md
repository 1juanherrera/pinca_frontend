# Auditoría frontend — 2026-06-12

Sesión de auditoría + fixes, validada (`npm run build` ✓, `npx eslint .` 0 errores). Revisión completa
de los 8 grupos de módulos.

## ✅ Fixes aplicados (build ✓ + ESLint 0 errores)

### Críticos
- **Casing `facturakeys.js` → `facturaKeys.js`**: los imports usaban K mayúscula → **rompía el build en
  Linux/CI**. Renombrado con git.
- **`FormulacionModal`**: los porcentajes de la receta (BOM) se mandaban en `0` fijo → toda fórmula
  quedaba sin composición. Ahora calcula `cantidad/pesoTotal×100`. Además el input en gramos preserva
  precisión sub-gramo (`toFixed(3)` en vez de `Math.round`).
- **`CotizacionDrawer`**: destructuraba `detalle` pero el hook devuelve `items` → ítems siempre vacíos.
- **`CotizacionesTab`**: botón "Convertir a factura" usaba estado `'Aceptada'` (inexistente) → `'Aprobada'`.

### Bugs / correctness
- **`usePago`**: invalida `carteraKeys` en create/update/delete → el Dashboard de Cartera ya no queda
  con datos viejos al registrar pago desde el módulo Pagos.
- **`OrdenForm`**: al cambiar de proveedor limpia las líneas (eran de otro proveedor → OC corrupta).
- **`useGananciasVentas` + `GananciasVentasTable`**: margen sobre `subtotal` (base sin IVA), no `total`;
  y se eliminó la "ganancia inventada del 30%" cuando falla un detalle (ahora marca costo desconocido).
- **`useLoteSugerido` + `useCompras`**: id normalizado a string en queryKey/invalidaciones (lote no stale).
- **`preparationModal` / `CombinacionForm`**: costos indirectos con el shape correcto → ahora se persisten.
- **`formatLetterDate` / `carteraService.formatFecha`**: guarda contra fechas inválidas/con hora (no crash).
- **`NotasCreditoDrawer`**: `totalActivas` filtra `!== 'Anulada'` (coherente) + `Number()||0`.
- **`ModalRegistrarPago`**: guard de doble submit (no pago duplicado).
- **`PanelPrincipalPage`**: margen `null` → tono `neutral` (no falsa alarma roja).
- **`InventarioGlobal`**: KPI "Valor inventario" no da `NaN` (guard de null en dos `reduce`).
- **`DashboardCartera`**: tono de mora con rama muerta arreglada.
- **`CotizacionForm` / `FacturaForm`**: clamp de descuento (no IVA/total negativos) + `||0` (no `NaN`).
- **`OrdenDrawer` / `OrdenesTab`**: muestran el IVA REAL de la OC (`iva_pct`/`total_con_iva`), no recalculado.
- **`ClienteForm`**: `String(payload.tipo ?? '2')` (antes `String(null)` daba `"null"`).
- **`useConfiguracion` / `useNumeracion`**: fallback `|| msg` en errores (shape `{ok,msg}` del backend).
- **`Modal` / `Drawer`**: 2 directivas `eslint-disable` muertas eliminadas.

### Limpieza
- **Componentes huérfanos eliminados**: `ConteoRapidoModal.jsx`, `ItemForm.jsx` (cero referencias;
  llamaban funciones inexistentes — crash si se montaban).

## 🟡 Lo que falta (frontend)
- **Inserción optimista** usa `response.data` cuando apiClient ya desenvolvió `.data` (varios hooks de
  Cartera/Pagos/Clientes) → fila malformada hasta el refetch.
- **`saldoPendiente` congelado** al abrir el drawer de NC/Gestiones (valida contra saldo viejo).
- **Hooks muertos** que apuntan a rutas inexistentes/deshabilitadas: `useUpdateItem` (`PUT /bodegas/item`)
  y el delete de `usePreparaciones` (`DELETE /preparaciones/:id`). Sin uso hoy; borrar o reapuntar si se
  cablean. (Las preparaciones se cancelan con estado=3, no se borran.)
- **Duplicación**: formateadores COP en 6+ lugares; `SearchSelect` duplicado byte a byte en los 3 forms
  comerciales; keys por índice en tablas editables; focus-trap faltante en `ConfirmModal`/`SessionExpiryModal`.
- **10 warnings ESLint** (`exhaustive-deps`/`incompatible-library`) — varios intencionales.

> Detalle completo (con backend) en `../AUDITORIA_2026-06-12.md` (raíz del monorepo).
