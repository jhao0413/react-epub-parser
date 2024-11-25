"use client";

import { useRef, useState } from "react";
import EpubReader from "@/components/Renderer/Renderer";
import epubStructureParser from "@/lib/epub-structure-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { DownloadIcon } from "@/components/ui/download";
import "./page.css";
import { Github } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/localeSwitcher";

interface FileInfo {
  name: string;
  size: number;
  blob: Blob | null;
}

interface BookBasicInfo {
  title: string;
  creator: string;
  publisher: string;
  identifier: string;
  date: string;
  coverBlob: Blob | null;
  coverPath: string;
  toc: { text: string; path: string; file: string }[];
}

const books = {
  zh: [
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/%E5%B2%A9%E7%94%B0%E5%85%88%E7%94%9F_%E4%BB%BB%E5%A4%A9%E5%A0%82%E4%BC%A0%E5%A5%87%E7%A4%BE%E9%95%BF%E5%A6%82%E6%98%AF%E8%AF%B4(%E5%85%A8%E7%90%83%E6%8E%88%E6%9D%8310%E8%AF%AD%E7%A7%8D!%E4%BB%8E%E5%A4%A9%E6%89%8D%E7%A8%8B%E5%BA%8F%E5%91%98%2C%E5%88%B0%E4%B8%96%E7%95%8C%E9%A1%B6%E5%B0%96%E4%BC%81%E4%B8%9A%E7%AE%A1%E7%90%86%E8%80%85%2C%E6%89%AD%E8%BD%AC%E9%A2%93%E5%8A%BF%2C.epub",
      name: "岩田先生_任天堂传奇社长如是说.epub",
    },
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/%E5%BE%81%E6%9C%8D%E4%B8%96%E7%95%8C%E5%AE%8C%E5%85%A8%E6%89%8B%E5%86%8C%20tg%40sharebooks4you.epub",
      name: "征服世界完全手册.epub",
    },
  ],
  en: [
    {
      url: "https://jhao413.oss-cn-beijing.aliyuncs.com/Ask%20Iwata%20(Satoru%20Iwata%2C%20Blanca%20Mira)%20(Z-Library).epub",
      name: "Ask Iwata.epub",
    },
  ],
};

function App() {
  const locale = useLocale() as keyof typeof books;
  const t = useTranslations("HomePage");

  const inputRef = useRef<HTMLInputElement>(null);
  const [fileState, setFileState] = useState<{
    fileInfo: FileInfo;
    bookBasicInfo: BookBasicInfo | null;
  }>({
    fileInfo: { name: "", size: 0, blob: null },
    bookBasicInfo: null,
  });

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
    const file = files[0];

    if (file) {
      const fileSizeInBytes = file.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      const fileBlob = await getFileBinary(file);
      const bookParserInfo = await epubStructureParser(file);
      setFileState({
        fileInfo: {
          name: file.name,
          size: parseFloat(fileSizeInMB),
          blob: fileBlob as Blob,
        },
        bookBasicInfo: { ...bookParserInfo },
      });
    }
  };

  function getFileBinary(file: Blob) {
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
    <div className="app">
      <div className="uploadEpub">
        <Input
          id="picture"
          type="file"
          accept=".epub"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <div className="flex w-full justify-between">
          <div>
            <Button type="button" onClick={handleButtonClick}>
              {t("selectEpub")}
            </Button>
            <span style={{ marginLeft: "10px" }}>
              {fileState.fileInfo.name}{" "}
              {fileState.fileInfo.name ? `${fileState.fileInfo.size}MB` : null}
            </span>
          </div>

          <div className="flex items-center">
            <LocaleSwitcher localeValue={locale} />
            <Button
              className="ml-2"
              variant="outline"
              size="icon"
              onClick={() => window.open("https://github.com/jhao0413/react-epub-parser", "_blank")}
            >
              <Github />
            </Button>
          </div>
        </div>
      </div>

      <div style={{ height: "100%" }}>
        {fileState.bookBasicInfo ? (
          <EpubReader blob={fileState.fileInfo.blob} bookBasicInfo={fileState.bookBasicInfo} />
        ) : (
          <>
            <div>
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
                {books[locale]?.map((book, index) => (
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;
