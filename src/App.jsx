
import { BrowserRouter, Route, Routes } from "react-router";
import InventarioPage from "./modules/Inventario/InventarioPage";
import Layout from "./Layout";
import FormulacionesPage from "./modules/Formulaciones/FormulacionesPage";
import SedePage from "./modules/sedes/sedePage";
import BodegaPage from "./modules/Bodegas/BodegaPage";
import ProduccionPage from "./modules/Produccion/ProduccionPage";
import Prorrateo from "./modules/Prorrateo/Prorrateo";
import ClientePage from "./modules/Clientes/ClientePage";
import PagosPage from "./modules/Pagos/PagosPage";
import ComercialPage from "./modules/Comercial/ComercialPage";
import ComprasPage from "./modules/Compras/ComprasPage";
import ProveedoresPage from "./modules/Proveedores/ProveedoresPage";
import CarteraPage from "./modules/Cartera/CarteraPage";
import { Login } from "./modules/Login/Login";
import MovimientosPage from "./modules/Movimientos/MovimientosPage";
import RentabilidadPage from "./modules/Rentabilidad/RentabilidadPage";
import CatalogoPage from "./modules/Catalogo/CatalogoPage";
import TamboresPage from "./modules/Tambores/TamboresPage";
import NotFound from "./shared/NotFound";
import PageTitle from "./shared/PageTitle";
import InventarioGlobalPage from "./modules/InventarioGlobal/InventarioGlobalPage";

const App = () => {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<SedePage />} />
          <Route path="/inventario/bodega/:id_bodega" element={<InventarioPage />} />
          <Route path="/formulaciones" element={<FormulacionesPage />} />
          <Route path="/instalaciones/bodegas/:id" element={<BodegaPage />} />
          <Route path="/produccion" element={<ProduccionPage />} />
          <Route path="/clientes" element={<ClientePage />} />
          <Route path="/prorrateo" element={<Prorrateo />} />
          <Route path="/catalogo" element={<CatalogoPage />} />

          {/* Nuevas Rutas */}
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/cartera" element={<CarteraPage />} />
          <Route path="/comercial" element={<ComercialPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/movimientos" element={<MovimientosPage />} />
          <Route path="/rentabilidad" element={<RentabilidadPage />} />
          <Route path="/tambores" element={<TamboresPage />} />
          <Route path="/inventario-global" element={<InventarioGlobalPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;