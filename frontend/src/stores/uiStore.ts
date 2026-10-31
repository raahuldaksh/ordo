import { create } from 'zustand';
import { format } from 'date-fns';

interface UIState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isQuickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  quickAddInitialTime: string | null;
  setQuickAddInitialTime: (time: string | null) => void;
  statusModalTask: any | null;
  setStatusModalTask: (task: any | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (date) => set({ selectedDate: date }),
  isQuickAddOpen: false,
  setQuickAddOpen: (open) => set({ isQuickAddOpen: open }),
  quickAddInitialTime: null,
  setQuickAddInitialTime: (time) => set({ quickAddInitialTime: time }),
  statusModalTask: null,
  setStatusModalTask: (task) => set({ statusModalTask: task }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

