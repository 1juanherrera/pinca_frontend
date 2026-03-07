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

const FormulacionesPage = () => {

  const [selectedId, setSelectedId] = useState("");
  const [nuevoVolumen, setNuevoVolumen] = useState("");

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
      
      {/* 🟢 TOP: KPIs (Tu estilo original de tarjetas con Gap-4) */}
      <KpiCard 
        formulaciones={formulaciones} 
        productDetail={costosBase} 
        recalculatedData={costosRecalculados} 
      />

      {/* 🔍 SEARCH: Buscador Maestro */}
      <ProductSelect
        formulaciones={formulaciones} 
        selectedProduct={selectedId} 
        onProductSelect={(id) => {
            setSelectedId(id);
            setNuevoVolumen(""); // Resetear simulación al cambiar producto
        }} 
        loading={isLoading}
        onClearSelection={() => {
          setSelectedId("");
          setNuevoVolumen("");
        }}   
      />

      {/* 🏗️ MAIN BODY: Grid de 12 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* COLUMNA IZQUIERDA (4/12): Parámetros y Costos Indirectos */}
        <div className="lg:col-span-4 flex flex-col gap-2">
           
           {/* 🟣 CALCULADORA (Purple Edition) */}
           <CostCalculator 
              productDetail={costosBase}
              selectedProductData={selectedProductData}
              setNuevoVolumen={setNuevoVolumen}
              recalculatedData={costosRecalculados}
              isRecalculating={isRecalculating}
              handleRecalcular={() => {}} // Disparado por el hook
           />

           {/* 🔵 ESPECIFICACIONES (Teal Edition) */}
           <ProductSpecificationsTable 
                selectedProductData={selectedProductData}
                productDetail={costosBase}
           />
        </div>

        {/* COLUMNA DERECHA (8/12): El Corazón de la Producción */}
        <div className="lg:col-span-8 flex flex-col gap-2">
           
           {/* 🔵 TABLA DE FORMULACIÓN (Blue Edition) */}
           <FormulacionesTable
                selectedProductData={selectedProductData}
                productDetail={costosBase}
                recalculatedData={costosRecalculados}
           />

          {/* 🟢 DESGLOSE DE COSTOS (Emerald Edition) */}
           <CostProductsTable 
              selectedProductData={selectedProductData}
              productDetail={costosBase}
              recalculatedData={costosRecalculados}
           />

        </div>
      </div>
      <FormCostProducts />
      <PreparationModal />
    </div>
  );
};

export default FormulacionesPage;