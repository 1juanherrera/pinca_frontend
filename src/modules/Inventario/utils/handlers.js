export const handleType = (func, item) => {
        const tipo = func(item);
        switch (tipo) {
            case '0':
                return 'bg-blue-100 text-blue-700';
            case '1':
                return 'bg-purple-100 text-purple-700';
            case '2':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }