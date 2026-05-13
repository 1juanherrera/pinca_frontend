import { useState } from 'react';
import { CheckCircle2, Plus, Building2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import { Button } from '../../../shared/Button';
import { useProveedores } from '../../Proveedores/api/useProveedores';
import { fmt } from '../../../utils/formatters';
import SugerenciaCard from './SugerenciaCard';
import { useSincPendientes } from '../api/useSincronizacion';
import { sincKeys } from '../api/sincronizacionKeys';

const SkeletonList = () => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-32 rounded-xl bg-surface-muted animate-pulse" />
    ))}
  </div>
);

const PendientesTab = () => {
  const queryClient = useQueryClient();
  const { data: pendientes, isLoading } = useSincPendientes();
  const { vincularAsync, isVinculando } = useProveedores();
  const [vinculandoId, setVinculandoId] = useState(null);

  const handleVincular = async (pendiente, sugerencia) => {
    setVinculandoId(pendiente.id_item_proveedor);
    try {
      await vincularAsync({
        id: pendiente.id_item_proveedor,
        data: {
          item_general_id:   sugerencia.id_item_general,
          unidad_compra_id:  pendiente.unidad_compra_id ?? null,
          factor_conversion: pendiente.factor_conversion ?? 1,
        },
      });
      queryClient.invalidateQueries({ queryKey: sincKeys.all });
    } finally {
      setVinculandoId(null);
    }
  };

  if (isLoading) return <SkeletonList />;

  if (!pendientes?.length) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Todo sincronizado"
        description="No hay items de proveedor pendientes de vincular a una materia prima."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pendientes.map((item) => (
        <div
          key={item.id_item_proveedor}
          className="bg-surface-base border border-border-base rounded-xl p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content-primary truncate">
                {item.nombre}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-content-tertiary">
                {item.codigo && <span className="font-mono">{item.codigo}</span>}
                <span className="inline-flex items-center gap-1">
                  <Building2 size={11} /> {item.nombre_empresa}
                </span>
                <span>
                  ${fmt(item.precio_unitario)} / {item.unidad_compra_nombre ?? 'UND'}
                </span>
                {item.factor_conversion > 0 && (
                  <span className="text-content-muted">factor {item.factor_conversion}</span>
                )}
              </div>
            </div>
            <StatusBadge tone="warning" label="Sin vincular" dot size="sm" />
          </div>

          {item.sugerencias?.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                Sugerencias automáticas
              </p>
              {item.sugerencias.map((s) => (
                <SugerenciaCard
                  key={s.id_item_general}
                  sugerencia={s}
                  isLoading={isVinculando && vinculandoId === item.id_item_proveedor}
                  onVincular={() => handleVincular(item, s)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-tertiary italic">
              Sin coincidencias automáticas. Buscá manualmente o creá la MP.
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
            <Button size="sm" variant="ghost" icon={Plus} disabled>
              Crear nueva MP
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendientesTab;
