import { create } from "zustand";

type currentChapterStore = {
  currentChapter: number;
  setCurrentChapter: (chapter: number) => void;
};

export const useCurrentChapterStore = create<currentChapterStore>((set) => ({
  currentChapter: 0,
  setCurrentChapter: (chapter: number) => set({ currentChapter: chapter }),
}));
