import { useState } from "react";
import KpiCard from "./components/KpiCard";
import { ProductSelect } from "./components/ProductSelect";
import { CostCalculator } from "./components/CostCalculator";
import { FormulacionesTable } from "./components/FormulacionesTable";
import { ProductSpecificationsTable } from "./components/ProductSpecificationsTable";
import { CostProductsTable } from "./components/CostProductsTable";
import { useFormulaciones } from "./api/useFormulaciones";
import FormCostProducts from "./components/FormCostProducts";
import { PreparationModal } from "./components/preparationModal";
import FormulacionModal from "./components/FormulacionModal";
import ClonarFormulacionModal from "./components/ClonarFormulacionModal";
import VersionesByItemWrapper from "./components/VersionesByItemWrapper";
import { FlaskConical, History, Plus, Archive, Tag } from "lucide-react";
import { Button } from "../../shared/Button";
import HeaderSection from "../../shared/HeaderSection";

const FormulacionesPage = () => {

  const [selectedId,       setSelectedId]       = useState("");
  const [nuevoVolumen,     setNuevoVolumen]      = useState("");
  const [modalFormulacion, setModalFormulacion]  = useState(false);
  const [editItemId,       setEditItemId]        = useState(null);
  const [selectedProveedorId, setSelectedProveedorId] = useState(null);
  const [historialItemId,  setHistorialItemId]  = useState(null);
  const [clonarFrom,       setClonarFrom]       = useState(null);

  const [seleccionPorIngrediente, setSeleccionPorIngrediente] = useState({});
  const [totalUnificadoMP, setTotalUnificadoMP] = useState(null);

  // Modo de cálculo del costo en la tabla:
  //   - 'real':  promedio ponderado de las capas (lo que ya pagué — incluye prorrateo).
  //   - 'lista': precio vigente del proveedor más barato (lo que costaría reponer).
  // Default 'real' para que las fórmulas reflejen el costo histórico de inventario.
  const [costMode, setCostMode] = useState('real');

  const {
    formulaciones,
    isLoading,
    isCalculating,
    costosBase,
    costosRecalculados,
    isRecalculating,
    costosProveedor,
    opcionesIngredientes,
  } = useFormulaciones(selectedId, nuevoVolumen, null, selectedProveedorId);

  // Auto-seleccionar el proveedor más barato por ingrediente cuando cargan las opciones.
  // opciones ya vienen ordenadas precio_por_kg ASC desde el backend → opciones[0] es el más barato.
  // Patrón "snapshot en render" (en vez de useEffect): re-siembra la selección SOLO cuando
  // opcionesIngredientes cambia de referencia (nuevo producto / recarga del backend). No pisa
  // los cambios manuales del usuario entre recargas. Mismo comportamiento que el useEffect previo,
  // sin el warning react-hooks/set-state-in-effect.
  const [lastOpciones, setLastOpciones] = useState(null);
  if (opcionesIngredientes?.materias && opcionesIngredientes !== lastOpciones) {
    setLastOpciones(opcionesIngredientes);
    const autoSeleccion = {};
    Object.entries(opcionesIngredientes.materias).forEach(([mpId, matInfo]) => {
      if (matInfo?.opciones?.length > 0) {
        autoSeleccion[mpId] = matInfo.opciones[0].id_item_proveedor;
      }
    });
    if (Object.keys(autoSeleccion).length > 0) {
      setSeleccionPorIngrediente(autoSeleccion);
    }
  }

  const selectedProductData = formulaciones.find(
    (f) => String(f.id_item_general) === String(selectedId)
  );

  return (
    <div className="flex flex-col w-full gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Formulaciones"
          subtitle="Producción"
          description="Gestión de fórmulas y costos de productos"
          icon={FlaskConical}
          breadcrumbs={[
            { label: 'Producción' },
            { label: 'Formulaciones', path: '/formulaciones' },
          ]}
        />
        <div className="flex items-center gap-2">
          {selectedId && (
            <Button
              variant="secondary"
              icon={History}
              onClick={() => setHistorialItemId(selectedId)}
            >
              Historial de versiones
            </Button>
          )}
          <Button
            variant="black"
            icon={Plus}
            onClick={() => setModalFormulacion(true)}
          >
            Nueva Formulación
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <KpiCard
        formulaciones={formulaciones}
        productDetail={costosBase}
        recalculatedData={costosRecalculados}
        isLoading={isLoading}
        totalUnificadoMP={totalUnificadoMP}
      />

      {/* Buscador Maestro */}
      <ProductSelect
        formulaciones={formulaciones}
        selectedProduct={selectedId}
        onProductSelect={(id) => {
          setSelectedId(id);
          setNuevoVolumen("");
          setSelectedProveedorId(null);
          setSeleccionPorIngrediente({});  // se repoblará automáticamente al cargar opcionesIngredientes
          setTotalUnificadoMP(null);
        }}
        loading={isLoading}
        onClearSelection={() => {
          setSelectedId("");
          setNuevoVolumen("");
          setSelectedProveedorId(null);
          setSeleccionPorIngrediente({});
        }}
      />

      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        <div className="lg:col-span-3 flex flex-col gap-4">
          <CostCalculator
            key={selectedId}
            productDetail={costosBase}
            selectedProductData={selectedProductData}
            setNuevoVolumen={setNuevoVolumen}
            recalculatedData={costosRecalculados}
            isRecalculating={isRecalculating}
            handleRecalcular={() => {}}
            totalUnificadoMP={totalUnificadoMP}
          />
          <ProductSpecificationsTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            isLoading={isCalculating}
          />
        </div>

        <div className="lg:col-span-9 flex flex-col gap-4">
          {/* Toggle: Costo real (capas) vs Costo lista (proveedor) ─────────
              Decide qué fuente de precio usa la tabla por default. El usuario
              puede igual sobreescribir un ingrediente individual seleccionando
              proveedor en el dropdown de cada fila. */}
          {selectedId && (
            <div className="bg-surface-base rounded-xl border border-border-subtle shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-content-primary">Fuente del costo</p>
                <p className="text-[10px] text-content-tertiary leading-snug mt-0.5">
                  {costMode === 'real'
                    ? 'Promedio ponderado de las capas de inventario — refleja lo que ya pagaste (incluye prorrateo).'
                    : 'Precio vigente del proveedor más barato por ingrediente — útil para cotizar reposición.'}
                </p>
              </div>
              <div className="inline-flex items-center rounded-lg border border-border-base p-0.5 bg-surface-muted/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setCostMode('real')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    costMode === 'real'
                      ? 'bg-surface-base text-content-primary shadow-sm'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title="Costo real — promedio ponderado de inventario"
                >
                  <Archive size={11} /> Costo real
                </button>
                <button
                  type="button"
                  onClick={() => setCostMode('lista')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                    costMode === 'lista'
                      ? 'bg-surface-base text-content-primary shadow-sm'
                      : 'text-content-muted hover:text-content-secondary'
                  }`}
                  title="Costo lista — precio de reposición del proveedor"
                >
                  <Tag size={11} /> Costo lista
                </button>
              </div>
            </div>
          )}

          <FormulacionesTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
            costosProveedor={costosProveedor}
            opcionesIngredientes={opcionesIngredientes}
            seleccionPorIngrediente={seleccionPorIngrediente}
            onSeleccionIngrediente={setSeleccionPorIngrediente}
            costMode={costMode}
            onEdit={(itemId) => { setEditItemId(itemId); setModalFormulacion(true); }}
            onClone={(prod) => setClonarFrom(prod)}
            isLoading={isCalculating}
            onTotalUnificado={setTotalUnificadoMP}
          />
          <CostProductsTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
            costosProveedor={costosProveedor}
            isLoading={isCalculating}
            totalUnificadoMP={totalUnificadoMP}
          />
        </div>
      </div>

      <FormCostProducts />
      <PreparationModal />

      <FormulacionModal
        isOpen={modalFormulacion}
        onClose={() => { setModalFormulacion(false); setEditItemId(null); }}
        itemId={editItemId}
      />

      {historialItemId && (
        <VersionesByItemWrapper
          itemGeneralId={historialItemId}
          onClose={() => setHistorialItemId(null)}
        />
      )}

      {clonarFrom && (
        <ClonarFormulacionModal
          from={clonarFrom}
          onClose={() => setClonarFrom(null)}
          onCloned={(destino) => setSelectedId(String(destino.id_item_general))}
        />
      )}

    </div>
  );
};

export default FormulacionesPage;
