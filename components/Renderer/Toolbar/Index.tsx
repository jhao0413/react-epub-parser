import FontConfig from "@/components/Renderer/Toolbar/FontConfig";
import Menu from "@/components/Renderer/Toolbar/Menu";
import SwitchRendererMode from "@/components/Renderer/Toolbar/SwitchRendererMode";
import { ThemeSwitcher } from "@/components/Renderer/Toolbar/ThemeSwitcher";

export const Toolbar = () => {
  return (
    <>
      <Menu />
      <SwitchRendererMode />
      <ThemeSwitcher />
      <FontConfig />
    </>
  );
};
