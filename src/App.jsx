
import { BrowserRouter, Route, Routes } from "react-router";
import InventarioPage from "./modules/Inventario/InventarioPage";
import Layout from "./Layout";
import FormulacionesPage from "./modules/Formulaciones/FormulacionesPage";
import SedePage from "./modules/sedes/sedePage";
import BodegaPage from "./modules/Bodegas/BodegaPage";
import ProduccionPage from "./modules/Produccion/ProduccionPage";
import Prorrateo from "./modules/Prorrateo/Prorreateo";
import ClientePage from "./modules/Clientes/ClientePage";
import FacturasPage from "./modules/Facturas/FacturasPage";
import CotizacionesPage from "./modules/Cotizaciones/CotizacionesPage";
import PagosPage from "./modules/Pagos/PagosPage";
import RemisionesPage from "./modules/Remisiones/RemisionesPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SedePage />} />
          <Route path="/inventario/bodega/:id_bodega" element={<InventarioPage />} />
          <Route path="/formulaciones" element={<FormulacionesPage />} />
          <Route path="/instalaciones/bodegas/:id" element={<BodegaPage />} />
          <Route path="/produccion" element={<ProduccionPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/clientes" element={<ClientePage />} />
          <Route path="/prorrateo" element={<Prorrateo />} />
          
          {/* Nuevas Rutas */}
          <Route path="/cotizaciones" element={<CotizacionesPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/remisiones" element={<RemisionesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;