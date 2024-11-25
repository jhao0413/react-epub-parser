import JSZip from "jszip";

interface BookBasicInfo {
  title: string;
  creator: string;
  publisher: string;
  identifier: string;
  date: string;
  coverPath: string;
  coverBlob: Blob | null;
  toc: { text: string; path: string; file: string }[];
}

const XML_MIME_TYPE = "application/xml";

const epubStructureParser = async (file: File): Promise<BookBasicInfo> => {
  const reader = new FileReader();

  return new Promise<BookBasicInfo>((resolve, reject) => {
    reader.onload = async function (e) {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Read container.xml to get the path of content.opf
        const containerContent = await zip.file("META-INF/container.xml")?.async("string");
        const fullPath = parseContentOpfPath(containerContent as string);

        if (!fullPath) {
          throw new Error("Failed to find content.opf path in container.xml.");
        }

        let basePath = "";
        if (fullPath?.includes("content")) {
          basePath = fullPath.split("content.opf")[0];
        } else {
          basePath = fullPath.split("/")[0] + "/";
        }

        if (!containerContent) {
          throw new Error("Missing container.xml in EPUB structure.");
        }

        if (!fullPath) {
          throw new Error("Failed to find content.opf path in container.xml.");
        }

        // Read content.opf to get basic book info
        const content = await zip.file(fullPath)?.async("string");
        const [bookBasicInfo, tocPath] = epubBasicInfoParser(content as string);

        console.log(`${basePath}--------${bookBasicInfo.coverPath}`);
        // Read cover image and toc
        const coverFile = zip.file(`${basePath}${bookBasicInfo.coverPath}`);

        if (!coverFile) {
          throw new Error("Failed to find cover image in EPUB structure.");
        }

        const [coverBlob, tocContent] = await Promise.all([
          coverFile.async("blob"),
          zip.file(`${basePath}${tocPath}` as string)?.async("string"),
        ]);

        bookBasicInfo.coverBlob = coverBlob;
        bookBasicInfo.toc = parseToc(tocContent as string, basePath as string);
        resolve(bookBasicInfo);
      } catch (error) {
        console.error("Error reading EPUB file:", error);
        reject(error);
      }
    };

    reader.readAsArrayBuffer(file);
  });
};

const parseContentOpfPath = (xmlString: string): string | null => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, XML_MIME_TYPE);

    const rootfileElement = xmlDoc.querySelector("rootfile");
    if (rootfileElement) {
      const fullPath = rootfileElement.getAttribute("full-path");
      return fullPath;
    }
  } catch (error) {
    console.error("Error parsing XML:", error);
  }
  return null;
};

const epubBasicInfoParser = (content: string): [BookBasicInfo, string] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, XML_MIME_TYPE);

  if (!xmlDoc) {
    throw new Error("Failed to parse content.opf XML.");
  }

  const getTitle = () => {
    const titleElement = xmlDoc.querySelector("metadata > title");
    return titleElement?.textContent || "";
  };

  const getCreator = () => {
    const creatorElement = xmlDoc.querySelector("metadata > creator");
    return creatorElement?.textContent || "";
  };

  const getPublisher = () => {
    const publisherElement = xmlDoc.querySelector("metadata > publisher");
    return publisherElement?.textContent || "";
  };

  const getIdentifier = () => {
    const identifierElement = xmlDoc.querySelector("metadata > identifier");
    return identifierElement?.textContent || "";
  };

  const getDate = () => {
    const dateElement = xmlDoc.querySelector("metadata > date");
    return dateElement?.textContent || "";
  };

  const getCoverPath = (): string => {
    const coverMeta: Element | null = xmlDoc.querySelector("metadata > meta[name='cover']");
    const coverId: string = coverMeta ? coverMeta.getAttribute("content") || "" : "";
    if (coverId) {
      const coverItem: Element | null = xmlDoc.querySelector(`manifest > item[id='${coverId}']`);
      return coverItem ? coverItem.getAttribute("href") || "" : "";
    }

    return "";
  };

  const getTocPath = () => {
    return xmlDoc.querySelector("manifest > item[id='ncx']")?.getAttribute("href") as string;
  };

  return [
    {
      title: getTitle(),
      creator: getCreator(),
      publisher: getPublisher(),
      identifier: getIdentifier(),
      date: getDate(),
      coverPath: getCoverPath(),
      coverBlob: null,
      toc: [],
    },
    getTocPath(),
  ];
};

const parseToc = (tocContent: string, basePath: string) => {
  const toc: { text: string; path: string; file: string }[] = [];
  const parser = new DOMParser();
  const tocDoc = parser.parseFromString(tocContent, XML_MIME_TYPE);
  const navPoints = tocDoc.querySelectorAll("navPoint");
  navPoints.forEach((navPoint) => {
    const text = navPoint.querySelector("navLabel > text")?.textContent || "";
    const [content] = navPoint.querySelector("content")?.getAttribute("src")?.split("#") || "";
    const contentPath = content ? `${basePath}${content}` : "";
    const parts = contentPath.split("/");
    const file = parts.pop() || "";
    const path = parts.join("/");
    toc.push({ text, path, file });
  });
  return toc;
};

export default epubStructureParser;
