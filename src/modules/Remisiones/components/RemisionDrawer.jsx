/**
 * RemisionDrawer – Panel lateral de detalle de remisión con:
 *   - Info de despacho (dirección, fechas, estado)
 *   - Ítems del despacho
 *   - Factura / inventario vinculados
 *   - Cambio de estado y conversión a factura
 */

import {
  Truck, MapPin, Package, FileText,
  RefreshCw, ArrowRight, AlertCircle, Building2,
} from 'lucide-react';
import { useRemisiones } from '../api/useRemisiones';
import { useBoundStore } from '../../../store/useBoundStore';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-b-0 gap-3">
    <span className="text-xs text-gray-500 shrink-0">{label}</span>
    <span className="text-xs font-medium text-gray-800 text-right">{value ?? '—'}</span>
  </div>
);

const ESTADOS = ['Pendiente', 'Entregada', 'Anulada'];

const RemisionDrawer = ({ remisionId, isOpen, onClose, onCambiarEstado, onConvertir }) => {
  const { remisionDetalle, detalle, isLoadingDetalle } = useRemisiones(remisionId);
  const { openConfirm } = useBoundStore();

  const r = remisionDetalle;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={r?.numero ?? 'Detalle Remisión'}
      subtitle={r ? `${r.nombre_empresa} · ${r.nombre_encargado}` : ''}
      width="lg"
    >
      {isLoadingDetalle ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !r ? (
        <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
          <AlertCircle className="w-8 h-8" />
          <span className="text-sm">No se pudo cargar la remisión</span>
        </div>
      ) : (
        <>
          {/* Hero con estado y dirección */}
          <div className="px-5 py-5 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge estado={r.estado} />
              <span className="text-xs text-gray-400">{r.fecha_remision}</span>
            </div>
            <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-100">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Dirección de entrega</p>
                <p className="text-sm text-gray-800 font-medium">{r.direccion_entrega}</p>
              </div>
            </div>
          </div>

          {/* Acciones de estado */}
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500 mb-2 font-medium">Cambiar estado:</p>
            <div className="flex flex-wrap gap-1.5">
              {ESTADOS.filter((e) => e !== r.estado).map((estado) => (
                <button
                  key={estado}
                  onClick={() => {
                    openConfirm({
                      title: 'Cambiar Estado',
                      message: `¿Marcar la remisión ${r.numero} como "${estado}"?`,
                      onConfirm: () => {
                        onCambiarEstado?.(r.id_remisiones, estado);
                        onClose();
                      },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 rounded-lg
                    bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {estado}
                </button>
              ))}

              {/* Convertir a factura */}
              {!r.facturas_id && r.estado !== 'Anulada' && (
                <button
                  onClick={() => {
                    openConfirm({
                      title: 'Convertir a Factura',
                      message: `¿Generar factura desde la remisión ${r.numero}?`,
                      onConfirm: () => {
                        onConvertir?.(r.id_remisiones);
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

              {r.facturas_id && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-medium">
                  <FileText className="w-3 h-3" />
                  {r.numero_factura || `FAC-${r.facturas_id}`}
                </span>
              )}
            </div>
          </div>

          {/* Info cliente */}
          <Section title="Cliente" icon={Building2}>
            <InfoRow label="Empresa"   value={r.nombre_empresa}   />
            <InfoRow label="Encargado" value={r.nombre_encargado} />
            <InfoRow label="ID"        value={r.cliente_id}       />
          </Section>

          {/* Info remisión */}
          <Section title="Datos del Despacho" icon={Truck}>
            <InfoRow label="Número"         value={r.numero}               />
            <InfoRow label="Fecha"          value={r.fecha_remision}       />
            <InfoRow label="Dirección"      value={r.direccion_entrega}    />
            <InfoRow label="Observaciones"  value={r.observaciones}        />
            <InfoRow label="Inventario ID"  value={r.movimiento_inventario_id} />
            <InfoRow label="Registrado en"  value={r.creado_en}            />
          </Section>

          {/* Ítems del despacho */}
          <Section title="Ítems Despachados" icon={Package}>
            {!detalle || detalle.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin ítems registrados</p>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Producto</th>
                      <th className="px-3 py-2 text-right text-gray-500">Cantidad</th>
                      <th className="px-3 py-2 text-right text-gray-500">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalle.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700 font-medium">{item.descripcion ?? item.nombre ?? `Ítem ${idx + 1}`}</td>
                        <td className="px-3 py-2 text-right text-gray-600 font-mono tabular-nums">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{item.unidad ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default RemisionDrawer;