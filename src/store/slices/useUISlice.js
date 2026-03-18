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
    variant: 'danger',   // ← nuevo
    confirmText: null,   // ← nuevo
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

  openConfirm: ({ title, message, onConfirm, variant = 'danger', confirmText = null }) => set({
    confirmModal: { isOpen: true, title, message, onConfirm, variant, confirmText }
  }),

  // Resetea todo al cerrar, no solo isOpen
  closeConfirm: () => set({
    confirmModal: {
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      variant: 'danger',
      confirmText: null,
    }
  }),
})