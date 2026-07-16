// Lee el usuario persistido sin poder romper el arranque: si localStorage quedó
// con basura (p.ej. el string literal "undefined"), no tira y cae a null.
const readStoredUser = () => {
    try {
        const raw = localStorage.getItem('pinca-user');
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('pinca-user');
        return null;
    }
};

export const createAuthSlice = (set) => ({
    token:   localStorage.getItem('token') || null,
    user:    readStoredUser(),

    setAuth: (token, user) => {
        if (token) localStorage.setItem('token', token);
        // No persistir basura: si user es nullish, JSON.stringify daría "undefined"
        // (que al releer rompía el arranque). Limpiamos en su lugar.
        if (user == null) localStorage.removeItem('pinca-user');
        else localStorage.setItem('pinca-user', JSON.stringify(user));
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('pinca-user');
        localStorage.removeItem('pinca:refresh_token');
        set({ token: null, user: null });
    },
});
