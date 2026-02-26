import { statsData, themeClasses } from '../utils/KpiCardList';

const KpiCard = () => {

    return (
        <>
        {/* 3. El Grid se mantiene igual, pero el contenido es dinámico */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                
                {statsData.map((item, index) => {
                // Obtenemos los colores según el tema definido en la lista
                const theme = themeClasses[item.theme] || themeClasses.blue;
                const Icon = item.icon;

                return (
                    <div 
                    key={index} 
                    className="bg-white rounded-lg border border-zinc-200/60 shadow-sm px-3 py-2 transition-all hover:shadow-md group"
                    >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-600">{item.label}</p>
                            <p className={`text-lg font-bold ${theme.value}`}>
                                {item.value}
                            </p>
                        </div>
                        
                        {/* Contenedor del ícono dinámico */}
                        <div className={`h-10 w-10 ${theme.iconBg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className={`h-5 w-5 ${theme.iconText}`} />
                        </div>
                    </div>
                    </div>
                );
                })}

            </div>
        </>
    )
}

export default KpiCard;