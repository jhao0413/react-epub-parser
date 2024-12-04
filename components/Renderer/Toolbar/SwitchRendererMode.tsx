import { useRendererModeStore } from "@/store/rendererModeStore";
import { BookOpenText, Newspaper } from "lucide-react";

const SwitchRendererMode: React.FC = () => {
  const mode = useRendererModeStore((state) => state.rendererMode);
  const setRendererMode = useRendererModeStore((state) => state.setRendererMode);

  return (
    <>
      <div
        className="w-12 h-12 mt-4 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer z-10 dark:bg-neutral-900"
        onClick={() => setRendererMode(mode === "single" ? "double" : "single")}
      >
        {mode === "single" ? <BookOpenText /> : <Newspaper />}
      </div>
    </>
  );
};

export default SwitchRendererMode;
