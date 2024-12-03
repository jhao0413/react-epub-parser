import JSZip from "jszip";

export const useLoadChapterContent = async (
  zip: JSZip,
  toc: { text: string; path: string; file: string }[],
  currentChapter: number
): Promise<{ chapterContent: string; zip: JSZip; basePath: string }> => {
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
