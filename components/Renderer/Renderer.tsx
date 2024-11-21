"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolvePath } from "@/lib/utils";

type TocItem = {
  text: string;
  path: string;
  file: string;
};

interface EpubReaderProps {
  toc: TocItem[];
  blob: Blob | null;
}

const COLUMN_GAP = 20;

const EpubReader: React.FC<EpubReaderProps> = ({ blob, toc }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [goToLastPage, setGoToLastPage] = useState(false);
  const pageWidthRef = useRef(0);

  useEffect(() => {
    if (!blob || !toc) {
      return;
    }

    const loadChapterContent = async (zip: JSZip) => {
      const contentOpfPath = `${
        toc[currentChapter].path ? toc[currentChapter].path + "/" : ""
      }${decodeURIComponent(toc[currentChapter].file)}`;
      const chapterFile = zip.file(contentOpfPath);
      if (chapterFile) {
        const chapterContent = await chapterFile.async("string");
        return {
          chapterContent,
          zip,
          basePath: toc[currentChapter].path,
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

        const scrollWidth = iframeDoc.body.scrollWidth;

        setPageCount(Math.ceil(scrollWidth / (pageWidthRef.current || renderer.scrollWidth)));

        if (goToLastPage) {
          setCurrentPageIndex(
            Math.ceil(scrollWidth / (pageWidthRef.current || renderer.scrollWidth))
          );
          renderer.contentWindow.scrollTo({
            left: pageCount * renderer.scrollWidth,
          });
          setGoToLastPage(false);
        }
      });
    };

    const handleIframeLoad = (renderer: HTMLIFrameElement) => {
      const handleLoad = () => {
        const iframeDoc = renderer.contentDocument || renderer.contentWindow?.document;

        if (!iframeDoc || !renderer.contentWindow) {
          throw new Error("Iframe document not found");
        }

        if (iframeDoc && iframeDoc.body) {
          const body = renderer.contentWindow.document.body;
          const computedStyle = renderer.contentWindow.getComputedStyle(body);
          const marginLeft = parseFloat(computedStyle.marginLeft);
          const marginRight = parseFloat(computedStyle.marginRight);
          const newPageWidth = body.clientWidth - marginLeft - marginRight + COLUMN_GAP;

          if (newPageWidth !== pageWidthRef.current) {
            pageWidthRef.current = newPageWidth;
          }
        }
      };

      renderer.addEventListener("load", handleLoad);

      return () => {
        renderer.removeEventListener("load", handleLoad);
      };
    };

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
  }, [blob, toc, currentChapter, pageCount, goToLastPage]);

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

    if (currentPageIndex < pageCount) {
      rendererWindow.scrollTo({
        left: currentPageIndex * pageWidthRef.current,
      });
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentChapter < toc.length - 1) {
      setCurrentChapter(currentChapter + 1);
      setCurrentPageIndex(1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex === 1 && currentChapter === 0) {
      return;
    }

    if (currentPageIndex === 1 && currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      setGoToLastPage(true);
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
    <div style={{ height: "100%" }}>
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
      <div>
        {currentPageIndex}/{pageCount}
      </div>
    </div>
  );
};

export default EpubReader;
