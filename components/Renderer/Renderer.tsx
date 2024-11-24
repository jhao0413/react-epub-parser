"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolvePath } from "@/lib/utils";
import Menu from "@/components/Renderer/Menu";

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

interface EpubReaderProps {
  blob: Blob | null;
  bookBasicInfo: BookBasicInfo;
}

const COLUMN_GAP = 20;

const EpubReader: React.FC<EpubReaderProps> = ({ blob, bookBasicInfo }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const goToLastPageRef = useRef(false);
  const pageWidthRef = useRef(0);
  const pageCountRef = useRef(0);

  useEffect(() => {
    if (!blob || !bookBasicInfo.toc) {
      return;
    }

    JSZip.loadAsync(blob)
      .then(async (zip) => {
        const { chapterContent, zip: loadedZip, basePath } = await loadChapterContent(zip);
        const updatedChapter = await parseAndProcessChapter(chapterContent, loadedZip, basePath);
        const renderer = writeToIframe(updatedChapter);
        const iframeDoc =
          renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
        if (iframeDoc) {
          waitForImagesAndCalculatePages(renderer, iframeDoc);
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
        bookBasicInfo.toc[currentChapter].path ? bookBasicInfo.toc[currentChapter].path + "/" : ""
      }${decodeURIComponent(bookBasicInfo.toc[currentChapter].file)}`;
      const chapterFile = zip.file(contentOpfPath);
      if (chapterFile) {
        const chapterContent = await chapterFile.async("string");
        return {
          chapterContent,
          zip,
          basePath: bookBasicInfo.toc[currentChapter].path,
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

      const style = iframeDoc.createElement("style");
      const imgMaxWidth = renderer.scrollWidth ? renderer.scrollWidth / 3.5 : 0;
      style.innerHTML = `
        body {
          columns: 2;
          column-fill: auto;
          word-wrap: break-word;
          overflow: hidden;
          column-gap: 20px;
        }
  
        a {
          text-decoration: none;
        }
  
        img {
          max-width: ${imgMaxWidth}px;
          height: auto;
        }
      `;
      iframeDoc.head.appendChild(style);
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

    const handleIframeLoad = (renderer: HTMLIFrameElement) => {
      renderer.style.visibility = "hidden";
      const handleLoad = () => {
        const iframeDoc = renderer.contentDocument || renderer.contentWindow?.document;

        if (!iframeDoc || !renderer.contentWindow) {
          throw new Error("Iframe document not found");
        }

        if (iframeDoc.body) {
          const body = renderer.contentWindow.document.body;
          const computedStyle = renderer.contentWindow.getComputedStyle(body);
          const marginLeft = parseFloat(computedStyle.marginLeft);
          const marginRight = parseFloat(computedStyle.marginRight);
          const newPageWidth = body.clientWidth - marginLeft - marginRight + COLUMN_GAP;

          if (newPageWidth !== pageWidthRef.current) {
            pageWidthRef.current = newPageWidth;
          }

          let scrollWidth = iframeDoc.body.scrollWidth;
          const ratio = scrollWidth / pageWidthRef.current;
          const fraction = ratio - Math.floor(ratio);

          // add an empty div to the end of the content if the last page is less than half full
          if (fraction <= 0.5) {
            const emptyDiv = renderer.contentWindow.document.createElement("div");
            emptyDiv.style.height = "100%";
            body.appendChild(emptyDiv);
          }

          pageCountRef.current = Math.ceil(scrollWidth / pageWidthRef.current);

          if (goToLastPageRef.current) {
            renderer.contentWindow.scrollTo({
              left: (pageCountRef.current - 1) * pageWidthRef.current,
            });
            goToLastPageRef.current = false;
            setCurrentPageIndex(Math.ceil(scrollWidth / pageWidthRef.current));
          } else {
            renderer.contentWindow.scrollTo({
              left: 0,
            });
          }
          renderer.style.visibility = "visible";

          renderer.removeEventListener("load", handleLoad);
        }
      };

      renderer.addEventListener("load", handleLoad);
    };
  }, [blob, bookBasicInfo.toc, currentChapter]);

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
    } else if (currentChapter < bookBasicInfo.toc.length - 1) {
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
    <div style={{ height: "100%", position: "relative" }}>
      <iframe id="epub-renderer" style={{ width: "100%", height: "100%" }}></iframe>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button variant="outline" onClick={handlePrevPage}>
          <ChevronLeft />
          Previous
        </Button>
        <Button variant="outline" onClick={handleNextPage}>
          Next
          <ChevronRight />
        </Button>
      </div>
      <div style={{ position: "absolute", right: "-120px", bottom: "0px" }}>
        <Menu
          bookBasicInfo={bookBasicInfo}
          currentChapter={currentChapter}
          setCurrentChapter={setCurrentChapter}
        />
      </div>
    </div>
  );
};

export default EpubReader;
