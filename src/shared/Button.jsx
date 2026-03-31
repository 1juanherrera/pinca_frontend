
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
        black: "bg-zinc-950 hover:bg-zinc-800 text-white shadow-zinc-950/20",
        blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        white: "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm",
        red: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
        zinc: "bg-zinc-600 hover:bg-zinc-700 text-white shadow-zinc-600/20",
        orange: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20",
        amber: "bg-amber-500 hover:bg-amber-600 text-zinc-900 shadow-amber-500/20",
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 active:scale-95 hover:scale-105 border border-transparent rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-60 disabled:pointer-events-none disabled:hover:scale-100 disabled:active:scale-100 ${variants[variant]} ${className}`}
        >
            {Icon && <Icon size={sizeIcon} />}
            {children}
        </button>
    )
}

export const ButtonSquare = ({ onClick, variant = "black", icon: Icon, sizeIcon = 18, title, animate = "" }) => {

    const variants = {
        black: "bg-zinc-950 hover:bg-zinc-800 text-white shadow-zinc-950/20",
        blue: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20",
        emerald: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20",
        white: "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 shadow-sm",
        red: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
        zinc: "bg-zinc-600 hover:bg-zinc-700 text-white shadow-zinc-600/20",
        amber: "bg-amber-500 hover:bg-amber-600 text-zinc-900 shadow-amber-500/20",
    }

    return (
        <button
            onClick={onClick}
            title={title}
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95 hover:scale-105 disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 ${variants[variant]}`}
        >
            {Icon && <Icon className={animate} size={sizeIcon} />}
        </button>
    )
}