import { 
  Search, 
  Edit, 
  Trash2, 
  ArrowRightLeft
} from 'lucide-react';
import Form from '../Components/Form';

const DataTable = ({ isDrawerOpen, setIsDrawerOpen }) => {

  const inventario = [
    { id: 1, codigo: 'EBT012', nombre: 'VINILO T1 BLANCO', cantidad: 5, tipo: 'PRODUCTO', costo: '$ 20000', precio: '$ 0' },
    { id: 2, codigo: 'MP019', nombre: 'FUNGICIDA (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 3, codigo: 'MPP018', nombre: 'AMONIACO (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 4, codigo: 'MPP017', nombre: 'AISOL 700 (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 5, codigo: 'MPP016', nombre: 'ACEITE PINO (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 6, codigo: 'EBT012', nombre: 'VINILO T1 BLANCO', cantidad: 5, tipo: 'PRODUCTO', costo: '$ 0', precio: '$ 0' },
    { id: 7, codigo: 'MPP019', nombre: 'FUNGICIDA (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 8, codigo: 'MPP018', nombre: 'AMONIACO (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 9, codigo: 'MPP017', nombre: 'AISOL 700 (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 10, codigo: 'MPP016', nombre: 'ACEITE PINO (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' },
    { id: 11, codigo: 'MPP015', nombre: 'ACEITE DE OLIVA (MP)', cantidad: 0, tipo: 'MATERIA PRIMA', costo: '$ 0', precio: '$ 0' }
  ]

  return (
    <div className="flex flex-col gap-3 w-full mt-1">

      {/* 3. CONTENEDOR DE LA TABLA */}
      <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm w-full overflow-hidden">
        
        {/* Cabecera Interna de la Tarjeta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-200/80 gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-zinc-900 uppercase">TODOS</h3>
            <span className="px-3 py-2 bg-zinc-100 text-zinc-600 border border-zinc-200 text-xs font-semibold rounded-xl">
              112 items totales
            </span>
          </div>

          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950 text-zinc-100 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="w-16 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">CÓDIGO</th>
                <th className="px-3 py-2">NOMBRE</th>
                <th className="px-3 py-2 text-center">CANTIDAD</th>
                <th className="px-3 py-2 text-center">TIPO</th>
                <th className="px-3 py-2 text-center">UNIDAD</th>
                <th className="px-3 py-2 text-right">COSTO</th>
                <th className="px-3 py-2 text-right">PRECIO</th>
                <th className="px-3 py-2 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80">
              {inventario.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-3 py-1.5 text-center text-xs font-medium text-zinc-500">{item.id}</td>
                  <td className="px-3 py-1.5"><span className="text-xs font-mono text-zinc-700 font-medium">{item.codigo}</span></td>
                  <td className="px-3 py-1.5 font-semibold text-zinc-900 text-xs">{item.nombre}</td>
                  <td className="px-3 py-1.5 text-center text-xs font-semibold text-zinc-700">{item.cantidad}</td>
                  
                  {/* Badges de Tipo con los colores de tu diseño anterior, pero más suaves */}
                  <td className="px-3 py-1.5 text-center">
                    <span className={`inline-flex w-2/3 justify-center items-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      item.tipo === 'PRODUCTO' 
                        ? 'bg-blue-200 text-blue-600 border-blue-300' 
                        : 'bg-purple-200 text-purple-600 border-purple-300'
                    }`}>
                      {item.tipo}
                    </span>
                  </td>
                  
                  <td className="px-3 py-1.5 text-center text-zinc-400">-</td>
                  <td className="px-3 py-1.5 text-right font-medium text-xs text-emerald-600">{item.costo}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-xs text-blue-600">{item.precio}</td>
                  
                  {/* Botones de Acción (Modernizados) */}
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="flex items-center justify-center w-8 h-8 rounded bg-zinc-200 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all active:scale-95" title="Editar">
                        <Edit size={14} />
                      </button>
                      <button className="flex items-center justify-center w-8 h-8 rounded bg-red-200 text-red-600 hover:bg-red-500 hover:text-white transition-all active:scale-95" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                      {/* El tercer botón azul de tu diseño (Movimientos/Transferencia) */}
                      <button className="flex items-center justify-center w-8 h-8 rounded bg-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95" title="Movimientos">
                        <ArrowRightLeft size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Form isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  )
}

export default DataTable;