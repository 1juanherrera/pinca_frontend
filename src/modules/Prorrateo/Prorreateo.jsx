import { useState, useMemo, useRef, useEffect } from "react";
import {
  Scale, Plus, Trash2, Search, X, Package,
  ChevronDown, Calculator, Info, CheckCircle2
} from "lucide-react";
import { useItem } from "../Inventario/api/useItem";

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseCOP = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "")) || 0;
};

const fmtCOP = (n) => {
  if (!n && n !== 0) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CO");
};

let nextId = 1;
const newProducto = (override = {}) => ({
  id:       nextId++,
  itemId:   null,       // si viene del catálogo
  nombre:   "",
  codigo:   "",
  cantidad: "",
  unidad:   "u",
  valor:    "",
  ...override,
});

// ── Buscador de items del catálogo ────────────────────────────────────────────
const ItemSearch = ({ items, onSelect, onClose }) => {
  const [q, setQ] = useState("");
  const inputRef  = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtrados = useMemo(() => {
    if (!q.trim()) return items.slice(0, 20);
    const lower = q.toLowerCase();
    return items.filter(
      i => i.nombre?.toLowerCase().includes(lower) || i.codigo?.toLowerCase().includes(lower)
    ).slice(0, 20);
  }, [q, items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: "70vh" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100">
          <Search size={15} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre o código…"
            className="flex-1 text-sm text-zinc-800 placeholder:text-zinc-300 outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={15} className="text-zinc-400" />
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 divide-y divide-zinc-50">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-300">
              <Package size={24} />
              <p className="text-xs">Sin resultados para "{q}"</p>
            </div>
          ) : filtrados.map(item => (
            <button
              key={item.id_item_general}
              onClick={() => onSelect(item)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-zinc-200 transition-colors">
                <Package size={14} className="text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 truncate">{item.nombre}</p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{item.codigo}</p>
              </div>
              <ChevronDown size={12} className="text-zinc-300 -rotate-90 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-100 bg-zinc-50">
          <p className="text-[10px] text-zinc-400 font-medium">
            {items.length} productos en catálogo · mostrando {filtrados.length}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Fila de producto ──────────────────────────────────────────────────────────
const FilaProducto = ({ p, factor, totalLista, onUpdate, onDelete, onSearchClick }) => {
  const valor     = parseCOP(p.valor);
  const cantidad  = parseFloat(p.cantidad) || 0;
  const asignado  = valor * factor;
  const unitario  = cantidad > 0 ? asignado / cantidad : 0;
  const pct       = totalLista > 0 ? (valor / totalLista * 100) : 0;
  const barW      = Math.min(pct, 100);
  const hasCatalog = !!p.itemId;

  return (
    <tr className="group hover:bg-zinc-50/80 transition-colors">

      {/* Origen */}
      <td className="px-3 py-2.5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${hasCatalog ? "bg-blue-50" : "bg-zinc-100"}`}>
          {hasCatalog
            ? <CheckCircle2 size={12} className="text-blue-500" />
            : <Plus size={12} className="text-zinc-400" />}
        </div>
      </td>

      {/* Nombre */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          {hasCatalog ? (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-800 truncate max-w-45">{p.nombre}</span>
              <span className="text-[10px] font-mono text-zinc-400">{p.codigo}</span>
            </div>
          ) : (
            <input
              value={p.nombre}
              onChange={e => onUpdate({ nombre: e.target.value })}
              placeholder="Nombre del producto"
              className="text-xs text-zinc-800 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 rounded-lg px-2 py-1.5 outline-none transition-all w-full placeholder:text-zinc-300"
            />
          )}
          <button
            onClick={onSearchClick}
            title="Buscar en catálogo"
            className="shrink-0 p-1 rounded-lg text-zinc-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <Search size={11} />
          </button>
        </div>
      </td>

      {/* Cantidad */}
      <td className="px-2 py-2">
        <input
          type="number" min="0" step="any"
          value={p.cantidad}
          onChange={e => onUpdate({ cantidad: e.target.value })}
          placeholder="0"
          className="text-xs font-mono text-right text-zinc-800 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 rounded-lg px-2 py-1.5 outline-none transition-all w-24 placeholder:text-zinc-300"
        />
      </td>

      {/* Unidad */}
      <td className="px-2 py-2">
        <input
          value={p.unidad}
          onChange={e => onUpdate({ unidad: e.target.value })}
          placeholder="u"
          className="text-xs text-zinc-600 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 rounded-lg px-2 py-1.5 outline-none transition-all w-16 placeholder:text-zinc-300"
        />
      </td>

      {/* Valor lista */}
      <td className="px-2 py-2">
        <div className="flex items-center justify-end">
          <span className="text-[10px] text-zinc-300 mr-1">$</span>
          <input
            value={p.valor}
            onChange={e => onUpdate({ valor: e.target.value })}
            onBlur={e => {
              const num = parseCOP(e.target.value);
              if (num > 0) onUpdate({ valor: num.toLocaleString("es-CO") });
            }}
            placeholder="0"
            className="text-xs font-mono text-right text-zinc-800 bg-transparent border border-transparent hover:border-zinc-200 focus:border-zinc-400 rounded-lg px-2 py-1.5 outline-none transition-all w-32 placeholder:text-zinc-300"
          />
        </div>
      </td>

      {/* Costo asignado */}
      <td className="px-3 py-2 text-right">
        {factor > 0 && valor > 0 ? (
          <span className="text-xs font-bold font-mono text-zinc-800">{fmtCOP(asignado)}</span>
        ) : (
          <span className="text-xs text-zinc-200">—</span>
        )}
      </td>

      {/* Costo unitario */}
      <td className="px-3 py-2 text-right">
        {factor > 0 && valor > 0 && cantidad > 0 ? (
          <div>
            <span className="text-xs font-bold font-mono text-emerald-600">{fmtCOP(unitario)}</span>
            <span className="text-[10px] text-zinc-400 ml-0.5">/{p.unidad || "u"}</span>
          </div>
        ) : (
          <span className="text-xs text-zinc-200">—</span>
        )}
      </td>

      {/* % + barra */}
      <td className="px-3 py-2" style={{ width: 90 }}>
        {totalLista > 0 && valor > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-zinc-400 text-right">{pct.toFixed(1)}%</span>
            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${barW}%` }} />
            </div>
          </div>
        ) : null}
      </td>

      {/* Eliminar */}
      <td className="px-2 py-2">
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const Prorrateo = () => {
  const { items = [] } = useItem();

  const [precioLote,   setPrecioLote]   = useState("");
  const [productos,    setProductos]    = useState([newProducto()]);
  const [searchTarget, setSearchTarget] = useState(null); // id de fila que abrió el buscador
  const [showInfo,     setShowInfo]     = useState(false);

  // ── Cálculos ────────────────────────────────────────────────────────────────
  const totalLista = useMemo(() =>
    productos.reduce((acc, p) => acc + parseCOP(p.valor), 0),
    [productos]
  );

  const precioNum = parseCOP(precioLote);
  const factor    = totalLista > 0 ? precioNum / totalLista : 0;
  const descuento = totalLista > 0 ? (1 - factor) * 100 : 0;
  const ahorro    = totalLista - precioNum;

  // ── Mutaciones ──────────────────────────────────────────────────────────────
  const addManual = () => setProductos(prev => [...prev, newProducto()]);

  const updateProducto = (id, changes) =>
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));

  const deleteProducto = (id) =>
    setProductos(prev => prev.filter(p => p.id !== id));

  const handleSelectItem = (item) => {
    updateProducto(searchTarget, {
      itemId:  item.id_item_general,
      nombre:  item.nombre,
      codigo:  item.codigo,
      unidad:  "u",
    });
    setSearchTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full gap-5 p-6">

      {/* Buscador modal */}
      {searchTarget !== null && (
        <ItemSearch
          items={items}
          onSelect={handleSelectItem}
          onClose={() => setSearchTarget(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/20">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 leading-none">Prorrateo de Lote</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Distribución proporcional de costos</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <Info size={13} />
          {showInfo ? "Ocultar metodología" : "Ver metodología"}
        </button>
      </div>

      {/* ── Metodología (colapsable) ── */}
      {showInfo && (
        <div className="bg-zinc-950 rounded-2xl p-5 flex flex-col gap-4">
          {[
            { n: "1", t: "Valor Teórico de Lista", d: "Suma de todos los precios de lista del lote." },
            { n: "2", t: "Factor de Ajuste", d: "Factor = Precio Pagado ÷ Valor Lista Total" },
            { n: "3", t: "Distribución Proporcional", d: "Costo Asignado = Valor Lista Individual × Factor" },
            { n: "4", t: "Costo Unitario Real", d: "Costo Unitario = Costo Asignado ÷ Cantidad" },
          ].map(s => (
            <div key={s.n} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-black text-white">{s.n}</div>
              <div>
                <p className="text-xs font-bold text-white">{s.t}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Precio del lote ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <Calculator size={13} className="text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Precio Total Pagado por el Lote</p>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Input precio */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border-2 border-zinc-200 focus-within:border-zinc-900 rounded-xl overflow-hidden transition-all flex-1 min-w-52">
              <span className="px-3 py-3 text-xs font-mono text-zinc-400 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap">$ COP</span>
              <input
                type="text"
                value={precioLote}
                onChange={e => setPrecioLote(e.target.value)}
                onBlur={() => {
                  const n = parseCOP(precioLote);
                  if (n > 0) setPrecioLote(n.toLocaleString("es-CO"));
                }}
                placeholder="30.000.000"
                className="flex-1 px-3 py-3 text-sm font-mono font-semibold text-zinc-900 outline-none bg-white placeholder:text-zinc-300"
              />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {/* Total lista */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Valor Lista Total</p>
              <p className="text-base font-black text-zinc-900 font-mono tabular-nums">{fmtCOP(totalLista)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Suma de precios originales</p>
            </div>

            {/* Factor */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Factor de Ajuste</p>
              <p className="text-base font-black text-emerald-700 font-mono tabular-nums">{factor.toFixed(4)}</p>
              <div className="mt-1.5">
                <div className="h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(factor * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-500 mt-1">{(factor * 100).toFixed(2)}% del valor original</p>
              </div>
            </div>

            {/* Descuento */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Descuento Global</p>
              <p className="text-base font-black text-amber-700 font-mono tabular-nums">{descuento.toFixed(2)}%</p>
              <p className="text-[10px] text-amber-500 mt-0.5">Ahorro: {fmtCOP(ahorro > 0 ? ahorro : 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla de productos ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package size={13} className="text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Productos del Lote
            </p>
            <span className="text-[9px] font-bold bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-md">{productos.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSearchTarget(-1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-all"
            >
              <Search size={12} /> Desde catálogo
            </button>
            <button
              onClick={addManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Plus size={12} /> Manual
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-3 py-2.5 w-8" />
                <th className="px-2 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400">Producto</th>
                <th className="px-2 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-28">Cantidad</th>
                <th className="px-2 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 w-20">Unidad</th>
                <th className="px-2 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-36">Valor Lista</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-36">Costo Asignado</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-emerald-500 w-36">Costo Unitario</th>
                <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-24">Peso</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {productos.map(p => (
                <FilaProducto
                  key={p.id}
                  p={p}
                  factor={factor}
                  totalLista={totalLista}
                  onUpdate={(changes) => updateProducto(p.id, changes)}
                  onDelete={() => deleteProducto(p.id)}
                  onSearchClick={() => setSearchTarget(p.id)}
                />
              ))}
            </tbody>
            {/* Footer totales */}
            {productos.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-950">
                  <td colSpan={4} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-bl-xl">
                    Total
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-black font-mono text-white">
                    {fmtCOP(totalLista)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-black font-mono text-emerald-400">
                    {fmtCOP(precioNum)}
                  </td>
                  <td colSpan={3} className="rounded-br-xl" />
                </tr>
              </tfoot>
            )}
          </table>

          {/* Empty */}
          {productos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-300">
              <Package size={28} />
              <p className="text-sm">Agrega productos para calcular el prorrateo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Manejo especial: cuando se abre el buscador con -1 (botón global), agrega fila nueva al seleccionar
// Sobrescribir handleSelectItem para ese caso
const ProrrateoWrapper = () => {
  const { items = [] } = useItem();
  const [precioLote,   setPrecioLote]   = useState("");
  const [productos,    setProductos]    = useState([newProducto()]);
  const [searchTarget, setSearchTarget] = useState(null);
  const [showInfo,     setShowInfo]     = useState(false);

  const totalLista = useMemo(() =>
    productos.reduce((acc, p) => acc + parseCOP(p.valor), 0),
    [productos]
  );

  const precioNum = parseCOP(precioLote);
  const factor    = totalLista > 0 ? precioNum / totalLista : 0;
  const descuento = totalLista > 0 ? (1 - factor) * 100 : 0;
  const ahorro    = totalLista - precioNum;

  const addManual = () => setProductos(prev => [...prev, newProducto()]);

  const updateProducto = (id, changes) =>
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));

  const deleteProducto = (id) =>
    setProductos(prev => prev.filter(p => p.id !== id));

  const handleSelectItem = (item) => {
    if (searchTarget === -1) {
      // Agregar nueva fila desde catálogo
      const nuevo = newProducto({
        itemId:  item.id_item_general,
        nombre:  item.nombre,
        codigo:  item.codigo,
        unidad:  "u",
      });
      setProductos(prev => [...prev, nuevo]);
    } else {
      // Reemplazar fila existente
      updateProducto(searchTarget, {
        itemId:  item.id_item_general,
        nombre:  item.nombre,
        codigo:  item.codigo,
        unidad:  "u",
      });
    }
    setSearchTarget(null);
  };

  return (
    <div className="flex flex-col w-full gap-5 p-6">

      {searchTarget !== null && (
        <ItemSearch
          items={items}
          onSelect={handleSelectItem}
          onClose={() => setSearchTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center shadow-md shadow-zinc-950/20">
            <Scale size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 leading-none">Prorrateo de Lote</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Distribución proporcional de costos</p>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <Info size={13} />
          {showInfo ? "Ocultar metodología" : "¿Cómo funciona?"}
        </button>
      </div>

      {/* Metodología colapsable */}
      {showInfo && (
        <div className="bg-zinc-950 rounded-2xl p-5 flex flex-col gap-4">
          {[
            { n: "1", t: "Valor Teórico de Lista", d: "Suma todos los precios de lista del lote." },
            { n: "2", t: "Factor de Ajuste",        d: "Factor = Precio Pagado ÷ Valor Lista Total" },
            { n: "3", t: "Distribución Proporcional", d: "Costo Asignado = Valor Lista Individual × Factor" },
            { n: "4", t: "Costo Unitario Real",     d: "Costo Unitario = Costo Asignado ÷ Cantidad" },
          ].map(s => (
            <div key={s.n} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-black text-white">{s.n}</div>
              <div>
                <p className="text-xs font-bold text-white">{s.t}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Precio del lote */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <Calculator size={13} className="text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Precio Total Pagado por el Lote</p>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center border-2 border-zinc-200 focus-within:border-zinc-900 rounded-xl overflow-hidden transition-all max-w-xs">
            <span className="px-3 py-3 text-xs font-mono text-zinc-400 bg-zinc-50 border-r border-zinc-200 whitespace-nowrap">$ COP</span>
            <input
              type="text"
              value={precioLote}
              onChange={e => setPrecioLote(e.target.value)}
              onBlur={() => {
                const n = parseCOP(precioLote);
                if (n > 0) setPrecioLote(n.toLocaleString("es-CO"));
              }}
              placeholder="30.000.000"
              className="flex-1 px-3 py-3 text-sm font-mono font-semibold text-zinc-900 outline-none bg-white placeholder:text-zinc-300"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Valor Lista Total</p>
              <p className="text-base font-black text-zinc-900 font-mono">{fmtCOP(totalLista)}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Suma precios originales</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Factor de Ajuste</p>
              <p className="text-base font-black text-emerald-700 font-mono">{factor.toFixed(4)}</p>
              <div className="mt-1.5">
                <div className="h-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(factor * 100, 100)}%` }} />
                </div>
                <p className="text-[10px] text-emerald-500 mt-1">{(factor * 100).toFixed(2)}% del valor original</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Descuento Global</p>
              <p className="text-base font-black text-amber-700 font-mono">{descuento.toFixed(2)}%</p>
              <p className="text-[10px] text-amber-500 mt-0.5">Ahorro: {fmtCOP(ahorro > 0 ? ahorro : 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package size={13} className="text-zinc-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Productos del Lote</p>
            <span className="text-[9px] font-bold bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded-md">{productos.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchTarget(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-all active:scale-95"
            >
              <Search size={12} /> Desde catálogo
            </button>
            <button
              onClick={addManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Plus size={12} /> Manual
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-3 py-2.5 w-10" />
                <th className="px-2 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400">Producto</th>
                <th className="px-2 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-28">Cantidad</th>
                <th className="px-2 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 w-20">Unidad</th>
                <th className="px-2 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-40">Valor Lista</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-zinc-400 w-36">Costo Asignado</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-black uppercase tracking-widest text-emerald-500 w-40">Costo Unitario</th>
                <th className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-400 w-24">Peso</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {productos.map(p => (
                <FilaProducto
                  key={p.id}
                  p={p}
                  factor={factor}
                  totalLista={totalLista}
                  onUpdate={(changes) => updateProducto(p.id, changes)}
                  onDelete={() => deleteProducto(p.id)}
                  onSearchClick={() => setSearchTarget(p.id)}
                />
              ))}
            </tbody>
            {productos.length > 0 && (
              <tfoot>
                <tr className="bg-zinc-950">
                  <td colSpan={4} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">Total</td>
                  <td className="px-3 py-3 text-right text-sm font-black font-mono text-white">{fmtCOP(totalLista)}</td>
                  <td className="px-3 py-3 text-right text-sm font-black font-mono text-emerald-400">{fmtCOP(precioNum)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>

          {productos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-300">
              <Package size={28} />
              <p className="text-sm">Agrega productos para calcular el prorrateo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProrrateoWrapper;