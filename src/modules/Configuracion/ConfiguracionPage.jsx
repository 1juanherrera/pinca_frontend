import { useEffect, useState } from 'react';
import {
  Settings, Receipt, AlertTriangle, FileDigit, Layers, ShieldCheck, Building2,
  Lock, DollarSign,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import TopProgressBar from '../../shared/TopProgressBar';
import { useBoundStore } from '../../store/useBoundStore';
import { useConfiguracion } from './api/useConfiguracion';
import TributariaTab  from './components/TributariaTab';
import UmbralesTab    from './components/UmbralesTab';
import NumeracionTab  from './components/NumeracionTab';
import CatalogosTab   from './components/CatalogosTab';
import AuditoriaTab   from './components/AuditoriaTab';
import EmpresaTab     from './components/EmpresaTab';
import SeguridadTab   from './components/SeguridadTab';
import FinancieroTab  from './components/FinancieroTab';

const TABS = [
  { key: 'empresa',     label: 'Empresa',     icon: Building2 },
  { key: 'tributaria',  label: 'Tributaria',  icon: Receipt },
  { key: 'financiero',  label: 'Financiero',  icon: DollarSign },
  { key: 'umbrales',    label: 'Umbrales',    icon: AlertTriangle },
  { key: 'numeracion',  label: 'Numeración',  icon: FileDigit },
  { key: 'catalogos',   label: 'Catálogos',   icon: Layers },
  { key: 'seguridad',   label: 'Seguridad',   icon: Lock },
  { key: 'auditoria',   label: 'Auditoría',   icon: ShieldCheck },
];

const ConfiguracionPage = () => {
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const user           = useBoundStore((s) => s.user);
  const [tab, setTab]  = useState('empresa');
  const { isLoading, isFetching } = useConfiguracion();

  useEffect(() => { setActiveTitle?.('Configuración'); }, [setActiveTitle]);

  const esAdmin = user?.rol === 'admin';

  return (
    <div className="relative flex flex-col w-full gap-4">
      <TopProgressBar active={isLoading || isFetching} />

      <HeaderSection
        title="Configuración del sistema"
        subtitle="Parámetros globales: tributaria, umbrales, numeración y más"
        icon={Settings}
        breadcrumbs={[{ label: 'Sistema' }, { label: 'Configuración' }]}
      />

      {!esAdmin && (
        <div className="flex items-start gap-2.5 rounded-xl border border-semantic-warning/15 bg-semantic-warning-subtle/60 px-4 py-2.5 text-xs text-semantic-warning-fg">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="leading-relaxed">
            Estás viendo la configuración en modo <strong>solo lectura</strong>. Solo los administradores pueden modificar estos valores.
          </span>
        </div>
      )}

      <PageTabs tabs={TABS} value={tab} onChange={setTab} size="lg" />

      <div className="pt-1">
        {tab === 'empresa'    && <EmpresaTab />}
        {tab === 'tributaria' && <TributariaTab />}
        {tab === 'financiero' && <FinancieroTab />}
        {tab === 'seguridad'  && <SeguridadTab />}
        {tab === 'umbrales' && <UmbralesTab />}
        {tab === 'numeracion' && <NumeracionTab />}
        {tab === 'catalogos' && <CatalogosTab />}
        {tab === 'auditoria' && <AuditoriaTab />}
      </div>
    </div>
  );
};

export default ConfiguracionPage;
