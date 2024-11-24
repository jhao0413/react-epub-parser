"use client";

import { useRef, useState } from "react";
import EpubReader from "@/components/Renderer/Renderer";
import epubStructureParser from "@/lib/epub-structure-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./page.css";

interface FileInfo {
  name: string;
  size: number;
  blob: Blob | null;
}

interface BookBasicInfo {
  title: string;
  creator: string | null;
  publisher: string | null;
  identifier: string | null;
  date: string | null;
  coverPath: string | null;
  toc: { text: string; path: string; file: string }[];
}

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileState, setFileState] = useState<{
    fileInfo: FileInfo;
    bookBasicInfo: BookBasicInfo | null;
  }>({
    fileInfo: { name: "", size: 0, blob: null },
    bookBasicInfo: null,
  });

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      return;
    }
    const file = files[0];

    if (file) {
      const fileSizeInBytes = file.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

      const fileBlob = await getFileBinary(file);
      const bookParserInfo = await epubStructureParser(file);
      setFileState({
        fileInfo: {
          name: file.name,
          size: parseFloat(fileSizeInMB),
          blob: fileBlob as Blob,
        },
        bookBasicInfo: { ...bookParserInfo },
      });
    }
  };

  function getFileBinary(file: Blob) {
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
          {fileState.fileInfo.name}{" "}
          {fileState.fileInfo.name ? `${fileState.fileInfo.size}MB` : null}
        </span>
      </div>

      <div style={{ height: "100%" }}>
        {fileState.bookBasicInfo?.toc ? (
          <EpubReader blob={fileState.fileInfo.blob} bookBasicInfo={fileState.bookBasicInfo} />
        ) : null}
      </div>
    </div>
  );
}

export default App;
