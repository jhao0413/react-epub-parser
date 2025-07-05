import { create } from 'zustand';
import { FullBookTextIndexer, SearchResult } from '@/utils/fullBookTextIndexer';

interface FullBookSearchStore {
  indexer: FullBookTextIndexer;
  isIndexing: boolean;
  indexProgress: { current: number; total: number } | null;
  searchResults: SearchResult[];
  currentSearchQuery: string;
  
  setIndexing: (isIndexing: boolean) => void;
  searchText: (query: string, caseSensitive: boolean,  searchChapter: number | null ) => void;
  clearSearch: () => void;
  clearIndex: () => void;
}

export const useFullBookSearchStore = create<FullBookSearchStore>((set, get) => ({
  indexer: new FullBookTextIndexer(),
  isIndexing: false,
  indexProgress: null,
  searchResults: [],
  currentSearchQuery: '',

  setIndexing: (isIndexing: boolean) => set({ isIndexing }),
  
  searchText: (query: string, caseSensitive: boolean = false, searchChapter: number | null = null) => {
    const { indexer } = get();
    if (!query.trim()) {
      set({ searchResults: [], currentSearchQuery: '' });
      return;
    }

    const results = indexer.searchText(query, caseSensitive, searchChapter);
    
    const uniqueResults = results.filter((result, index, array) => {
      const resultKey = `${result.chapterIndex}-${result.position}-${result.matchText}`;
      return array.findIndex(r => 
        `${r.chapterIndex}-${r.position}-${r.matchText}` === resultKey
      ) === index;
    });
    
    set({ 
      searchResults: uniqueResults, 
      currentSearchQuery: query 
    });
  },

  clearSearch: () => set({ 
    searchResults: [], 
    currentSearchQuery: '' 
  }),

  clearIndex: () => {
    const { indexer } = get();
    indexer.clearIndex();
    set({ 
      isIndexing: false, 
      indexProgress: null, 
      searchResults: [], 
      currentSearchQuery: '' 
    });
  }
}));
