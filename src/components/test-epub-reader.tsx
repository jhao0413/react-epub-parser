"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

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
      .then(({ chapter }) => {
        const parser = new DOMParser();
        const chapterDoc = parser.parseFromString(chapter, "application/xml");
        const body = chapterDoc.querySelector("body");

        if (body) {
          const safeHtmlString = DOMPurify.sanitize(body.innerHTML);

          const renderer = document.getElementById(
            "epub-renderer"
          ) as HTMLIFrameElement;
          if (!renderer || !renderer.contentWindow) {
            throw new Error("Renderer not found");
          }
          const iframeDoc =
            renderer.contentDocument || renderer.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(safeHtmlString);
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

          console.log(pageCount);
        } else {
          throw new Error("Body element not found in chapter document");
        }
      });
  }, [blob, toc, currentChapter, pageCount]);

  const handleNextPage = () => {
    console.log(currentPageIndex, pageCount);
    if (currentPageIndex < pageCount) {
      setCurrentPageIndex((currentPageIndex) => currentPageIndex + 1);
      const renderer = document.getElementById(
        "epub-renderer"
      ) as HTMLIFrameElement;
      if (renderer && renderer.contentWindow) {
        renderer.contentWindow.scrollTo({
          left: currentPageIndex * renderer.scrollWidth,
        });
      } else {
        console.error("Renderer not found");
      }
    } else {
      setCurrentChapter((currentChapter) => currentChapter + 1);
      setCurrentPageIndex(1);
    }
  };

  const handlePrevPage = () => {
    setCurrentChapter((currentChapter) => currentChapter - 1);
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
          Previous
        </Button>
        <Button variant="outline" onClick={handleNextPage}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default EpubReader;
