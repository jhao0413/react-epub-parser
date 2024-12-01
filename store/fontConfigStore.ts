import { create } from "zustand";

type rendererConfigType = {
  fontSize: number;
  fontFamily: string;
  fontUrl: string;
  fontFormat: string;
  lineHeight: number;
};

type rendererConfigStore = {
  rendererConfig: rendererConfigType;
  setRendererConfig: (config: rendererConfigType) => void;
};

export const useRendererConfigStore = create<rendererConfigStore>((set) => ({
  rendererConfig: {
    fontSize: 20,
    fontFamily: "sans",
    fontUrl: "",
    fontFormat: "",
    lineHeight: 1.5,
  },
  setRendererConfig: (config: rendererConfigType) => set({ rendererConfig: config }),
}));

export interface Font {
  name: string;
  value: string;
  url: string;
  format: string;
}

interface FontStore {
  zhFontFamilies: Font[];
  enFontFamilies: Font[];
}

export const useFontStore = create<FontStore>(() => ({
  zhFontFamilies: [
    { name: "默认字体", value: "sans", url: "", format: "" },
    {
      name: "思源宋体",
      value: "SiYuanSongTi",
      url: "/fonts/Chinese/SourceHanSerifCN-Medium-6.otf",
      format: "opentype",
    },
    {
      name: "方正楷体",
      value: "FangZhengKaiTi",
      url: "/fonts/Chinese/FangZhengKaiTiJianTi-1.ttf",
      format: "truetype",
    },
    {
      name: "思源黑体",
      value: "SiYuanHeiTi",
      url: "/fonts/Chinese/SourceHanSansSC-Normal-2.otf",
      format: "opentype",
    },
    {
      name: "霞鹭臻楷",
      value: "XiaLuZhenKai",
      url: "/fonts/Chinese/XiaLuZhenKai.ttf",
      format: "truetype",
    },
    {
      name: "汉字拼音体",
      value: "HanZiPinYin",
      url: "/fonts/Chinese/HanZiPinYin.ttf",
      format: "truetype",
    },
    {
      name: "江城圆体",
      value: "JiangChengYuanTi",
      url: "/fonts/Chinese/JiangChengYuanTi.ttf",
      format: "truetype",
    },
    {
      name: "临海隶书",
      value: "LinHaiLiShu",
      url: "/fonts/Chinese/LinHaiLiShu.ttf",
      format: "truetype",
    },
  ],
  enFontFamilies: [
    { name: "Default Font", value: "sans", url: "", format: "" },
    {
      name: "Comfortaa",
      value: "Comfortaa",
      url: "/fonts/English/Comfortaa-Medium.ttf",
      format: "truetype",
    },
    {
      name: "FrederickatheGreat",
      value: "FrederickatheGreat",
      url: "/fonts/English/FrederickatheGreat.ttf",
      format: "truetype",
    },
    {
      name: "RobotoSlab",
      value: "RobotoSlab",
      url: "/fonts/English/RobotoSlab-Medium.ttf",
      format: "truetype",
    },
    {
      name: "Merienda",
      value: "Merienda",
      url: "/fonts/English/Merienda-Regular.ttf",
      format: "truetype",
    },
    {
      name: "ComicNeueAngular",
      value: "ComicNeueAngular",
      url: "/fonts/English/ComicNeueAngular-Regular.ttf",
      format: "truetype",
    },
  ],
}));
