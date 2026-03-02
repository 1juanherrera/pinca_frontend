export const createInventorySlice = (set) => ({
  activeBodegaId: null,

  setBodega: (id) => set({ 
    activeBodegaId: id
  }),

  clearBodega: () => set({ 
    activeBodegaId: null
  }),
})