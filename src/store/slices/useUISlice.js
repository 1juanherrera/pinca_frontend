export const createUISlice = (set) => ({
  activeTitle: 'Panel Principal',
  sedeName: null,
  activeDrawer: null, 
  drawerPayload: null,

  openDrawer: (drawerName, payload = null) => set({ activeDrawer: drawerName, drawerPayload: payload }),
  closeDrawer: () => set({ activeDrawer: null, drawerPayload: null }),
  
  setActiveTitle: (title) => set({ activeTitle: title }),
  setSedeName: (name) => set({ sedeName: name }),
  clearSedeName: () => set({ sedeName: null }),
})