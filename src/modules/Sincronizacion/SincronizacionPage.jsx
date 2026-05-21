import { useEffect, useState } from 'react';
import {
  GitMerge, LayoutDashboard, Table2, Link2, Copy, Ban,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import { useBoundStore } from '../../store/useBoundStore';
import DashboardTab from './components/DashboardTab';
import MaestroTab from './components/MaestroTab';
import PendientesTab from './components/PendientesTab';
import DuplicadosTab from './components/DuplicadosTab';
import HuerfanosTab from './components/HuerfanosTab';
import { useSincStats } from './api/useSincronizacion';

const TABS_BASE = [
  { key: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'maestro',    label: 'Maestro',     icon: Table2 },
  { key: 'pendientes', label: 'Pendientes',  icon: Link2 },
  { key: 'duplicados', label: 'Duplicados',  icon: Copy },
  { key: 'huerfanos',  label: 'Huérfanos',   icon: Ban },
];

const SincronizacionPage = () => {
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const [tab, setTab]  = useState('dashboard');
  const { data: stats } = useSincStats();

  useEffect(() => { setActiveTitle?.('Sincronización'); }, [setActiveTitle]);

  // Mostrar contadores en los tabs cuando estén disponibles
  const tabs = TABS_BASE.map((t) => {
    if (!stats) return t;
    if (t.key === 'pendientes') return { ...t, count: stats.items_proveedor_pendientes };
    if (t.key === 'duplicados') return { ...t, count: stats.duplicados_potenciales };
    if (t.key === 'huerfanos')  return { ...t, count: stats.mp_sin_proveedor };
    return t;
  });

  return (
    <div className="relative flex flex-col w-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HeaderSection
          title="Sincronización"
          subtitle="Auditoría de la relación catálogo ↔ proveedores"
          icon={GitMerge}
          breadcrumbs={[{ label: 'Inicio', path: '/' }, { label: 'Sincronización' }]}
        />
      </div>

      <PageTabs tabs={tabs} value={tab} onChange={setTab} size="lg" />

      <div className="pt-1">
        {tab === 'dashboard'  && <DashboardTab />}
        {tab === 'maestro'    && <MaestroTab />}
        {tab === 'pendientes' && <PendientesTab />}
        {tab === 'duplicados' && <DuplicadosTab />}
        {tab === 'huerfanos'  && <HuerfanosTab />}
      </div>
    </div>
  );
};

export default SincronizacionPage;
