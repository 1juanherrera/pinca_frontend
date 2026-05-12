import { useState, useMemo } from 'react';
import { ArrowRightLeft, Info } from 'lucide-react';
import Modal from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { FormSelect } from '../../../shared/Form/FormSelect';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormTextarea } from '../../../shared/Form/FormTexarea';

export const TraspasoModal = ({ item, bodegas, onClose, onConfirm, isSubmitting, id_bodega }) => {
  const [destino,     setDestino]     = useState('');
  const [cantidad,    setCantidad]    = useState(0);
  const [observacion, setObservacion] = useState('');

  const opcionesDestino = useMemo(
    () => bodegas
      .filter(b => b.id_bodegas !== item.bodegas_id)
      .map(b => ({ value: b.id_bodegas, label: b.nombre.toUpperCase() })),
    [bodegas, item.bodegas_id],
  );

  const stockActual = item.cantidad || 0;
  const sobreStock  = Number(cantidad) > stockActual;
  const esInvalido  = Number(cantidad) <= 0 || sobreStock || !destino;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (esInvalido) return;
    onConfirm({
      item_id:           item.id_item_general,
      bodega_origen_id:  id_bodega,
      bodega_destino_id: destino,
      cantidad:          parseFloat(cantidad),
      observacion,
    });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      icon={ArrowRightLeft}
      title="Traspaso de inventario"
      description="Mover stock entre bodegas"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={ArrowRightLeft}
            onClick={handleSubmit}
            disabled={esInvalido}
            loading={isSubmitting}
          >
            Confirmar traspaso
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2.5 bg-surface-subtle border border-border-base rounded-md px-3 py-2.5">
          <Info size={14} className="text-content-muted mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-content-primary leading-tight truncate">{item.nombre}</p>
            <p className="text-[10px] text-content-tertiary mt-1">
              Stock disponible:{' '}
              <span className="font-semibold text-content-secondary tabular-nums">{stockActual} unidades</span>
            </p>
          </div>
        </div>

        <FormSelect
          label="Bodega de destino" required
          placeholder="Selecciona una bodega..."
          options={opcionesDestino}
          value={destino}
          onChange={setDestino}
        />

        <FormInput
          label="Cantidad a mover" required
          type="number" step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          onFocus={(e) => e.target.select()}
          error={sobreStock ? 'No puedes traspasar más de lo que hay en stock' : undefined}
          className="tabular-nums"
        />

        <FormTextarea
          label="Observación / nota"
          rows={3}
          placeholder="Opcional..."
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </form>
    </Modal>
  );
};
