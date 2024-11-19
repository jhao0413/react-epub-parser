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
          const imgMaxWidth = renderer.scrollWidth
            ? renderer.scrollWidth / 3.5
            : 0;
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

          // wait for the images to load
          const ifarmeImages = iframeDoc.images;
          const imagesLoaded = Array.from(ifarmeImages).map((img) => {
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

            setPageCount(
              Math.ceil(
                scrollWidth / (pageWidthRef.current || renderer.scrollWidth)
              )
            );

            if (goToLastPage) {
              setCurrentPageIndex(
                Math.ceil(
                  scrollWidth / (pageWidthRef.current || renderer.scrollWidth)
                )
              );
              renderer.contentWindow.scrollTo({
                left: (pageCount - 1) * renderer.scrollWidth,
              });
              setGoToLastPage(false);
            }
          });

          if (renderer) {
            const handleLoad = () => {
              const iframeDoc =
                renderer.contentDocument || renderer.contentWindow?.document;

              if (!iframeDoc || !renderer.contentWindow) {
                throw new Error("Iframe document not found");
              }

              if (iframeDoc && iframeDoc.body) {
                const body = renderer.contentWindow.document.body;
                const computedStyle =
                  renderer.contentWindow.getComputedStyle(body);
                const marginLeft = parseFloat(computedStyle.marginLeft);
                const marginRight = parseFloat(computedStyle.marginRight);
                const newPageWidth =
                  body.clientWidth - marginLeft - marginRight + COLUMN_GAP;

                if (newPageWidth !== pageWidthRef.current) {
                  pageWidthRef.current = newPageWidth;
                }
              }
            };

            renderer.addEventListener("load", handleLoad);

            return () => {
              renderer.removeEventListener("load", handleLoad);
            };
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
      const expectedScrollLeft = currentPageIndex * pageWidthRef.current;
      renderer.contentWindow.scrollTo({
        left: expectedScrollLeft,
      });
      const newPageIndex = currentPageIndex + 1;
      setCurrentPageIndex(newPageIndex);
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
      const renderer = document.getElementById(
        "epub-renderer"
      ) as HTMLIFrameElement;
      if (renderer?.contentWindow) {
        renderer.contentWindow.scrollTo({
          left: (currentPageIndex - 2) * pageWidthRef.current,
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
