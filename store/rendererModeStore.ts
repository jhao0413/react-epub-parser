import { create } from 'zustand';

type rendererModeType = 'single' | 'double';

type rendererModeStore = {
  rendererMode: rendererModeType;
  setRendererMode: (mode: rendererModeType) => void;
};

export const useRendererModeStore = create<rendererModeStore>(set => ({
  rendererMode: 'double',
  setRendererMode: (mode: rendererModeType) => set({ rendererMode: mode }),
}));
