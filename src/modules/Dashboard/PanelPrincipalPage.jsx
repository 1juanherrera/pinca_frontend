import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import { useBoundStore } from '../../store/useBoundStore';
import { useDashboard } from './api/useDashboard';
import { useConfigValue } from '../Configuracion/api/useConfiguracion';
import SkeletonGrid from './PanelPrincipalPage/SkeletonGrid';
import KpisHero from './PanelPrincipalPage/KpisHero';
import KpisSecundarios from './PanelPrincipalPage/KpisSecundarios';
import AlertaStockCritico from './PanelPrincipalPage/AlertaStockCritico';
import ActividadHoyCard from './PanelPrincipalPage/ActividadHoyCard';
import SaludCarteraCard from './PanelPrincipalPage/SaludCarteraCard';
import TablasResumen from './PanelPrincipalPage/TablasResumen';

const PanelPrincipalPage = () => {
  const navigate = useNavigate();
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const user = useBoundStore((s) => s.user);
  const { data, isLoading, isFetching, refetch, lastUpdated } = useDashboard();

  // Umbrales configurables
  const stockCriticoDias  = useConfigValue('stock_critico_dias',  7);
  const margenObjetivoPct = useConfigValue('margen_objetivo_pct', 20);
  const margenMinimoPct   = useConfigValue('margen_minimo_pct',   10);

  useEffect(() => { setActiveTitle?.('Panel Principal'); }, [setActiveTitle]);

  if (isLoading || !data) {
    return (
      <div className="relative flex flex-col w-full gap-4">
        <HeaderSection
          title={`Hola${(user?.nombre || user?.username) ? `, ${user.nombre || user.username}` : ''}`}
          subtitle="Panel principal"
          icon={LayoutDashboard}
        />
        <SkeletonGrid />
      </div>
    );
  }

  const {
    cartera, aging_resumen, top_deudores, sincronizacion,
    ventas_mes, cotizaciones, ocs_pendientes, mp_criticas,
    produccion_curso, movimientos_hoy, top_descripciones, rentabilidad
  } = data;

  // Salud de cartera: porcentaje de cartera corriente sobre el total.
  const totalCartera = cartera?.total_cartera ?? 0;
  const carteraCorrientePct = totalCartera > 0
    ? ((aging_resumen?.corriente ?? 0) / totalCartera) * 100
    : 100;

  return (
    <div className="relative flex flex-col w-full gap-5">
      {/* Header con saludo y refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HeaderSection
          title={`Hola${(user?.nombre || user?.username) ? `, ${user.nombre || user.username}` : ''}`}
          subtitle="Panel principal"
          icon={LayoutDashboard}
        />
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-content-tertiary">
              Actualizado{' '}
              {new Date(lastUpdated).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            variant="secondary" size="sm" icon={RefreshCw}
            onClick={() => refetch()} loading={isFetching}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <KpisHero
        navigate={navigate} ventas_mes={ventas_mes} cartera={cartera}
        ocs_pendientes={ocs_pendientes} mp_criticas={mp_criticas}
        stockCriticoDias={stockCriticoDias}
      />

      <KpisSecundarios
        navigate={navigate} produccion_curso={produccion_curso} cotizaciones={cotizaciones}
        sincronizacion={sincronizacion} rentabilidad={rentabilidad}
        margenObjetivoPct={margenObjetivoPct} margenMinimoPct={margenMinimoPct}
      />

      <AlertaStockCritico navigate={navigate} mp_criticas={mp_criticas} />

      {/* ─── FILA 3 — Movimientos del día + Cobertura cartera ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ActividadHoyCard navigate={navigate} movimientos_hoy={movimientos_hoy} />
        <SaludCarteraCard
          totalCartera={totalCartera} carteraCorrientePct={carteraCorrientePct}
          aging_resumen={aging_resumen} cartera={cartera}
        />
      </div>

      <TablasResumen
        navigate={navigate} top_deudores={top_deudores} mp_criticas={mp_criticas}
        top_descripciones={top_descripciones}
      />
    </div>
  );
};

export default PanelPrincipalPage;
