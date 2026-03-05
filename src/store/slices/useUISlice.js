export const createUISlice = (set) => ({
  activeTitle: 'Panel Principal',
  sedeName: null,
  activeDrawer: null, 
  drawerPayload: null,
  confirmModal: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null, 
  },
  activeModal: null,
  modalPayload: null,

  openModal: (modalName, payload = null) => set({ 
    activeModal: modalName, 
    modalPayload: payload 
  }),
  closeModal: () => set({ 
    activeModal: null, 
    modalPayload: null 
  }),

  openDrawer: (drawerName, payload = null) => set({ activeDrawer: drawerName, drawerPayload: payload }),
  closeDrawer: () => set({ activeDrawer: null, drawerPayload: null }),
  
  setActiveTitle: (title) => set({ activeTitle: title }),
  setSedeName: (name) => set({ sedeName: name }),
  clearSedeName: () => set({ sedeName: null }),

  openConfirm: ({ title, message, onConfirm }) => set({
    confirmModal: { isOpen: true, title, message, onConfirm }
  }),
  closeConfirm: () => set((state) => ({
    confirmModal: { ...state.confirmModal, isOpen: false, onConfirm: null }
  })),
})