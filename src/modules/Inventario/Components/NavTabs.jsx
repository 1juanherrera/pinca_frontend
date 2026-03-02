import { 
  Layers,
  Package,
  FlaskConical,
  Puzzle,
  Search
} from 'lucide-react';

const NavTabs = () => {
    return (
        <div className="flex items-center justify-between bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-x-auto hide-scrollbar">
            <div className='flex'>
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold shadow-sm transition-all whitespace-nowrap">
                    <Layers size={16} className="text-zinc-500" />
                    TODOS
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <Package size={16} />
                    PRODUCTOS
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <FlaskConical size={16} />
                    MATERIA PRIMA
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <Puzzle size={16} />
                    INSUMOS
                </button>
            </div>

            <div className="relative group p-2 w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 ml-2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-800 transition-colors" size={16} />
                <input 
                type="text" 
                placeholder="Buscar por nombre o código..." 
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
          </div>

        </div>
    )
}

export default NavTabs;