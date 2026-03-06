export const GridInput = ({ label, id, placeholder, registration, error }) => (
  <div className={`
    relative flex flex-col h-full bg-white transition-all duration-200
    border-r border-b border-zinc-200
    hover:bg-zinc-50/80
    focus-within:bg-white focus-within:ring-1 focus-within:ring-inset focus-within:ring-zinc-900 focus-within:z-10
    ${error ? 'bg-red-50/50' : ''}
  `}>
    {/* Label: Estilo Industrial */}
    <label 
      htmlFor={id} 
      className="pt-3 px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer select-none"
    >
      {label}
    </label>

    {/* Input: Invisible y directo */}
    <input
      id={id}
      placeholder={placeholder}
      {...registration}
      className="
        w-full pb-3 pt-0.5 px-4 
        bg-transparent
        text-sm font-semibold text-zinc-900 
        placeholder:text-zinc-300 placeholder:font-normal
        border-none focus:ring-0 outline-none
      "
    />

    {/* Indicador de Error Sutil */}
    {error && (
      <div className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
    )}
  </div>
);