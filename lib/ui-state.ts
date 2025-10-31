import { create } from 'zustand';

interface UIState {
  drawerOpen: boolean;
  selectedRequestId: number | null;
  openDrawer: (requestId: number) => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false,
  selectedRequestId: null,
  openDrawer: (requestId: number) => set({ drawerOpen: true, selectedRequestId: requestId }),
  closeDrawer: () => set({ drawerOpen: false, selectedRequestId: null }),
}));

