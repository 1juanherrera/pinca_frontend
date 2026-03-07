/**
 * CotizacionDrawer – Panel lateral de cotización con:
 *   - Detalle completo (ítems, totales, fechas)
 *   - Acciones: cambiar estado y convertir a factura
 */

import {
  ClipboardList, Building2, Calendar, DollarSign,
  ArrowRight, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useCotizaciones } from '../api/useCotizaciones';
import { useBoundStore } from '../../../store/useBoundStore';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt } from '../../../utils/formatters';

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-50 last:border-b-0">
    <span className="text-xs text-gray-500">{label}</span>
    <span className={`text-xs font-medium text-gray-800 ${mono ? 'font-mono tabular-nums' : ''}`}>{value ?? '—'}</span>
  </div>
);

const ESTADOS_DISPONIBLES = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Expirada'];

const CotizacionDrawer = ({ cotizacionId, isOpen, onClose, onCambiarEstado, onConvertir }) => {
  const { cotizacionDetalle, detalle, isLoadingDetalle, isCambiandoEstado } = useCotizaciones(cotizacionId);
  const { openConfirm } = useBoundStore();

  const c = cotizacionDetalle;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={c?.numero ?? 'Detalle Cotización'}
      subtitle={c ? `${c.nombre_empresa} · ${c.nombre_encargado}` : ''}
      width="lg"
    >
      {isLoadingDetalle ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !c ? (
        <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la cotización</span>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="px-5 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Estado actual</p>
              <StatusBadge estado={c.estado} />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total cotización</p>
              <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums">{fmt(c.total)}</p>
            </div>
          </div>

          {/* Acciones de estado */}
          <div className="px-5 py-3 border-b border-gray-100 bg-white">
            <p className="text-xs text-gray-500 mb-2 font-medium">Cambiar estado:</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS_DISPONIBLES.filter((e) => e !== c.estado).map((estado) => (
                <button
                  key={estado}
                  onClick={() => {
                    openConfirm({
                      title: 'Cambiar Estado',
                      message: `¿Cambiar el estado de esta cotización a "${estado}"?`,
                      onConfirm: () => {
                        onCambiarEstado?.(c.id_cotizaciones, estado);
                        onClose();
                      },
                    });
                  }}
                  disabled={isCambiandoEstado}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg
                    bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  {estado}
                </button>
              ))}

              {/* Convertir a factura */}
              {c.estado === 'Aprobada' && !c.facturas_id && (
                <button
                  onClick={() => {
                    openConfirm({
                      title: 'Convertir a Factura',
                      message: `¿Convertir la cotización ${c.numero} en factura?`,
                      onConfirm: () => {
                        onConvertir?.(c.id_cotizaciones);
                        onClose();
                      },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-emerald-200 rounded-lg
                    bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Convertir a Factura
                </button>
              )}

              {c.facturas_id && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-medium">
                  Factura: {c.numero_factura || c.facturas_id}
                </span>
              )}
            </div>
          </div>

          {/* Info cliente */}
          <Section title="Cliente" icon={Building2}>
            <InfoRow label="Empresa"   value={c.nombre_empresa}   />
            <InfoRow label="Encargado" value={c.nombre_encargado} />
            <InfoRow label="ID"        value={c.cliente_id}       />
          </Section>

          {/* Fechas */}
          <Section title="Fechas" icon={Calendar}>
            <InfoRow label="Fecha cotización" value={c.fecha_cotizacion}  />
            <InfoRow label="Fecha vencimiento" value={c.fecha_vencimiento} />
            <InfoRow label="Creado en"        value={c.creado_en}         />
          </Section>

          {/* Ítems */}
          <Section title="Ítems" icon={ClipboardList}>
            {!detalle || detalle.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin ítems cargados</p>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Descripción</th>
                      <th className="px-3 py-2 text-right text-gray-500">Cant.</th>
                      <th className="px-3 py-2 text-right text-gray-500">P. Unit.</th>
                      <th className="px-3 py-2 text-right text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalle.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{item.descripcion ?? `Ítem ${idx + 1}`}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-gray-600">{fmt(item.precio_unitario)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-gray-800">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* Totales */}
          <Section title="Resumen Financiero" icon={DollarSign}>
            <InfoRow label="Subtotal"   value={fmt(c.subtotal)}   mono />
            <InfoRow label="Descuento"  value={`- ${fmt(c.descuento)}`} mono />
            <InfoRow label="Impuestos"  value={fmt(c.impuestos)}  mono />
            <InfoRow label="Retención"  value={`- ${fmt(c.retencion)}`} mono />
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-800">Total</span>
              <span className="text-sm font-bold font-mono tabular-nums text-gray-900">{fmt(c.total)}</span>
            </div>
          </Section>

          {c.observaciones && (
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700 font-medium mb-1">Observaciones</p>
              <p className="text-xs text-amber-600">{c.observaciones}</p>
            </div>
          )}
        </>
      )}
    </DetailDrawer>
  );
};

export default CotizacionDrawer;