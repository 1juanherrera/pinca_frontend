import { useState, useEffect } from "react";
import KpiCard from "./components/KpiCard";
import { ProductSelect } from "./components/ProductSelect";
import { CostCalculator } from "./components/CostCalculator";
import { FormulacionesTable } from "./components/FormulacionesTable";
import { ProductSpecificationsTable } from "./components/ProductSpecificationsTable";
import { CostProductsTable } from "./components/CostProductsTable";
import { useFormulaciones } from "./api/useFormulaciones";
import FormCostProducts from "./components/FormCostProducts ";
import { PreparationModal } from "./components/preparationModal";
import FormulacionModal from "./components/FormulacionModal";
import ClonarFormulacionModal from "./components/ClonarFormulacionModal";
import VersionesByItemWrapper from "./components/VersionesByItemWrapper";
import { FlaskConical, History, Plus } from "lucide-react";
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

  const {
    formulaciones,
    isLoading,
    isCalculating,
    costosBase,
    costosRecalculados,
    isRecalculating,
    proveedoresFormulacion,
    isLoadingProveedores,
    costosProveedor,
    isLoadingCostosProveedor,
    opcionesIngredientes,
  } = useFormulaciones(selectedId, nuevoVolumen, null, selectedProveedorId);

  useEffect(() => {
    const materias = opcionesIngredientes?.materias;
    if (!materias || Object.keys(materias).length === 0) return;

    const auto = {};
    for (const [mpId, data] of Object.entries(materias)) {
      if (data.opciones?.length > 0) {
        auto[mpId] = data.opciones[0].id_item_proveedor;
      }
    }

    if (Object.keys(auto).length > 0) {
      setSeleccionPorIngrediente(auto);
    }
  }, [opcionesIngredientes]);

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
      />

      {/* Buscador Maestro */}
      <ProductSelect
        formulaciones={formulaciones}
        selectedProduct={selectedId}
        onProductSelect={(id) => {
          setSelectedId(id);
          setNuevoVolumen("");
          setSelectedProveedorId(null);
          setSeleccionPorIngrediente({});
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

        <div className="lg:col-span-4 flex flex-col gap-4">
          <CostCalculator
            productDetail={costosBase}
            selectedProductData={selectedProductData}
            setNuevoVolumen={setNuevoVolumen}
            recalculatedData={costosRecalculados}
            isRecalculating={isRecalculating}
            handleRecalcular={() => {}}
          />
          <ProductSpecificationsTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            isLoading={isCalculating}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <FormulacionesTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
            costosProveedor={costosProveedor}
            opcionesIngredientes={opcionesIngredientes}
            seleccionPorIngrediente={seleccionPorIngrediente}
            onSeleccionIngrediente={setSeleccionPorIngrediente}
            onEdit={(itemId) => { setEditItemId(itemId); setModalFormulacion(true); }}
            onClone={(prod) => setClonarFrom(prod)}
            isLoading={isCalculating}
          />
          <CostProductsTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
            costosProveedor={costosProveedor}
            isLoading={isCalculating}
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
