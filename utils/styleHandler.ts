export const applyFontAndThemeStyles = (
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
  const { fontSize, fontFamily, fontUrl, fontFormat } = currentFontConfig;

  const renderer = document.getElementById("epub-renderer") as HTMLIFrameElement;
  if (!renderer || !renderer.contentWindow) {
    throw new Error("Renderer not found");
  }
  const iframeDoc =
    renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);

  const imgMaxWidth = renderer.scrollWidth ? renderer.scrollWidth / 3.5 : 0;
  const style = iframeDoc.querySelector("style");

  const customFont =
    fontFamily === "sans"
      ? ""
      : `@font-face {
            font-family: '${fontFamily}';
            font-style: normal;
            src: url(${fontUrl}) format('${fontFormat}');
          }`;

  const themeStyle =
    theme === "dark"
      ? `
          color: #FFF !important;
          background-color: #171717 !important;
        `
      : "";

  const bodyStyle =
    mode === "double"
      ? `body {
          columns: 2;
          column-fill: auto;
          word-wrap: break-word;
          overflow: hidden;
          column-gap: ${COLUMN_GAP}px;
          font-size: ${fontSize}px !important;
          line-height: 1.5;
        }`
      : `body {
            word-wrap: break-word;
            font-size: ${fontSize}px !important;
            line-height: 2;
            overflow: hidden;
            min-height: 80vh;
            max-height: max-content;
          }`;

  const styleContent =
    customFont +
    `
        ${bodyStyle}
  
        * {
            font-family: '${fontFamily}' !important;
            ${themeStyle}
        }
  
        a {
          text-decoration: none;
        }
  
        img {
          max-width: ${imgMaxWidth}px;
          height: auto;
        }
      `;

  if (style) {
    style.innerHTML = styleContent;
  } else {
    const newStyle = iframeDoc.createElement("style");
    newStyle.innerHTML = styleContent;
    iframeDoc.head.appendChild(newStyle);
  }
};
