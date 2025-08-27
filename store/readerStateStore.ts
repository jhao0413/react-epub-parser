import { create } from 'zustand';

type ReaderState = {
  currentChapter: number;
  currentPageIndex: number;
  setCurrentChapter: (chapter: number) => void;
  setCurrentPageIndex: (pageIndex: number) => void;
  setReaderState: (chapter: number, pageIndex: number) => void;
};

export const useReaderStateStore = create<ReaderState>(set => ({
  currentChapter: 0,
  currentPageIndex: 1,
  setCurrentChapter: (chapter: number) => set({ currentChapter: chapter }),
  setCurrentPageIndex: (pageIndex: number) => set({ currentPageIndex: pageIndex }),
  setReaderState: (chapter: number, pageIndex: number) => 
    set({ currentChapter: chapter, currentPageIndex: pageIndex }),
}));
