"use client";

import React, { useState, useEffect } from "react";
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

const EpubReader: React.FC<EpubReaderProps> = ({ blob, toc }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [goToLastPage, setGoToLastPage] = useState(false);

  useEffect(() => {
    if (!blob || !toc) {
      return;
    }
    JSZip.loadAsync(blob)
      .then((zip) => {
        const contentOpfPath = `${
          toc[currentChapter].path ? toc[currentChapter].path + "/" : ""
        }${decodeURIComponent(toc[currentChapter].file)}`;
        const chapter = zip.file(contentOpfPath);
        if (chapter) {
          return chapter.async("string").then((chapter) => ({
            chapter,
            zip,
            basePath: toc[currentChapter].path,
          }));
        } else {
          throw new Error("content.opf not found");
        }
      })
      .then(async ({ chapter, zip, basePath }) => {
        console.log(basePath);
        const parser = new DOMParser();
        const chapterDoc = parser.parseFromString(chapter, "application/xml");

        if (chapterDoc) {
          const renderer = document.getElementById(
            "epub-renderer"
          ) as HTMLIFrameElement;
          if (!renderer || !renderer.contentWindow) {
            throw new Error("Renderer not found");
          }
          const iframeDoc =
            renderer.contentDocument || renderer.contentWindow.document;

          const xmlDoc = parser.parseFromString(
            chapterDoc.documentElement.outerHTML,
            "application/xml"
          );
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
          iframeDoc.open();
          iframeDoc.write(updatedChapter);
          iframeDoc.close();
          const style = iframeDoc.createElement("style");
          style.innerHTML = `
              body {
                columns: 2;
                column-fill: auto;
                word-wrap: break-word;
                overflow: hidden;
              }

              a {
                text-decoration: none;
              }
          `;
          iframeDoc.head.appendChild(style);

          const scrollWidth = iframeDoc.body.scrollWidth;
          const columnWidth = renderer?.scrollWidth;

          setPageCount(Math.ceil(scrollWidth / columnWidth));

          if (goToLastPage) {
            setCurrentPageIndex(Math.ceil(scrollWidth / columnWidth));
            renderer.contentWindow.scrollTo({
              left:
                (Math.ceil(scrollWidth / columnWidth) - 1) *
                renderer.scrollWidth,
            });
            setGoToLastPage(false);
          }
        } else {
          throw new Error("Body element not found in chapter document");
        }
      });
  }, [blob, toc, currentChapter, pageCount, goToLastPage]);

  const handleNextPage = () => {
    const renderer = document.getElementById(
      "epub-renderer"
    ) as HTMLIFrameElement;

    if (!renderer?.contentWindow) {
      console.error("Renderer not found");
      return;
    }

    if (currentPageIndex < pageCount) {
      const newPageIndex = currentPageIndex + 1;
      setCurrentPageIndex(newPageIndex);
      renderer.contentWindow.scrollTo({
        left: newPageIndex * renderer.scrollWidth,
      });
    } else {
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
      const renderer = document.getElementById(
        "epub-renderer"
      ) as HTMLIFrameElement;
      if (renderer?.contentWindow) {
        renderer.contentWindow.scrollTo({
          left: (currentPageIndex - 2) * renderer.scrollWidth,
        });
        setCurrentPageIndex(currentPageIndex - 1);
      } else {
        console.error("Renderer not found");
      }
    }
  };

  return (
    <div style={{ height: "100%" }}>
      <iframe
        id="epub-renderer"
        style={{ width: "100%", height: "100%" }}
      ></iframe>
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
    </div>
  );
};

export default EpubReader;
