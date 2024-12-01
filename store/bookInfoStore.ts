import { create } from "zustand";

type BookBasicInfoType = {
  title: string;
  creator: string;
  publisher: string;
  identifier: string;
  date: string;
  coverBlob: Blob | null;
  coverPath: string;
  toc: { text: string; path: string; file: string }[];
  blob: Blob;
};

type BookInfoStore = {
  bookInfo: BookBasicInfoType;
  setBookInfo: (info: BookBasicInfoType) => void;
};

export const useBookInfoStore = create<BookInfoStore>((set) => ({
  bookInfo: {
    title: "",
    creator: "",
    publisher: "",
    identifier: "",
    date: "",
    coverBlob: null,
    coverPath: "",
    toc: [],
    blob: new Blob(),
  },
  setBookInfo: (info: BookBasicInfoType) => set({ bookInfo: info }),
}));
