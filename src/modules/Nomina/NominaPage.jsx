import { useState } from 'react';
import { Wallet, Users, CalendarDays } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import EmpleadosTab from './components/EmpleadosTab';
import PeriodosTab from './components/PeriodosTab';
import EmpleadoForm from './components/EmpleadoForm';
import ExportDesprendible from './components/ExportDesprendible';

const TABS = [
  { key: 'empleados', label: 'Empleados', icon: Users },
  { key: 'periodos',  label: 'Liquidaciones', icon: CalendarDays },
];

const NominaPage = () => {
  const [tab, setTab] = useState('empleados');

  return (
    <div className="flex flex-col w-full gap-4">
      <HeaderSection
        title="Nómina"
        subtitle="Recursos Humanos"
        description="Empleados y liquidación de nómina por período"
        icon={Wallet}
        breadcrumbs={[{ label: 'RRHH' }, { label: 'Nómina', path: '/nomina' }]}
      />

      <PageTabs tabs={TABS} value={tab} onChange={setTab} variant="underline" />

      {tab === 'empleados' ? <EmpleadosTab /> : <PeriodosTab />}

      {/* Drawer/modal globales (se auto-montan según activeDrawer) */}
      <EmpleadoForm />
      <ExportDesprendible />
    </div>
  );
};

export default NominaPage;
