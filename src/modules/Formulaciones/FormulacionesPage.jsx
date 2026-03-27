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
import { FlaskConical } from "lucide-react";
import { Button } from "../../shared/Button";

const FormulacionesPage = () => {

  const [selectedId,       setSelectedId]       = useState("");
  const [nuevoVolumen,     setNuevoVolumen]      = useState("");
  const [modalFormulacion, setModalFormulacion]  = useState(false); // ✅

  const { 
    formulaciones, 
    isLoading, 
    costosBase, 
    costosRecalculados, 
    isRecalculating 
  } = useFormulaciones(selectedId, nuevoVolumen);

  const selectedProductData = formulaciones.find(
    (f) => String(f.id_item_general) === String(selectedId)
  );

  return (
    <div className="flex flex-col w-full gap-2">
      
      {/* Header con botón Nueva Formulación */}
      <div className="flex items-center justify-between">
        <KpiCard 
          formulaciones={formulaciones} 
          productDetail={costosBase} 
          recalculatedData={costosRecalculados} 
        />

        {/* ✅ Botón Nueva Formulación */}
        <div className="shrink-0 pl-4">
          <Button
            variant="black"
            icon={FlaskConical}
            onClick={() => setModalFormulacion(true)}
          >
            Nueva Formulación
          </Button>
        </div>
      </div>

      {/* Buscador Maestro */}
      <ProductSelect
        formulaciones={formulaciones} 
        selectedProduct={selectedId} 
        onProductSelect={(id) => {
          setSelectedId(id);
          setNuevoVolumen("");
        }} 
        loading={isLoading}
        onClearSelection={() => {
          setSelectedId("");
          setNuevoVolumen("");
        }}   
      />

      {/* Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        <div className="lg:col-span-4 flex flex-col gap-2">
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

        <div className="lg:col-span-8 flex flex-col gap-2">
          <FormulacionesTable
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
          />
          <CostProductsTable 
            selectedProductData={selectedProductData}
            productDetail={costosBase}
            recalculatedData={costosRecalculados}
          />
        </div>
      </div>

      <FormCostProducts />
      <PreparationModal />

      {/* ✅ Modal Formulación */}
      <FormulacionModal
        isOpen={modalFormulacion}
        onClose={() => setModalFormulacion(false)}
      />

    </div>
  );
};

export default FormulacionesPage;