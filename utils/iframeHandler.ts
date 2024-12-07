import { applyFontAndThemeStyles } from "@/utils/styleHandler";

export const writeToIframe = (
  updatedChapter: string,
  currentFontConfig: {
    fontSize: number;
    fontFamily: string;
    fontUrl: string;
    fontFormat: string;
  },
  theme: string = "light",
  mode: string = "double",
  COLUMN_GAP: number
) => {
  const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
  if (!renderer || !renderer.contentWindow) {
    throw new Error("Renderer not found");
  }
  const iframeDoc =
    renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
  iframeDoc.open();
  iframeDoc.write(updatedChapter);
  iframeDoc.close();

  applyFontAndThemeStyles(currentFontConfig, theme, mode, COLUMN_GAP);
  return renderer;
};

export const waitForImagesAndCalculatePages = (
  renderer: HTMLIFrameElement,
  iframeDoc: Document
) => {
  const iframeImages = iframeDoc.images;
  const imagesLoaded = Array.from(iframeImages).map((img) => {
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
  });
};

export const handleIframeLoad = (
  renderer: HTMLIFrameElement,
  pageWidthRef: React.MutableRefObject<number>,
  pageCountRef: React.MutableRefObject<number>,
  goToLastPageRef: React.MutableRefObject<boolean>,
  setCurrentPageIndex: React.Dispatch<React.SetStateAction<number>>,
  COLUMN_GAP: number
) => {
  renderer.style.visibility = "hidden";
  const handleLoad = () => {
    const iframeDoc = renderer.contentDocument || renderer.contentWindow?.document;

    if (!iframeDoc || !renderer.contentWindow) {
      throw new Error("Iframe document not found");
    }

    if (iframeDoc.body) {
      const body = renderer.contentWindow.document.body;
      const computedStyle = renderer.contentWindow.getComputedStyle(body);
      const marginLeft = parseFloat(computedStyle.marginLeft);
      const marginRight = parseFloat(computedStyle.marginRight);
      const newPageWidth = body.clientWidth - marginLeft - marginRight + COLUMN_GAP;

      if (newPageWidth !== pageWidthRef.current) {
        pageWidthRef.current = newPageWidth;
      }

      let scrollWidth = iframeDoc.body.scrollWidth;
      const ratio = scrollWidth / pageWidthRef.current;
      const fraction = ratio - Math.floor(ratio);

      // add an empty div to the end of the content if the last page is less than half full
      if (fraction <= 0.5) {
        const emptyDiv = renderer.contentWindow.document.createElement("div");
        emptyDiv.style.height = "100%";
        body.appendChild(emptyDiv);
      }

      pageCountRef.current = Math.ceil(scrollWidth / pageWidthRef.current);

      if (goToLastPageRef.current) {
        renderer.contentWindow.scrollTo({
          left: (pageCountRef.current - 1) * pageWidthRef.current,
        });
        goToLastPageRef.current = false;
        setCurrentPageIndex(Math.ceil(scrollWidth / pageWidthRef.current));
      } else {
        renderer.contentWindow.scrollTo({
          left: 0,
        });
      }
      renderer.style.visibility = "visible";

      renderer.removeEventListener("load", handleLoad);
    }
  };

  renderer.addEventListener("load", handleLoad);
};
