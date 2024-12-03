import JSZip from "jszip";
import { create } from "zustand";

type bookZipStoreType = {
  bookZip: JSZip;
  setBookZip: (bookZip: JSZip) => void;
};

export const useBookZipStore = create<bookZipStoreType>((set) => ({
  bookZip: new JSZip(),
  setBookZip: (bookZip: JSZip) => set({ bookZip: bookZip }),
}));
