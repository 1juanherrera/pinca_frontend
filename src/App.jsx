
import { BrowserRouter, Route, Routes } from "react-router";
import InventarioPage from "./modules/Inventario/InventarioPage";
import Layout from "./Layout";
import FormulacionesPage from "./modules/Formulaciones/FormulacionesPage";
import SedePage from "./modules/sedes/sedePage";
import BodegaPage from "./modules/Bodegas/BodegaPage";
import ProduccionPage from "./modules/Produccion/ProduccionPage";
import Prorrateo from "./modules/Prorrateo/Prorreateo";

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
          <Route path="/prorrateo" element={<Prorrateo />} />
        </Route>
      </Routes>
    </BrowserRouter>
    )
}

export default App;