import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import Layout from "./Layout";
import SedePage from "./modules/sedes/sedePage";
import { Login } from "./modules/Login/Login";
import NotFound from "./shared/NotFound";
import PageTitle from "./shared/PageTitle";
import { FullPageLoader } from "./shared/Loader";

// Lazy-loaded: módulos pesados que cargamos on-demand para reducir bundle inicial.
// SedePage queda eager porque es entry point del flujo después de login.
const InventarioPage       = lazy(() => import("./modules/Inventario/InventarioPage"));
const FormulacionesPage    = lazy(() => import("./modules/Formulaciones/FormulacionesPage"));
const BodegaPage           = lazy(() => import("./modules/Bodegas/BodegaPage"));
const ProduccionPage       = lazy(() => import("./modules/Produccion/ProduccionPage"));
const ClientePage          = lazy(() => import("./modules/Clientes/ClientePage"));
const PagosPage            = lazy(() => import("./modules/Pagos/PagosPage"));
const ComercialPage        = lazy(() => import("./modules/Comercial/ComercialPage"));
const ComprasPage          = lazy(() => import("./modules/Compras/ComprasPage"));
const ProveedoresPage      = lazy(() => import("./modules/Proveedores/ProveedoresPage"));
const CarteraPage          = lazy(() => import("./modules/Cartera/CarteraPage"));
const MovimientosPage      = lazy(() => import("./modules/Movimientos/MovimientosPage"));
const RentabilidadPage     = lazy(() => import("./modules/Rentabilidad/RentabilidadPage"));
const CatalogoPage         = lazy(() => import("./modules/Catalogo/CatalogoPage"));
const SincronizacionPage   = lazy(() => import("./modules/Sincronizacion/SincronizacionPage"));
const PanelPrincipalPage   = lazy(() => import("./modules/Dashboard/PanelPrincipalPage"));
const ConfiguracionPage    = lazy(() => import("./modules/Configuracion/ConfiguracionPage"));
const TrazabilidadPage     = lazy(() => import("./modules/Trazabilidad/TrazabilidadPage"));
const CostosProduccionPage = lazy(() => import("./modules/CostosProduccion/CostosProduccionPage"));
const NominaPage           = lazy(() => import("./modules/Nomina/NominaPage"));

const App = () => {
  return (
    <BrowserRouter>
      <PageTitle />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route element={<Suspense fallback={<FullPageLoader message="Cargando módulo" />}><PageOutlet /></Suspense>}>
            <Route path="/"      element={<PanelPrincipalPage />} />
            <Route path="/sedes" element={<SedePage />} />
            <Route path="/inventario/bodega/:id_bodega" element={<InventarioPage />} />
            <Route path="/formulaciones" element={<FormulacionesPage />} />
            <Route path="/instalaciones/bodegas/:id" element={<BodegaPage />} />
            <Route path="/produccion" element={<ProduccionPage />} />
            <Route path="/clientes" element={<ClientePage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />

            {/* Nuevas Rutas */}
            <Route path="/pagos" element={<PagosPage />} />
            <Route path="/cartera" element={<CarteraPage />} />
            <Route path="/comercial" element={<ComercialPage />} />
            <Route path="/compras" element={<ComprasPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
            <Route path="/movimientos" element={<MovimientosPage />} />
            <Route path="/rentabilidad" element={<RentabilidadPage />} />
            <Route path="/sincronizacion" element={<SincronizacionPage />} />
            <Route path="/configuracion"  element={<ConfiguracionPage />} />
            <Route path="/trazabilidad"   element={<TrazabilidadPage />} />
            <Route path="/costos-produccion" element={<CostosProduccionPage />} />
            <Route path="/nomina" element={<NominaPage />} />
            {/* /costos fue absorbido por /rentabilidad — redirect preserva bookmarks viejos */}
            <Route path="/costos" element={<Navigate to="/rentabilidad" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

// Wrapper para que Suspense englobe todas las rutas lazy bajo Layout.
// Renderiza el outlet de las rutas hijas.
const PageOutlet = () => <Outlet />;

export default App;
