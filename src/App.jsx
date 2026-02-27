
import { BrowserRouter, Route, Routes } from "react-router";
// import InventarioPage from "./modules/Inventario/InventarioPage";
import Layout from "./Layout";
import FormulacionesPage from "./modules/Formulaciones/FormulacionesPage";
import SedePage from "./modules/Sedes/sedePage";
import BodegaPage from "./modules/Bodegas/BodegaPage";

const App = () => {
    
    return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
        <Route path="/" element={<SedePage />} />
          {/* <Route path="/inventario" element={<InventarioPage />} /> */}
          <Route path="/formulaciones" element={<FormulacionesPage />} />
          <Route path="/instalaciones/bodegas/:id" element={<BodegaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    )
}

export default App;