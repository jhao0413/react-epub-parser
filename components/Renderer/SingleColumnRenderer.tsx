"use client";

import React, { useEffect } from "react";
import JSZip from "jszip";
import { resolvePath } from "@/lib/utils";
import { Button } from "@nextui-org/button";
import { useBookInfoStore } from "@/store/bookInfoStore";
import { useCurrentChapterStore } from "@/store/currentChapterStore";
import { useRendererConfigStore } from "@/store/fontConfigStore";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Github } from "lucide-react";
import { useTheme } from "next-themes";
import { Toolbar } from "@/components/Renderer/Toolbar/Index";

const EpubReader: React.FC = () => {
  const currentChapter = useCurrentChapterStore((state) => state.currentChapter);
  const setCurrentChapter = useCurrentChapterStore((state) => state.setCurrentChapter);
  const currentFontConfig = useRendererConfigStore((state) => state.rendererConfig);
  const bookInfo = useBookInfoStore((state) => state.bookInfo);
  const { theme } = useTheme();

  useEffect(() => {
    if (!bookInfo.blob || !bookInfo.toc) {
      return;
    }

    JSZip.loadAsync(bookInfo.blob)
      .then(async (zip) => {
        const { chapterContent, zip: loadedZip, basePath } = await loadChapterContent(zip);
        const updatedChapter = await parseAndProcessChapter(chapterContent, loadedZip, basePath);
        const renderer = writeToIframe(updatedChapter);
        const iframeDoc =
          renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
        if (iframeDoc) {
          await waitForImagesAndCalculatePages(renderer, iframeDoc);
        } else {
          console.error("Iframe document not found");
        }

        return handleIframeLoad(renderer);
      })
      .catch((error) => {
        console.error(error);
      });

    const loadChapterContent = async (zip: JSZip) => {
      const contentOpfPath = `${
        bookInfo.toc[currentChapter].path ? bookInfo.toc[currentChapter].path + "/" : ""
      }${decodeURIComponent(bookInfo.toc[currentChapter].file)}`;
      const chapterFile = zip.file(contentOpfPath);
      if (chapterFile) {
        const chapterContent = await chapterFile.async("string");
        return {
          chapterContent,
          zip,
          basePath: bookInfo.toc[currentChapter].path,
        };
      } else {
        throw new Error("Content file not found");
      }
    };

    const parseAndProcessChapter = async (chapterContent: string, zip: JSZip, basePath: string) => {
      const parser = new DOMParser();
      const chapterDoc = parser.parseFromString(chapterContent, "application/xml");

      if (!chapterDoc) {
        throw new Error("Failed to parse chapter content");
      }

      const xmlDoc = parser.parseFromString(
        chapterDoc.documentElement.outerHTML,
        "application/xml"
      );

      // process link tags
      const links = xmlDoc.querySelectorAll('link[rel="stylesheet"]');
      for (const link of Array.from(links)) {
        const href = link.getAttribute("href") || "";
        const resolvedPath = resolvePath(basePath, href);
        const linkCssFile = zip.file(resolvedPath);
        if (linkCssFile) {
          const linkCss = await linkCssFile.async("blob");
          const blobUrl = URL.createObjectURL(linkCss);
          link.setAttribute("href", blobUrl);
        }
      }

      // process img tags
      const images = xmlDoc.querySelectorAll("img");
      for (const img of Array.from(images)) {
        const src = img.getAttribute("src") || "";
        const resolvedPath = resolvePath(basePath, src);
        const imgFile = zip.file(resolvedPath);
        if (imgFile) {
          const imgBlob = await imgFile.async("blob");
          const blobUrl = URL.createObjectURL(imgBlob);
          img.setAttribute("src", blobUrl);
        }
      }

      const serializer = new XMLSerializer();
      const updatedChapter = serializer.serializeToString(xmlDoc);
      return updatedChapter;
    };

    const writeToIframe = (updatedChapter: string) => {
      const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
      if (!renderer || !renderer.contentWindow) {
        throw new Error("Renderer not found");
      }
      const iframeDoc =
        renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
      iframeDoc.open();
      iframeDoc.write(updatedChapter);
      iframeDoc.close();

      fontChange();
      return renderer;
    };

    const waitForImagesAndCalculatePages = (renderer: HTMLIFrameElement, iframeDoc: Document) => {
      const iframeImages = iframeDoc.images;
      const imagesLoaded = Array.from(iframeImages).map((img) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(undefined);
          } else {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve);
          }
        });
      });

      Promise.all(imagesLoaded).then(() => {
        if (!renderer?.contentWindow) {
          console.error("Renderer not found");
          return;
        }
      });
    };

    const fontChange = () => {
      const { fontSize, fontFamily, fontUrl, fontFormat } = currentFontConfig;

      const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
      if (!renderer || !renderer.contentWindow) {
        throw new Error("Renderer not found");
      }
      const iframeDoc =
        renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
      const imgMaxWidth = renderer.scrollWidth ? renderer.scrollWidth / 3.5 : 0;
      const style = iframeDoc.querySelector("style");

      const customFont =
        fontFamily === "sans"
          ? ""
          : `@font-face {
            font-family: '${fontFamily}';
            font-style: normal;
            src: url(${fontUrl}) format('${fontFormat}');
          }`;

      const themeStyle =
        theme === "dark"
          ? `
          color: #FFF !important;
          background-color: #171717 !important;
        `
          : "";

      const styleContent =
        customFont +
        `
          body {
            word-wrap: break-word;
            font-size: ${fontSize}px !important;
            line-height: 2;
            overflow: hidden;
            min-height: 80vh;
          }
  
          * {
              font-family: '${fontFamily}' !important;
              ${themeStyle}
          }
    
          a {
            text-decoration: none;
          }
    
          img {
            max-width: ${imgMaxWidth}px;
            height: auto;
          }
        `;

      if (style) {
        style.innerHTML = styleContent;
      } else {
        const newStyle = iframeDoc.createElement("style");
        newStyle.innerHTML = styleContent;
        iframeDoc.head.appendChild(newStyle);
      }
    };
  }, [bookInfo, currentChapter, currentFontConfig, theme]);

  const handleIframeLoad = (renderer: HTMLIFrameElement) => {
    renderer.style.visibility = "hidden";
    const handleLoad = () => {
      const iframeDoc = renderer.contentDocument || renderer.contentWindow?.document;

      if (!iframeDoc || !renderer.contentWindow) {
        throw new Error("Iframe document not found");
      }

      renderer.style.height = `0px`;

      if (iframeDoc.body) {
        renderer.style.visibility = "visible";
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        console.log(html.clientHeight, html.scrollHeight, html.offsetHeight);
        renderer.style.height = `${height}px`;
        renderer.removeEventListener("load", handleLoad);
      }
    };

    renderer.addEventListener("load", handleLoad);
  };

  const handlePrevChapter = () => {
    setCurrentChapter(currentChapter - 1);
  };

  const handleNextChapter = () => {
    setCurrentChapter(currentChapter + 1);
  };

  return (
    <>
      <div className="w-full h-screen bg-gray-100 flex justify-center fixed z-0 dark:bg-neutral-800"></div>
      <div className="w-1/2 h-14 bg-white border-b-2 flex fixed items-center pl-4 z-20 inset-x-0 m-auto dark:bg-neutral-900">
        <div className="flex w-full justify-between items-center pr-4">
          <div>
            <p>{bookInfo.title}</p>
          </div>
          <div>
            <LocaleSwitcher />
            <Button
              className="ml-4 bg-white dark:bg-neutral-900"
              isIconOnly
              variant="bordered"
              radius="sm"
              onClick={() => window.open("https://github.com/jhao0413/react-epub-parser", "_blank")}
            >
              <Github size={16} className="dark:bg-neutral-900" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-1/2 h-full min-h-[100vh] mx-auto bg-white relative pt-14 flex flex-col dark:bg-neutral-900">
        <iframe
          id="epub-renderer"
          className="w-full z-10 px-14 overflow-hidden grow dark:bg-neutral-900"
        ></iframe>
        <div className="w-full z-10 h-20 flex justify-around items-start">
          <Button
            variant="bordered"
            className="text-base rounded-md w-40 dark:bg-neutral-900"
            onClick={handlePrevChapter}
          >
            上一章
          </Button>
          <Button
            variant="bordered"
            className="text-base rounded-md w-40 dark:bg-neutral-900"
            onClick={handleNextChapter}
          >
            下一章
          </Button>
        </div>

        <div className="fixed right-[20%] bottom-12 z-50">
          <Toolbar />
        </div>
      </div>
    </>
  );
};

export default EpubReader;
