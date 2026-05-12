export const createAuthSlice = (set) => ({
    token:   localStorage.getItem('token') || null,
    user:    JSON.parse(localStorage.getItem('pinca-user') || 'null'),

    setAuth: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('pinca-user', JSON.stringify(user));
        set({ token, user });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('pinca-user');
        set({ token: null, user: null });
    },
});
