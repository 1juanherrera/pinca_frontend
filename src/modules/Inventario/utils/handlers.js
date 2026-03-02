export const handleType = (func) => {
    switch (func) {
        case '0':
            return 'bg-blue-100 text-blue-700 border-blue-300';
        case '1':
            return 'bg-purple-100 text-purple-700 border-purple-300';
        case '2':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
    }
}