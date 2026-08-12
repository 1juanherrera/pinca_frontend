import { User } from 'lucide-react';
import SearchSelect from './SearchSelect';

// ─── Cliente (registrado o libre) ─────────────────────────────────────────────
const ClienteFieldset = ({
  clienteMode, setClienteMode, clienteSel, setClienteSel, clienteLibre, setClienteLibre,
  clientes, loadingClientes, v,
}) => (
  <fieldset className="space-y-2">
    <div className="flex items-center justify-between">
      <legend className="text-xs font-semibold text-content-tertiary uppercase tracking-wider flex items-center gap-1.5">
        <User size={11} /> Cliente
      </legend>
      <button
        type="button"
        onClick={() => setClienteMode((m) => m === 'select' ? 'libre' : 'select')}
        className="text-[10px] text-semantic-info-fg hover:text-semantic-info-fg font-medium"
      >
        {clienteMode === 'select' ? '+ No registrado' : '← Buscar cliente'}
      </button>
    </div>

    {clienteMode === 'select' ? (
      <SearchSelect
        placeholder="Buscar cliente..."
        value={clienteSel}
        onChange={(c) => { setClienteSel(c); v.change('cliente', c ? 'ok' : ''); }}
        options={clientes}
        loading={loadingClientes}
        renderValue={(c) => c.nombre_empresa || c.nombre_encargado}
        renderOption={(c) => (
          <div>
            <p className="font-semibold text-content-primary">{c.nombre_empresa}</p>
            <p className="text-content-muted">{c.nombre_encargado} · {c.numero_documento}</p>
          </div>
        )}
      />
    ) : (
      <input
        type="text"
        value={clienteLibre}
        onChange={(e) => { setClienteLibre(e.target.value); v.change('cliente', e.target.value.trim()); }}
        onBlur={() => v.blur('cliente', clienteLibre.trim())}
        placeholder="Nombre del cliente..."
        className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
      />
    )}

    {v.fieldError('cliente') && <p className="text-[10px] text-semantic-danger mt-1">{v.fieldError('cliente')}</p>}

    {clienteSel && clienteMode === 'select' && (
      <div className="bg-semantic-info-subtle border border-semantic-info/15 rounded-lg px-3 py-2 text-xs text-semantic-info-fg space-y-0.5">
        <p className="font-semibold">{clienteSel.nombre_empresa}</p>
        <p className="text-semantic-info">{clienteSel.direccion}</p>
        <p className="text-semantic-info">{clienteSel.telefono}</p>
      </div>
    )}
  </fieldset>
);

export default ClienteFieldset;
