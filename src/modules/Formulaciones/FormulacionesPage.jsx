import { useState } from "react";
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
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "../../shared/Button";
import HeaderSection from "../../shared/HeaderSection";

const FormulacionesPage = () => {

  const [selectedId,       setSelectedId]       = useState("");
  const [nuevoVolumen,     setNuevoVolumen]      = useState("");
  const [modalFormulacion, setModalFormulacion]  = useState(false);
  const [selectedProveedorId, setSelectedProveedorId] = useState(null);

  const [seleccionPorIngrediente, setSeleccionPorIngrediente] = useState({});

  const {
    formulaciones,
    isLoading,
    costosBase,
    costosRecalculados,
    isRecalculating,
    proveedoresFormulacion,
    isLoadingProveedores,
    costosProveedor,
    isLoadingCostosProveedor,
    opcionesIngredientes,
  } = useFormulaciones(selectedId, nuevoVolumen, null, selectedProveedorId);

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
        <Button
          variant="black"
          icon={Plus}
          onClick={() => setModalFormulacion(true)}
        >
          Nueva Formulación
        </Button>
      </div>

      {/* KPIs */}
      <KpiCard
        formulaciones={formulaciones}
        productDetail={costosBase}
        recalculatedData={costosRecalculados}
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
          />
          <CostProductsTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
            costosProveedor={costosProveedor}
          />
        </div>
      </div>

      <FormCostProducts />
      <PreparationModal />

      <FormulacionModal
        isOpen={modalFormulacion}
        onClose={() => setModalFormulacion(false)}
      />

    </div>
  );
};

export default FormulacionesPage;
