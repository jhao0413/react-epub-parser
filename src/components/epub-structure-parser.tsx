import JSZip from "jszip";

interface BookBasicInfo {
  title: string | null;
  creator: string | null;
  publisher: string | null;
  identifier: string | null;
  date: string | null;
  coverPath: string | null;
  coverBlob: Blob | null;
  toc: { text: string | null; path: string; file: string }[];
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
        const containerContent = await zip
          .file("META-INF/container.xml")
          ?.async("string");
        const fullPath = parseContentOpfPath(containerContent as string);
        const basePath = fullPath?.split("content.opf")[0];

        if (!containerContent) {
          throw new Error("Missing container.xml in EPUB structure.");
        }

        if (!fullPath) {
          throw new Error("Failed to find content.opf path in container.xml.");
        }

        // Read content.opf to get basic book info
        const content = await zip.file(fullPath)?.async("string");
        const [bookBasicInfo, tocPath] = epubBasicInfoParser(content as string);

        // Read cover image and toc
        const coverFile = zip.file(`${basePath}${bookBasicInfo.coverPath}`);
        const [coverBlob, tocContent] = await Promise.all([
          coverFile?.async("blob") || null,
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

  const getTitle = () => {
    const titleElement = xmlDoc.querySelector("metadata > title");
    return titleElement ? titleElement.textContent : null;
  };

  const getCreator = () => {
    const creatorElement = xmlDoc.querySelector("metadata > creator");
    return creatorElement ? creatorElement.textContent : null;
  };

  const getPublisher = () => {
    const publisherElement = xmlDoc.querySelector("metadata > publisher");
    return publisherElement ? publisherElement.textContent : null;
  };

  const getIdentifier = () => {
    const identifierElement = xmlDoc.querySelector("metadata > identifier");
    return identifierElement ? identifierElement.textContent : null;
  };

  const getDate = () => {
    const dateElement = xmlDoc.querySelector("metadata > date");
    return dateElement ? dateElement.textContent : null;
  };

  const getCoverPath = () => {
    const coverMeta = xmlDoc.querySelector("metadata > meta[name='cover']");
    const coverId = coverMeta ? coverMeta.getAttribute("content") : null;
    if (coverId) {
      const coverItem = xmlDoc.querySelector(
        `manifest > item[id='${coverId}']`
      );
      return coverItem ? coverItem.getAttribute("href") : null;
    }

    return null;
  };

  const getTocPath = () => {
    return xmlDoc
      .querySelector("manifest > item[id='ncx']")
      ?.getAttribute("href") as string;
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
  const toc: { text: string | null; path: string; file: string }[] = [];
  const parser = new DOMParser();
  const tocDoc = parser.parseFromString(tocContent, XML_MIME_TYPE);
  console.log(tocDoc);
  const navPoints = tocDoc.querySelectorAll("navPoint");
  navPoints.forEach((navPoint) => {
    const text = navPoint.querySelector("navLabel > text")?.textContent || null;
    const content =
      navPoint.querySelector("content")?.getAttribute("src") || null;
    const contentPath = content ? `${basePath}${content}` : "";
    const parts = contentPath.split("/");
    const file = parts.pop() || "";
    const path = parts.join("/");
    toc.push({ text, path, file });
  });
  return toc;
};

export default epubStructureParser;
