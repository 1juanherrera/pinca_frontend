import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { CalendarPlus, Info, Users } from 'lucide-react';
import { Modal } from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormSelect } from '../../../shared/Form/FormSelect';
import FormDate from '../../../shared/Form/FormDate';
import { fmt } from '../../../utils/formatters';
import cn from '../../../utils/cn';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';
import { useEmpleados, usePeriodos } from '../api/useNomina';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Quincena por defecto según el día de hoy — para no obligar a elegir si es obvio.
const quincenaPorDefecto = () => (new Date().getDate() <= 15 ? 'primera' : 'segunda');

/** Rango de fechas sugerido para el mes en curso según periodicidad + quincena. */
const rangoSugerido = (tipo, quincena) => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  if (tipo === 'mensual') {
    return { fecha_inicio: toIso(new Date(anio, mes, 1)), fecha_fin: toIso(new Date(anio, mes + 1, 0)) };
  }
  if (quincena === 'segunda') {
    return { fecha_inicio: toIso(new Date(anio, mes, 16)), fecha_fin: toIso(new Date(anio, mes + 1, 0)) };
  }
  return { fecha_inicio: toIso(new Date(anio, mes, 1)), fecha_fin: toIso(new Date(anio, mes, 15)) };
};

const etiquetaSugerida = (tipo, quincena, fechaInicioIso) => {
  const d = fechaInicioIso ? new Date(`${fechaInicioIso}T00:00:00`) : new Date();
  const mes = MESES[d.getMonth()];
  const anio = d.getFullYear();
  return tipo === 'mensual'
    ? `${capitalizar(mes)} ${anio}`
    : `${quincena === 'segunda' ? 'Segunda' : 'Primera'} quincena de ${mes} ${anio}`;
};

