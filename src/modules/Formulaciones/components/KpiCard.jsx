import { statsData, themeClasses } from '../utils/KpiCardList';

const KpiCard = ({ formulaciones = [], productDetail = null, recalculatedData = null }) => {

    const getDynamicValue = (label) => {
        switch (label.toLowerCase()) {
            case 'productos': 
                return formulaciones.length || 0;

            case 'componentes': 
                return productDetail?.formulaciones?.length || 0;

            case 'costo total': { // 🚩 Abrimos llaves aquí
                const costo = recalculatedData 
                    ? recalculatedData?.recalculados?.total_costo_materia_prima 
                    : productDetail?.costos?.total_costo_materia_prima;
                return costo ? `$ ${costo}` : '$ 0.00';
            } // 🚩 Cerramos llaves aquí

            default: 
                return 0;
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statsData.map((item, index) => {
                const theme = themeClasses[item.theme] || themeClasses.blue;
                const Icon = item.icon;
                
                // Usamos el valor dinámico basado en el label del KpiCardList
                const value = getDynamicValue(item.label);

                return (
                    <div 
                        key={index} 
                        className="bg-white rounded-lg border border-zinc-200/60 shadow-sm px-3 py-2 transition-all hover:shadow-md group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">
                                    {item.label}
                                </p>
                                <p className={`text-lg font-bold ${theme.value}`}>
                                    {value}
                                </p>
                            </div>
                            
                            {/* Tu contenedor de ícono circular original */}
                            <div className={`h-10 w-10 ${theme.iconBg} rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shrink-0`}>
                                <Icon className={`h-5 w-5 ${theme.iconText}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KpiCard;