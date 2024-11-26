"use client";
import { Languages } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownItem, Button, DropdownMenu } from "@nextui-org/react";
import { useTransition } from "react";
import { setUserLocale } from "@/hooks/use-locale";
import { Locale } from "@/i18n/config";

type Props = {
  localeValue: string;
};

export default function LocaleSwitcher({ localeValue }: Props) {
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const locale = value as Locale;
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button className=" bg-white" isIconOnly variant="shadow" radius="sm">
          <Languages className="cursor-pointer" size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        variant="light"
        selectionMode="single"
        selectedKeys={[localeValue]}
        onAction={(key) => onChange(String(key))}
      >
        <DropdownItem key="en">English</DropdownItem>
        <DropdownItem key="zh">简体中文</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
