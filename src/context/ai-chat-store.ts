import { create } from 'zustand';

interface AIChatState {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  toggleChat: () => void;
}

export const useAIChatStore = create<AIChatState>((set) => ({
  isChatOpen: false,
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
}));
