import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const Form = ({ isOpen, onClose }) => {
  // 1. Estado inicial del formulario
  const estadoInicial = {
    codigo: '',
    nombre: '',
    tipo: 'PRODUCTO',
    cantidad: '',
    costo: '',
    precio: ''
  };

  const [formData, setFormData] = useState(estadoInicial);
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Manejador dinámico de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Limpiar el error de ese campo específico cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores({ ...errores, [name]: null });
    }
  };

  // 3. Sistema de Validación y Envío
  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    // Reglas de validación (puedes agregar más)
    if (!formData.codigo.trim()) nuevosErrores.codigo = "El código es obligatorio";
    if (!formData.nombre.trim()) nuevosErrores.nombre = "El nombre no puede estar vacío";
    if (!formData.cantidad || isNaN(formData.cantidad)) nuevosErrores.cantidad = "Ingresa una cantidad válida";
    if (!formData.precio) nuevosErrores.precio = "Fija un precio base";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return; // Detiene el envío si hay errores
    }

    // Si todo está bien, simulamos el envío a la base de datos
    setIsSubmitting(true);
    setTimeout(() => {
      console.log("Datos guardados:", formData);
      setIsSubmitting(false);
      onClose(); // Cierra el panel después de guardar
    }, 1000);
  };

  // Si no está abierto, no renderizamos el contenido (optimización)
  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP: Fondo oscuro con efecto cristal (blur) */}
      <div 
        className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* DRAWER: Panel lateral que se desliza desde la derecha */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-zinc-200/80 flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
        
        {/* HEADER DEL PANEL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Nuevo Item</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Ingresa los detalles del producto o materia prima.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="item-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Fila 1: Código y Tipo (Grid de 2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Código <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="codigo" value={formData.codigo} onChange={handleChange}
                  placeholder="Ej. VIN-001"
                  className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errores.codigo ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200/80 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                />
                {errores.codigo && <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1"><AlertCircle size={12}/> {errores.codigo}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Tipo</label>
                <select 
                  name="tipo" value={formData.tipo} onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="PRODUCTO">Producto Terminado</option>
                  <option value="MATERIA PRIMA">Materia Prima</option>
                  <option value="INSUMO">Insumo</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Nombre (Ancho completo) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700">Nombre del Item <span className="text-red-500">*</span></label>
              <input 
                type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                placeholder="Ej. Pintura Esmalte Blanco 1 Galón"
                className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errores.nombre ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200/80 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errores.nombre && <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1"><AlertCircle size={12}/> {errores.nombre}</span>}
            </div>

            {/* Fila 3: Cantidad (Ancho completo) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700">Stock Inicial <span className="text-red-500">*</span></label>
              <input 
                type="number" name="cantidad" value={formData.cantidad} onChange={handleChange}
                placeholder="0"
                className={`w-full px-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errores.cantidad ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200/80 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              {errores.cantidad && <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1"><AlertCircle size={12}/> {errores.cantidad}</span>}
            </div>

            {/* Fila 4: Costo y Precio (Grid de 2 columnas) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Costo Base</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <input 
                    type="number" name="costo" value={formData.costo} onChange={handleChange}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Precio Venta <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                  <input 
                    type="number" name="precio" value={formData.precio} onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-2.5 bg-zinc-50 border rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errores.precio ? 'border-red-500 focus:ring-red-500/20' : 'border-zinc-200/80 focus:ring-blue-500/20 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errores.precio && <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium mt-1"><AlertCircle size={12}/> {errores.precio}</span>}
              </div>
            </div>

          </form>
        </div>

        {/* FOOTER DEL PANEL (Botones de Acción) */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200/80 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95 shadow-sm"
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            form="item-form" // Conecta con el ID del form arriba
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 border border-transparent rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <><Save size={18} /> Guardar Item</>
            )}
          </button>
        </div>

      </div>
    </>
  );
};

export default Form;