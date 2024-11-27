import { Button } from "@nextui-org/button";
import { Slider } from "@nextui-org/slider";
import { ALargeSmall, AArrowDown, AArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
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

const fontFamilies = [
  { name: "默认字体", value: "sans", url: "", format: "" },
  {
    name: "思源宋体",
    value: "SiYuanSongTi",
    url: "/fonts/SourceHanSerifCN-Medium-6.otf",
    format: "opentype",
  },
  {
    name: "方正楷体",
    value: "FangZhengKaiTi",
    url: "/fonts/FangZhengKaiTiJianTi-1.ttf",
    format: "truetype",
  },
  {
    name: "思源黑体",
    value: "SiYuanHeiTi",
    url: "/fonts/SourceHanSansSC-Normal-2.otf",
    format: "opentype",
  },
  { name: "芫荽", value: "YanSui", url: "/fonts/Iansui0.91-Regular-2.ttf", format: "truetype" },
  {
    name: "汉字拼音体",
    value: "HanZiPinYin",
    url: "/fonts/HanZiPinYin.ttf",
    format: "truetype",
  },
  { name: "新叶念体", value: "XinYeNian", url: "/fonts/XinYeNian.otf", format: "truetype" },
  {
    name: "品如手写体",
    value: "PinRuShouXie",
    url: "/fonts/PinRuShouXie.ttf",
    format: "truetype",
  },
];

const FontConfig: React.FC<FontSizeProps> = ({ onFontChange }) => {
  const t = useTranslations("Renderer");
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("sans");

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const fontInfo = fontFamilies.find((font) => font.value === fontFamily) || {
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
  }, [fontSize, fontFamily]);

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
        className={`w-[16vw] h-[36vh] p-5 bg-white fixed bottom-[6vh] right-[10%] z-10 rounded-2xl transition-transform transition-opacity duration-500 transform ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } shadow-md`}
      >
        <Slider
          size="lg"
          step={2}
          label={t("fontSize")}
          showSteps={true}
          maxValue={24}
          minValue={16}
          defaultValue={18}
          getValue={(fontSize) => `${fontSize}px`}
          startContent={<AArrowDown className="text-2xl" />}
          endContent={<AArrowUp className="text-2xl" />}
          className="max-w-md"
          onChange={(value) => setFontSize(Number(value))}
        />
        <p className="mt-2">字体</p>
        <div className="grid gap-2 grid-cols-2">
          {fontFamilies.map((font) => (
            <Button
              key={font.value}
              variant="bordered"
              color={fontFamily === font.value ? "primary" : "default"}
              className={`bg-white p-1 rounded-md mt-2 font-${font.value} text-base`}
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
