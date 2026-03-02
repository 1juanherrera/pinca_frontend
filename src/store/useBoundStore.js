import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createUISlice } from './slices/useUISlice';
import { createInventorySlice } from './slices/inventorySlice';

export const useBoundStore = create(
  persist(
    (...a) => ({
      ...createUISlice(...a),
      ...createInventorySlice(...a)
    }),
    {
      name: 'pinca-storage',
      storage: createJSONStorage(() => localStorage),
      
      partialize: (state) => ({ 
        activeTitle: state.activeTitle,
        activeBodegaId: state.activeBodegaId,
        sedeName: state.sedeName,
      }),
    }
  )
)