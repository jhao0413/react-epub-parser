"use client";
import { Languages } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownItem, DropdownMenu } from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";
import { useTransition } from "react";
import { setUserLocale } from "@/hooks/useLocale";
import { Locale } from "@/i18n/config";
import { useLocale } from "next-intl";
import { useRendererModeStore } from "@/store/rendererModeStore";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const mode = useRendererModeStore((state) => state.rendererMode);

  function onChange(value: string) {
    const locale = value as Locale;

    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          className=" bg-white dark:bg-neutral-900"
          isIconOnly
          variant={mode === "single" ? "bordered" : "shadow"}
          radius="sm"
        >
          <Languages className="cursor-pointer" size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        variant="light"
        selectionMode="single"
        selectedKeys={[locale]}
        onAction={(key) => onChange(String(key))}
      >
        <DropdownItem key="en">English</DropdownItem>
        <DropdownItem key="zh">简体中文</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
