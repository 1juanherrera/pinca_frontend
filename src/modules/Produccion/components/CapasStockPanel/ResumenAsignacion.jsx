import { fmtNum, fmtCOP } from './helpers';

export const ResumenAsignacion = ({ totalAsignado, cantidadNecesaria, costoPonderadoSeleccion }) => (
  <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
    <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
      Asignado: {fmtNum(totalAsignado)} / {fmtNum(cantidadNecesaria)} kg
    </p>
    {costoPonderadoSeleccion > 0 && (
      <p className="text-[10px] font-bold text-content-secondary">
        Costo total: {fmtCOP(totalAsignado * costoPonderadoSeleccion)}
      </p>
    )}
  </div>
);

export default ResumenAsignacion;
