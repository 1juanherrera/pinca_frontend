
import { BrowserRouter, Route, Routes } from "react-router";
import InventarioPage from "./modules/Inventario/InventarioPage";
import Layout from "./Layout";
import FormulacionesPage from "./modules/Formulaciones/FormulacionesPage";


const App = () => {
    
    return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/formulaciones" element={<FormulacionesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    )
}

export default App;