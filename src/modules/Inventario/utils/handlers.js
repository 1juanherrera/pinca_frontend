export const handleType = (value) => {
    const val = String(value || '').toUpperCase().trim();
    
    if (val === '0' || val === 'PRODUCTO') 
        return 'bg-blue-100 text-blue-700 border-blue-300';
    if (val === '1' || val === 'MATERIA PRIMA') 
        return 'bg-purple-100 text-purple-700 border-purple-300';
    if (val === '2' || val === 'INSUMO') 
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        
    return 'bg-gray-100 text-gray-700 border-gray-300';
}