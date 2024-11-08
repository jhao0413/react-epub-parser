"use client";

import React, { useRef, useState } from "react";
import EpubReader from "@/components/test-epub-reader";
import epubStructureParser from "@/components/epub-structure-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./page.css";

interface FileInfo {
  name: string;
  size: number;
  blob: Blob | null;
}

interface BookBasicInfo {
  title: string | null;
  creator: string | null;
  publisher: string | null;
  identifier: string | null;
  date: string | null;
  coverPath: string | null;
  coverElement: HTMLImageElement | null;
  coverBlob: Blob;
  toc: { text: string | null; path: string; file: string }[];
}

function App() {
  const inputRef = useRef(null);
  const [bookBasicInfo, setBookBasicInfo] = useState<BookBasicInfo>();
  const [fileInfo, setFileInfo] = useState<FileInfo>({ name: "", size: 0 });

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    console.log(file);
    if (file) {
      const fileSizeInBytes = file.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      setFileInfo({
        name: file.name,
        size: fileSizeInMB,
        blob: getFileBinary(file),
      });

      const bookParserInfo = await epubStructureParser(file);
      setBookBasicInfo({
        title: bookParserInfo.title,
        creator: bookParserInfo?.creator,
        publisher: bookParserInfo?.publisher,
        identifier: bookParserInfo?.identifier,
        date: bookParserInfo?.date,
        coverPath: bookParserInfo?.coverPath,
        toc: bookParserInfo?.toc,
        coverElement: bookParserInfo?.coverElement,
        coverBlob: bookParserInfo?.coverBlob,
      });
      console.log(bookParserInfo);
    }
  };

  function getFileBinary(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const arrayBuffer = reader.result;
        resolve(arrayBuffer);
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  return (
    <div className="app">
      <div className="uploadEpub">
        <Input
          id="picture"
          type="file"
          accept=".epub"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button type="button" onClick={handleButtonClick}>
          Select EPUB
        </Button>
        <span style={{ marginLeft: "10px" }}>
          {fileInfo.name} {fileInfo.name ? fileInfo.size + "MB" : null}
        </span>
      </div>

      <div style={{ height: "100%" }}>
        {bookBasicInfo?.toc ? (
          <EpubReader blob={fileInfo.blob} toc={bookBasicInfo?.toc} />
        ) : null}
      </div>
    </div>
  );
}

export default App;
