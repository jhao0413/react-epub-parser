import JSZip from "jszip";
import { BookBasicInfoType } from "@/store/bookInfoStore";

export const loadChapterContent = async (
  zip: JSZip,
  bookInfo: BookBasicInfoType,
  currentChapter: number
) => {
  const contentOpfPath = `${
    bookInfo.toc[currentChapter].path ? bookInfo.toc[currentChapter].path + "/" : ""
  }${decodeURIComponent(bookInfo.toc[currentChapter].file)}`;
  const chapterFile = zip.file(contentOpfPath);
  if (chapterFile) {
    const chapterContent = await chapterFile.async("string");
    return {
      chapterContent,
      basePath: bookInfo.toc[currentChapter].path,
    };
  } else {
    throw new Error("Content file not found");
  }
};
