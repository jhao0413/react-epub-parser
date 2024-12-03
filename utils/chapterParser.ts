import { resolvePath } from "@/utils/utils";
import JSZip from "jszip";

export const parseAndProcessChapter = async (
  chapterContent: string,
  zip: JSZip,
  basePath: string
) => {
  const parser = new DOMParser();
  const chapterDoc = parser.parseFromString(chapterContent, "application/xml");

  if (!chapterDoc) {
    throw new Error("Failed to parse chapter content");
  }

  const xmlDoc = parser.parseFromString(chapterDoc.documentElement.outerHTML, "application/xml");

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
