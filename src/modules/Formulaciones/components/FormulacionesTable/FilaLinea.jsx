import { Layers, ClipboardList } from 'lucide-react';

// Fila de instrucción o fase: banda a lo ancho, no es un ingrediente.
export const FilaLinea = ({ formulacion }) => {
  const esFase = formulacion.tipo === 'fase';
  return (
    <tr>
      <td colSpan="7" className={`px-4 py-2 ${esFase
          ? 'tbl-header'
          : 'bg-semantic-info-subtle/60 text-semantic-info-fg border-y border-semantic-info/15'}`}>
        <div className="flex items-center gap-2">
          {esFase
            ? <Layers size={13} className="shrink-0" />
            : <ClipboardList size={13} className="shrink-0" />}
          <span className={`text-xs ${esFase ? 'font-bold uppercase tracking-wide' : 'font-medium italic'}`}>
            {formulacion.texto || (esFase ? 'Fase' : 'Instrucción')}
          </span>
        </div>
      </td>
    </tr>
  );
};

export default FilaLinea;
