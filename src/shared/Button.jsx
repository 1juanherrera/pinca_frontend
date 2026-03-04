
export const Button = ({ 
  children, 
  onClick, 
  variant = "black", 
  icon: Icon, 
  sizeIcon = 18,
  disabled,  
  type = "button", 
  className = ""  
}) => {
    
    const variants = {
        black: "bg-zinc-950 hover:bg-zinc-900 text-white shadow-zinc-950/20",
        blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        white: "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm",
        red: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20" // <- Añadida variante roja
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            // Agregamos justify-center para que el texto quede centrado siempre
            // Agregamos estilos para cuando está deshabilitado (disabled:opacity-60...)
            className={`flex items-center justify-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={sizeIcon} />}
            {children}
        </button>
    )
}

export const ButtonSquare = ({ onClick, variant = "black", icon: Icon, sizeIcon = 18, title }) => {

    const variants = {
        black: "bg-zinc-950 hover:bg-zinc-900 text-white shadow-zinc-950/20",
        blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        white: "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm"
    }   

    return (
        <button
            onClick={onClick}
            title={title}
            className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm transition-all active:scale-95 ${variants[variant]}`}
        >
            {Icon && <Icon size={sizeIcon} />}
        </button>
    )
}