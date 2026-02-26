import { 
  Calculator, 
  RefreshCw, 
  FileDown, 
  DollarSign, 
  Layers,
  FlaskConical,
  Activity,
  ArrowRight
} from 'lucide-react';

const CostCalculator = () => {

  const data = {
    nombre: "VINILO T1 BLANCO",
    codigo: "EBT012",
    volumenBase: "1.00",
    volumenNuevo: "5.50",
    factor: "5.5",
    costoBase: "$ 245.800",
    cantidadBase: "12.5 kg",
    precioVentaBase: "$ 480.000",
    costoNuevo: "$ 1.351.900",
    cantidadNueva: "68.75 kg",
    precioVentaNuevo: "$ 2.640.000",
  }

  return (
    <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
      
      {/* HEADER: Estilo Pinca (Negro / Azul) */}
      <div className="bg-zinc-950 px-5 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg text-black shadow-lg shadow-blue-600/20">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Calculadora de Costos</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
              {data.nombre} • {data.codigo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/20 border border-white/20 px-3 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span className="text-[10px] font-bold text-white uppercase tracking-tight">Modo Edición</span>
        </div>
      </div>

      {/* CUERPO DEL CÁLCULO */}
      <div className="p-5 flex flex-col gap-5">
        
        {/* INPUT DE VOLUMEN ESTÁTICO */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Ajuste de Volumen de Producción (Gls/Kg)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Activity size={16} />
              </div>
              <input
                type="text"
                value={data.volumenNuevo}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none"
              />
            </div>
            <button className="bg-zinc-900 text-white px-5 rounded-xl flex items-center justify-center shadow-md">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* RESUMEN DE IMPACTO ECONÓMICO */}
        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <DollarSign size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-emerald-600 uppercase leading-none mb-1">Costo Total Proyectado</p>
              <p className="text-base font-black text-emerald-700 tracking-tight leading-none">
                {data.costoNuevo}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-emerald-600 uppercase mb-1">Factor de Escala</p>
            <span className="bg-emerald-200/50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
              x{data.factor}
            </span>
          </div>
        </div>

        {/* COMPARATIVA DE RESULTADOS */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Desglose de Operación</h4>
            <div className="flex gap-2">
              <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                <FileDown size={16} />
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-md">
                Preparar Mezcla
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* TARJETA ORIGINAL */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 text-zinc-50">
                <Layers size={40} strokeWidth={1} />
              </div>
              <h5 className="text-[10px] font-black text-zinc-400 uppercase mb-3 relative z-10">
                Fórmula Base (Vol: {data.volumenBase})
              </h5>
              <div className="space-y-2 relative z-10">
                <DataRow label="Costo MP" value={data.costoBase} />
                <DataRow label="Cantidad" value={data.cantidadBase} />
                <DataRow label="Precio Venta" value={data.precioVentaBase} isTotal />
              </div>
            </div>

            {/* TARJETA CALCULADA */}
            <div className="bg-white border-2 border-blue-600/20 rounded-xl p-4 relative overflow-hidden shadow-lg shadow-blue-500/5">
              <div className="absolute top-0 right-0 p-2 text-blue-500/5">
                <FlaskConical size={40} strokeWidth={1} />
              </div>
              <h5 className="text-[10px] font-black text-blue-600 uppercase mb-3 relative z-10">
                Nueva Proyección (Vol: {data.volumenNuevo})
              </h5>
              <div className="space-y-2 relative z-10">
                <DataRow label="Costo MP" value={data.costoNuevo} color="text-blue-600" />
                <DataRow label="Cantidad" value={data.cantidadNueva} color="text-blue-600" />
                <DataRow label="Precio Venta" value={data.precioVentaNuevo} isTotal color="text-blue-700" />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DE AYUDA */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium italic border-t border-zinc-100 pt-3">
          <ArrowRight size={12} />
          Los valores mostrados son proyecciones basadas en el factor de escala de volumen.
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para las filas
const DataRow = ({ label, value, isTotal, color = "text-zinc-900" }) => (
  <div className={`flex justify-between items-center py-1 ${isTotal ? 'border-t border-zinc-100 mt-2 pt-2' : ''}`}>
    <span className="text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
    <span className={`text-sm font-black tracking-tight ${color}`}>{value}</span>
  </div>
);

export default CostCalculator;