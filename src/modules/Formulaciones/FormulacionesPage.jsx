import { CostCalculator } from "./components/CostCalculator";
import KpiCard from "./components/KpiCard";
import { ProductSelect } from "./components/ProductSelect";

const FormulacionesPage = () => {
  
  return (
    <div className="flex flex-col gap-3 w-full mt-1">
        <KpiCard />
        <ProductSelect />
        <div className="flex flex-col gap-3 w-full mt-1">
            <CostCalculator />
        </div>
    </div>
  )
}

export default FormulacionesPage;
