import { useBookInfoStore } from "@/store/bookInfoStore";
import { useFontStore, useRendererConfigStore } from "@/store/fontConfigStore";
import { useRendererModeStore } from "@/store/rendererModeStore";
import { Button } from "@nextui-org/button";
import { Slider } from "@nextui-org/slider";
import { ALargeSmall, AArrowDown, AArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const FontConfig: React.FC = ({}) => {
  const t = useTranslations("Renderer");
  const [isOpen, setIsOpen] = useState(false);
  const mode = useRendererModeStore((state) => state.rendererMode);
  const rendererConfig = useRendererConfigStore((state) => state.rendererConfig);
  const setRendererConfig = useRendererConfigStore((state) => state.setRendererConfig);
  const { zhFontFamilies, enFontFamilies } = useFontStore((state) => state);
  const bookInfo = useBookInfoStore((state) => state.bookInfo);
  const cuurentFontFamilies = bookInfo.language === "zh" ? zhFontFamilies : enFontFamilies;

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  const onFontSizeChange = (value: number) => {
    setRendererConfig({
      ...rendererConfig,
      fontSize: value,
    });
  };

  const onFontFamilyChange = (value: string) => {
    const fontInfo = cuurentFontFamilies.find((font) => font.value === value);
    setRendererConfig({
      ...rendererConfig,
      fontFamily: value,
      fontUrl: fontInfo?.url || "",
      fontFormat: fontInfo?.format || "",
    });
  };

  return (
    <>
      <div
        className="w-12 h-12 mt-4 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer z-10 dark:bg-neutral-900"
        onClick={handleMenuClick}
      >
        <ALargeSmall />
      </div>
      <div
        className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-10 z-20 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      ></div>
      <div
        className={`w-auto h-auto p-5 bg-white dark:bg-neutral-800 fixed bottom-[calc(7vh-32px)] ${
          mode === "single" ? "right-1/4" : "right-[10%]"
        } z-30 rounded-2xl transition-opacity duration-500 transform ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } shadow-md`}
      >
        <Slider
          size="lg"
          step={2}
          color="foreground"
          label={t("fontSize")}
          showSteps={true}
          maxValue={26}
          minValue={18}
          defaultValue={rendererConfig.fontSize}
          getValue={(fontSize) => `${fontSize}px`}
          startContent={<AArrowDown className="text-2xl" />}
          endContent={<AArrowUp className="text-2xl" />}
          className="max-w-md"
          onChange={(value) => onFontSizeChange(Number(value))}
        />
        <p className="mt-2">{t("fontFamily")}</p>
        <div className="grid gap-2 grid-cols-2">
          {cuurentFontFamilies.map((font) => (
            <Button
              key={font.value}
              variant="bordered"
              color={rendererConfig.fontFamily === font.value ? "primary" : "default"}
              className={`min-w-36 bg-white dark:bg-neutral-700 p-1 rounded-md mt-2 font-${font.value} text-base`}
              style={{ fontFamily: font.value }}
              onClick={() => onFontFamilyChange(font.value)}
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
