import { Slider } from "@nextui-org/slider";
import { AArrowDown, AArrowUp, ALargeSmall } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface FontSizeProps {
  onFontSizeChange: (fontSize: number) => void;
}

const FontSize: React.FC<FontSizeProps> = ({ onFontSizeChange }) => {
  const t = useTranslations("Renderer");
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  const handleFontSizeChange = (fontSize: number) => {
    onFontSizeChange(fontSize);
  };

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
        className={`w-[16vw] h-[10vh] p-5 bg-white fixed bottom-[6vh] right-[10%] z-10 rounded-2xl transition-transform transition-opacity duration-500 transform ${
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
          onChange={(value) => handleFontSizeChange(Number(value))}
        />
      </div>
    </>
  );
};

export default FontSize;
