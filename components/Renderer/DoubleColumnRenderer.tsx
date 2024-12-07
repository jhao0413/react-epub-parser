"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@nextui-org/button";
import { useBookInfoStore } from "@/store/bookInfoStore";
import { useCurrentChapterStore } from "@/store/currentChapterStore";
import { useRendererConfigStore } from "@/store/fontConfigStore";
import { Toolbar } from "@/components/Renderer/Toolbar/Index";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { useTheme } from "next-themes";
import { useBookZipStore } from "@/store/bookZipStore";
import { loadChapterContent } from "@/utils/chapterLoader";
import { parseAndProcessChapter } from "@/utils/chapterParser";
import {
  handleIframeLoad,
  waitForImagesAndCalculatePages,
  writeToIframe,
} from "@/utils/iframeHandler";
import { applyFontAndThemeStyles } from "@/utils/styleHandler";
import { useRendererModeStore } from "@/store/rendererModeStore";

const COLUMN_GAP = 100;

const EpubReader: React.FC = () => {
  const t = useTranslations("Renderer");
  const currentChapter = useCurrentChapterStore((state) => state.currentChapter);
  const setCurrentChapter = useCurrentChapterStore((state) => state.setCurrentChapter);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const goToLastPageRef = useRef(false);
  const pageWidthRef = useRef(0);
  const pageCountRef = useRef(0);
  const currentFontConfig = useRendererConfigStore((state) => state.rendererConfig);
  const bookInfo = useBookInfoStore((state) => state.bookInfo);
  const { theme } = useTheme();
  const bookZip = useBookZipStore((state) => state.bookZip);
  const rendererMode = useRendererModeStore((state) => state.rendererMode);

  useEffect(() => {
    const processChapter = async () => {
      const { chapterContent, basePath } = await loadChapterContent(
        bookZip,
        bookInfo,
        currentChapter
      );
      const updatedChapter = await parseAndProcessChapter(chapterContent, bookZip, basePath);
      const renderer = writeToIframe(
        updatedChapter,
        currentFontConfig,
        theme,
        rendererMode,
        COLUMN_GAP
      );
      const iframeDoc =
        renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
      if (iframeDoc) {
        waitForImagesAndCalculatePages(renderer, iframeDoc);
      } else {
        console.error("Iframe document not found");
      }

      return handleIframeLoad(
        renderer,
        pageWidthRef,
        pageCountRef,
        goToLastPageRef,
        setCurrentPageIndex,
        COLUMN_GAP
      );
    };

    processChapter();
  }, [bookInfo, bookZip, rendererMode, currentChapter]);

  useEffect(() => {
    const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
    if (!renderer || !renderer.contentWindow) {
      throw new Error("Renderer not found");
    }

    applyFontAndThemeStyles(currentFontConfig, theme, rendererMode, COLUMN_GAP);
  }, [currentFontConfig, theme, rendererMode]);

  const getRendererWindow = () => {
    const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
    if (renderer?.contentWindow) {
      return renderer.contentWindow;
    } else {
      console.error("Renderer not found");
      return null;
    }
  };

  const handleNextPage = () => {
    const rendererWindow = getRendererWindow();
    if (!rendererWindow) return;

    if (currentPageIndex < pageCountRef.current) {
      rendererWindow.scrollTo({
        left: currentPageIndex * pageWidthRef.current,
      });
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentChapter < bookInfo.toc.length - 1) {
      setCurrentPageIndex(1);
      setCurrentChapter(currentChapter + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex === 1 && currentChapter === 0) {
      return;
    }

    if (currentPageIndex === 1 && currentChapter > 0) {
      goToLastPageRef.current = true;
      setCurrentChapter(currentChapter - 1);
    } else if (currentPageIndex > 1) {
      const rendererWindow = getRendererWindow();
      if (!rendererWindow) return;

      rendererWindow.scrollTo({
        left: (currentPageIndex - 2) * pageWidthRef.current,
      });
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex justify-center items-center flex-col dark:bg-neutral-800">
      <div className="flex w-4/5 h-12 justify-between items-center">
        <div>
          <p
            className={`font-bold text-lg font-XiaLuZhenKai ${
              bookInfo.language === "zh" ? "" : "italic"
            }`}
          >
            {bookInfo.language === "zh" ? `《${bookInfo.title}》` : bookInfo.title}
          </p>
        </div>
        <div>
          <LocaleSwitcher />
          <Button
            className="ml-4 bg-white dark:bg-neutral-900"
            isIconOnly
            variant="shadow"
            radius="sm"
            onClick={() => window.open("https://github.com/jhao0413/react-epub-parser", "_blank")}
          >
            <Github size={16} className="dark:bg-neutral-900" />
          </Button>
        </div>
      </div>
      <div className="w-4/5 h-[86vh] bg-white p-14 mt-4 rounded-2xl dark:bg-neutral-900">
        <div className="h-full relative">
          <iframe id="epub-renderer" style={{ width: "100%", height: "100%" }}></iframe>
          <div className="w-full flex justify-between">
            <Button
              radius="full"
              variant="bordered"
              className="bg-white border-2 border-inherit dark:bg-neutral-900"
              onClick={handlePrevPage}
            >
              <ChevronLeft size={16} />
              {t("previous")}
            </Button>
            <Button
              radius="full"
              variant="bordered"
              className="bg-white border-2 border-inherit dark:bg-neutral-900"
              onClick={handleNextPage}
            >
              {t("next")}
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="absolute right-[-140px] top-0 bottom-0 flex flex-col justify-center items-center">
            <Toolbar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpubReader;
