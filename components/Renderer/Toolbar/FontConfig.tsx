import { Button } from "@nextui-org/button";
import { Slider } from "@nextui-org/slider";
import { ALargeSmall, AArrowDown, AArrowUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface FontSizeProps {
  onFontChange: ({
    fontSize,
    fontFamily,
    fontUrl,
    fontFormat,
  }: {
    fontSize: number;
    fontFamily: string;
    fontUrl: string;
    fontFormat: string;
  }) => void;
}

const zhFontFamilies = [
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
];

const enFontFamilies = [
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
];

const FontConfig: React.FC<FontSizeProps> = ({ onFontChange }) => {
  const t = useTranslations("Renderer");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("sans");
  const cuurentFontFamilies = locale === "zh" ? zhFontFamilies : enFontFamilies;

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const fontInfo = cuurentFontFamilies.find((font) => font.value === fontFamily) || {
      value: "sans",
      url: "",
      format: "",
    };
    onFontChange({
      fontSize,
      fontFamily: fontInfo.value,
      fontUrl: fontInfo.url,
      fontFormat: fontInfo.format,
    });
  }, [fontSize, fontFamily, cuurentFontFamilies, onFontChange]);

  return (
    <>
      <div
        className="w-12 h-12 mt-4 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer z-50"
        onClick={handleMenuClick}
      >
        <ALargeSmall />
      </div>
      <div
        className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-10 z-10 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      ></div>
      <div
        className={`w-auto h-auto p-5 bg-white fixed bottom-[6vh] right-[10%] z-10 rounded-2xl transition-transform transition-opacity duration-500 transform ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } shadow-md`}
      >
        <Slider
          size="lg"
          step={2}
          label={t("fontSize")}
          showSteps={true}
          maxValue={26}
          minValue={18}
          defaultValue={20}
          getValue={(fontSize) => `${fontSize}px`}
          startContent={<AArrowDown className="text-2xl" />}
          endContent={<AArrowUp className="text-2xl" />}
          className="max-w-md"
          onChange={(value) => setFontSize(Number(value))}
        />
        <p className="mt-2">字体</p>
        <div className="grid gap-2 grid-cols-2">
          {cuurentFontFamilies.map((font) => (
            <Button
              key={font.value}
              variant="bordered"
              color={fontFamily === font.value ? "primary" : "default"}
              className={`min-w-36 bg-white p-1 rounded-md mt-2 font-${font.value} text-base`}
              style={{ fontFamily: font.value }}
              onClick={() => setFontFamily(font.value)}
            >
              {font.name}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default FontConfig;
