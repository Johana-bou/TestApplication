// src/store/uiStore.ts
import { create } from 'zustand'

interface UIStore {
  rightSidebarOpen: boolean
  toggleRightSidebar: () => void
  closeRightSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  rightSidebarOpen: false,
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  closeRightSidebar: () => set({ rightSidebarOpen: false }),
}))