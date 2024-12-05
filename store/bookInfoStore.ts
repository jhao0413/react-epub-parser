import { create } from "zustand";

export type BookBasicInfoType = {
  title: string;
  creator: string;
  publisher: string;
  identifier: string;
  date: string;
  coverBlob: Blob | null;
  coverPath: string;
  toc: { text: string; path: string; file: string }[];
  blob?: Blob;
  language: string;
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
    language: "",
  },
  setBookInfo: (info: BookBasicInfoType) => set({ bookInfo: info }),
}));

export type DefaultBookType = {
  url: string;
  name: string;
};

export type DefaultBookInfoType = {
  [key: string]: DefaultBookType[];
};

export const defaultBookInfo: DefaultBookInfoType = {
  zh: [
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/%E5%B2%A9%E7%94%B0%E5%85%88%E7%94%9F_%E4%BB%BB%E5%A4%A9%E5%A0%82%E4%BC%A0%E5%A5%87%E7%A4%BE%E9%95%BF%E5%A6%82%E6%98%AF%E8%AF%B4(%E5%85%A8%E7%90%83%E6%8E%88%E6%9D%8310%E8%AF%AD%E7%A7%8D!%E4%BB%8E%E5%A4%A9%E6%89%8D%E7%A8%8B%E5%BA%8F%E5%91%98%2C%E5%88%B0%E4%B8%96%E7%95%8C%E9%A1%B6%E5%B0%96%E4%BC%81%E4%B8%9A%E7%AE%A1%E7%90%86%E8%80%85%2C%E6%89%AD%E8%BD%AC%E9%A2%93%E5%8A%BF%2C.epub",
      name: "岩田先生_任天堂传奇社长如是说.epub",
    },
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/%E5%BE%81%E6%9C%8D%E4%B8%96%E7%95%8C%E5%AE%8C%E5%85%A8%E6%89%8B%E5%86%8C%20tg%40sharebooks4you.epub",
      name: "征服世界完全手册.epub",
    },
  ],
  en: [
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/The%20Little%20Prince%20(Antoine%20de%20Saint-Exup%C3%A9ry)%20(Z-Library).epub",
      name: "The Little Prince.epub",
    },
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/All%20The%20Light%20We%20Cannot%20See%20(Anthony%20Doerr)%20(Z-Library).epub",
      name: "All The Light We Cannot See.epub",
    },
  ],
};