const GenerarPeriodoModal = ({ isOpen, onClose, onGenerated }) => {
  const { generarAsync, isGenerando } = usePeriodos();
  const { empleados } = useEmpleados();
  const smmlv   = useConfigValue('nomina_smmlv', 1300000);
  const auxilio = useConfigValue('nomina_auxilio_transporte', 162000);
  const pctSalud = useConfigValue('nomina_pct_salud', 4);
  const pctPension = useConfigValue('nomina_pct_pension', 4);

  const activos = useMemo(() => empleados.filter((e) => Number(e.activo) === 1), [empleados]);
  const [excluidos, setExcluidos] = useState(() => new Set());
  const [quincena, setQuincena] = useState(quincenaPorDefecto);

  const { register, handleSubmit, reset, control, watch, setValue, getValues, formState: { errors } } = useForm();
  const tipo = watch('tipo');

  useEffect(() => {
    if (isOpen) {
      const q = quincenaPorDefecto();
      setQuincena(q);
      const rango = rangoSugerido('quincenal', q);
      reset({ etiqueta: etiquetaSugerida('quincenal', q, rango.fecha_inicio), tipo: 'quincenal', ...rango });
      setExcluidos(new Set());
    }
  }, [isOpen, reset]);

  // Autocompleta "Desde"/"Hasta" (y la etiqueta, si el usuario no la tocó) cada
  // vez que cambia la periodicidad o la quincena — reduce la fricción de tener
  // que calcular las fechas a mano. Los campos siguen siendo editables después.
  const aplicarAutocompletado = (nuevoTipo, nuevaQuincena) => {
    const rango = rangoSugerido(nuevoTipo, nuevaQuincena);
    setValue('fecha_inicio', rango.fecha_inicio, { shouldValidate: true });
    setValue('fecha_fin', rango.fecha_fin, { shouldValidate: true });
    const etiquetaActual = getValues('etiqueta');
    const eraAutogenerada =
      !etiquetaActual
      || etiquetaActual === etiquetaSugerida('quincenal', 'primera', null)
      || etiquetaActual === etiquetaSugerida('quincenal', 'segunda', null)
      || etiquetaActual === etiquetaSugerida('mensual', null, null);
    if (eraAutogenerada) {
      setValue('etiqueta', etiquetaSugerida(nuevoTipo, nuevaQuincena, rango.fecha_inicio));
    }
  };

  const handleTipoChange = (val) => {
    setValue('tipo', val);
    aplicarAutocompletado(val, quincena);
  };

  const handleQuincenaChange = (val) => {
    setQuincena(val);
    aplicarAutocompletado('quincenal', val);
  };

  const toggleExcluido = (id) => setExcluidos((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const incluidos = activos.length - excluidos.size;

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      // Solo se manda la lista si hay alguna exclusión — si no, el backend
      // liquida a TODOS los activos (comportamiento por defecto).
      if (excluidos.size > 0) {
        payload.empleados_ids = activos.filter((e) => !excluidos.has(e.id)).map((e) => e.id);
      }
      const res = await generarAsync(payload);
      onClose();
      if (res?.id && onGenerated) onGenerated(res.id);
    } catch { /* toast ya lo maneja el hook */ }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Generar liquidación"
      icon={CalendarPlus}
      description="Crea un período y liquida a los empleados activos (podés excluir excepciones puntuales)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary" icon={CalendarPlus} form="generar-periodo-form" type="submit"
            loading={isGenerando} disabled={incluidos === 0}
          >
            Generar {incluidos > 0 ? `(${incluidos})` : ''}
          </Button>
        </>
      }
    >
      <form id="generar-periodo-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormInput
          label="Etiqueta del período"
          placeholder="Ej. Julio 2026 / Primera quincena agosto"
          required
          error={errors.etiqueta?.message}
          registration={register('etiqueta', { required: 'La etiqueta es obligatoria' })}
        />

        <div className={cn('grid gap-4', tipo === 'quincenal' ? 'grid-cols-2' : 'grid-cols-1')}>
          <FormSelect
            label="Periodicidad"
            options={[
              { value: 'quincenal', label: 'Quincenal (15 días base)' },
              { value: 'mensual', label: 'Mensual (30 días base)' },
            ]}
            value={tipo}
            onChange={handleTipoChange}
            error={errors.tipo?.message}
          />
          {tipo === 'quincenal' && (
            <FormSelect
              label="Quincena"
              options={[
                { value: 'primera', label: '1 al 15' },
                { value: 'segunda', label: '16 al fin de mes' },
              ]}
              value={quincena}
              onChange={handleQuincenaChange}
            />
          )}
        </div>

        <p className="text-[11px] text-content-tertiary -mt-2">
          Las fechas de abajo se autocompletan según la periodicidad — podés ajustarlas si la liquidación no es del mes en curso.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="fecha_inicio"
            control={control}
            rules={{ required: 'Requerida' }}
            render={({ field }) => (
              <FormDate label="Desde" required value={field.value} onChange={field.onChange} error={errors.fecha_inicio?.message} />
            )}
          />
          <Controller
            name="fecha_fin"
            control={control}
            rules={{ required: 'Requerida' }}
            render={({ field }) => (
              <FormDate label="Hasta" required value={field.value} onChange={field.onChange} error={errors.fecha_fin?.message} />
            )}
          />
        </div>

        {activos.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-content-secondary">
                <Users size={13} className="text-content-tertiary" />
                Empleados a incluir ({incluidos} de {activos.length})
              </label>
              {excluidos.size > 0 && (
                <button
                  type="button"
                  onClick={() => setExcluidos(new Set())}
                  className="text-[11px] font-medium text-brand-primary-active hover:underline"
                >
                  Incluir a todos
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5 max-h-44 overflow-y-auto border border-border-base rounded-lg p-1.5">
              {activos.map((e) => {
                const checked = !excluidos.has(e.id);
                return (
                  <label
                    key={e.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-subtle cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExcluido(e.id)}
                      className="accent-content-primary shrink-0"
                    />
                    <div className={`min-w-0 flex-1 ${!checked ? 'opacity-50' : ''}`}>
                      <p className="text-xs font-medium text-content-primary truncate">{e.nombre}</p>
                      <p className="text-[10px] text-content-tertiary truncate">{e.cargo || e.documento}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {incluidos === 0 && (
              <p className="text-[11px] text-semantic-danger-fg">Tenés que incluir al menos un empleado.</p>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-semantic-info-subtle/50 border border-semantic-info/15 px-3 py-2.5">
          <Info size={13} className="text-semantic-info-fg mt-0.5 shrink-0" />
          <p className="text-[11px] text-semantic-info-fg leading-snug">
            Parámetros actuales (editables en Configuración → Nómina): SMMLV <strong>{fmt(smmlv)}</strong>,
            auxilio de transporte <strong>{fmt(auxilio)}</strong>, salud <strong>{pctSalud}%</strong>,
            pensión <strong>{pctPension}%</strong>. El auxilio se paga a quien gane hasta 2 SMMLV.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default GenerarPeriodoModal;
