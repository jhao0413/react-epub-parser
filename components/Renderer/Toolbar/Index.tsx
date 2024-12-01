import FontConfig from "@/components/Renderer/Toolbar/FontConfig";
import Menu from "@/components/Renderer/Toolbar/Menu";
import SwitchRendererMode from "@/components/Renderer/Toolbar/SwitchRendererMode";

export const Toolbar = () => {
  return (
    <>
      <Menu />
      <FontConfig />
      <SwitchRendererMode />
    </>
  );
};
