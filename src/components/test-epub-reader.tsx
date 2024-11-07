"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import path from "path";

type TocItem = {
  text: string;
  path: string;
  file: string;
};

interface EpubReaderProps {
  toc: TocItem[];
  blob: Blob;
}

const EpubReader: React.FC<EpubReaderProps> = ({ blob, toc }) => {
  const [content, setContent] = useState<string>();
  const [styles, setStyles] = useState("");

  useEffect(() => {
    JSZip.loadAsync(blob)
      .then((zip) => {
        const contentOpfPath = `${
          toc[0].path ? toc[0].path + "/" : ""
        }${decodeURIComponent(toc[0].file)}`;
        const chapter = zip.file(contentOpfPath);
        if (chapter) {
          return chapter
            .async("string")
            .then((chapter) => ({ chapter, zip, basePath: toc[0].path }));
        } else {
          throw new Error("content.opf not found");
        }
      })
      .then(({ chapter, zip, basePath }) => {
        const parser = new DOMParser();
        const chapterDoc = parser.parseFromString(chapter, "application/xml");
        const body = chapterDoc.querySelector("body");
        const cssLinks = chapterDoc.querySelectorAll("link[rel=stylesheet]");

        cssLinks.forEach((link) => {
          const href = link.getAttribute("href");
          const fullPath = path.normalize(path.join(basePath, href));
          const style = zip.file(fullPath);
          if (style) {
            style.async("string").then((style) => {
              setStyles((styles) => styles + style);
            });
          }
        });
        if (body) {
          setContent(body.innerHTML);
        } else {
          throw new Error("Body element not found in chapter document");
        }
      });
  }, [toc]);

  return (
    <div style={{ height: "100%" }}>
      <style>{styles}</style>
      <div
        style={{
          columns: 2,
          height: "100%",
          columnFill: "auto",
        }}
        dangerouslySetInnerHTML={{
          __html: content || "",
        }}
      ></div>
      <div></div>
    </div>
  );
};

export default EpubReader;
