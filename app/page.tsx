"use client";

import { useRef } from "react";
import DoubleColumnRenderer from "@/components/Renderer/DoubleColumnRenderer";
import epubStructureParser from "@/utils/epubStructureParser";
import Image from "next/image";
import { DownloadIcon } from "@/components/ui/download";
import { Github } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@nextui-org/button";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Input } from "@nextui-org/input";
import SingleColumnRenderer from "@/components/Renderer/SingleColumnRenderer";
import { useRendererModeStore } from "@/store/rendererModeStore";
import { defaultBookInfo, useBookInfoStore, DefaultBookType } from "@/store/bookInfoStore";
import { useBookZipStore } from "@/store/bookZipStore";
import { loadZip } from "@/utils/zipUtils";

function App() {
  const locale = useLocale();
  const t = useTranslations("HomePage");
  const rendererMode = useRendererModeStore((state) => state.rendererMode);
  const bookInfo = useBookInfoStore((state) => state.bookInfo);
  const setBookInfo = useBookInfoStore((state) => state.setBookInfo);
  const setBookZip = useBookZipStore((state) => state.setBookZip);
  const books = defaultBookInfo[locale];

  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const file = files[0];

    if (file) {
      const fileSizeInBytes = file.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      const fileBlob = await getFileBinary(file);
      const jsZip = await loadZip(file);
      setBookZip(jsZip);
      const bookParserInfo = await epubStructureParser(file);
      setBookInfo({
        blob: fileBlob as Blob,
        ...bookParserInfo,
        size: `${parseFloat(fileSizeInMB)} MB`,
      });
    }
  };

  function getFileBinary(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result;
        resolve(arrayBuffer);
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {bookInfo.title ? (
        rendererMode === "single" ? (
          <SingleColumnRenderer />
        ) : (
          <DoubleColumnRenderer />
        )
      ) : (
        <>
          <div className="w-full h-screen bg-gray-100 flex justify-center items-center dark:bg-neutral-800">
            <div className="w-4/5 h-[96vh]">
              <div className="w-full">
                <Input
                  id="picture"
                  type="file"
                  accept=".epub"
                  ref={inputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex w-full justify-between">
                  <div>
                    <Button className="bg-black text-white" radius="sm" onClick={handleButtonClick}>
                      {t("selectEpub")}
                    </Button>
                  </div>

                  <div className="flex items-center">
                    <LocaleSwitcher />
                    <Button
                      className="ml-4 bg-white dark:bg-neutral-900"
                      isIconOnly
                      variant="shadow"
                      radius="sm"
                      onClick={() =>
                        window.open("https://github.com/jhao0413/react-epub-parser", "_blank")
                      }
                    >
                      <Github size={16} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="w-full h-[90%] bg-white p-14 mt-4 rounded-2xl dark:bg-neutral-900">
                <div className="flex items-center mb-2">
                  <Image
                    src="https://jhao413.oss-cn-beijing.aliyuncs.com/epub-parser-logo.png"
                    width={60}
                    height={60}
                    alt=""
                  />
                  <h1 className="text-3xl font-bold ml-2">{t("title")}</h1>
                </div>
                <p>{t("introduction")}</p>
                <p className="font-bold text-xl mt-4">{t("example")}</p>
                <div className="flex mt-2">
                  {books.map((book: DefaultBookType, index) => (
                    <Button
                      className="mr-2"
                      key={index}
                      onClick={() => handleDownload(book.url, book.name)}
                    >
                      <DownloadIcon />
                      {book.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
