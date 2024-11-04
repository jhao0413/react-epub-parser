"use client";

import React, { useState, useEffect } from "react";
import JSZip from "jszip";

const EpubReader = ({ url }) => {
  const [content, setContent] = useState("");
  const [styles, setStyles] = useState("");
  const [images, setImages] = useState({});

  useEffect(() => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => JSZip.loadAsync(blob))
      .then((zip) => {
        const opfFile = zip.file("OEBPS/content.opf");
        if (opfFile) {
          return opfFile
            .async("string")
            .then((opfContent) => ({ opfContent, zip }));
        } else {
          throw new Error("content.opf not found");
        }
      })
      .then(({ opfContent, zip }) => {
        const parser = new DOMParser();
        const opfDoc = parser.parseFromString(opfContent, "application/xml");

        const spine = opfDoc.querySelector("spine");
        const itemRefs = spine.querySelectorAll("itemref");
        const manifest = opfDoc.querySelector("manifest");
        const items = manifest.querySelectorAll("item");

        const contentPromises = [];
        const stylePromises = [];
        const imagePromises = [];

        // 只加载第一个 itemref 对应的内容
        if (itemRefs.length > 2) {
          const id = itemRefs[0].getAttribute("idref");
          const item = Array.from(items).find(
            (i) => i.getAttribute("id") === id
          );
          if (item) {
            const href = item.getAttribute("href");
            const file = zip.file(`OEBPS/${href}`);
            if (file) {
              contentPromises.push(file.async("string"));
            }
          }
        }

        items.forEach((item) => {
          const href = item.getAttribute("href");
          const mediaType = item.getAttribute("media-type");
          if (mediaType === "text/css") {
            const file = zip.file(`OEBPS/${href}`);
            if (file) {
              stylePromises.push(file.async("string"));
            }
          }

          if (mediaType.startsWith("image/")) {
            const file = zip.file(`OEBPS/${href}`);
            if (file) {
              imagePromises.push(
                file.async("base64").then((base64) => {
                  return { href, base64: `data:${mediaType};base64,${base64}` };
                })
              );
            }
          }
        });

        return Promise.all([
          Promise.all(contentPromises),
          Promise.all(stylePromises),
          Promise.all(imagePromises),
        ]);
      })
      .then(([contentArray, styleArray, imageArray]) => {
        const content = contentArray.join("");
        const styles = styleArray.join("");
        const images = imageArray.reduce((acc, { href, base64 }) => {
          acc[href] = base64;
          return acc;
        }, {});
        setContent(content);
        setStyles(styles);
        setImages(images);
      })
      .catch((error) => {
        console.error("Error loading EPUB file:", error);
      });
  }, [url]);

  const replaceImagePaths = (htmlContent) => {
    return htmlContent
      .replace(/src="([^"]+)"/g, (match, p1) => {
        const imagePath = p1.replace(/\.\.\//g, "");
        return `src="${images[imagePath] || p1}"`;
      })
      .replace(/xlink:href="([^"]+)"/g, (match, p1) => {
        const imagePath = p1.replace(/\.\.\//g, "");
        return `xlink:href="${images[imagePath] || p1}"`;
      });
  };

  return (
    <div>
      <style>{styles}</style>
      <div
        dangerouslySetInnerHTML={{ __html: replaceImagePaths(content) }}
      ></div>
    </div>
  );
};

export default EpubReader;
