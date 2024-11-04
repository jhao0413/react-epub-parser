"use client";

import React, { useRef, useState } from "react";
// import EpubReader from '@/components/test-epub-reader';
import epubStructureParser from "@/components/epub-structure-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./reader.css";

interface FileInfo {
  name: string;
  size: number;
}

interface BookBasicInfo {
  title: string | null;
  creator: string | null;
  publisher: string | null;
  identifier: string | null;
  date: string | null;
  coverPath: string | null;
  coverElement: HTMLImageElement | null;
  coverBlob: Blob | null;
  toc: { text: string | null; content: string | null }[];
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

  const Toc = ({
    bookBasicInfo,
  }: {
    bookBasicInfo: BookBasicInfo | undefined;
  }) => {
    if (!bookBasicInfo?.toc) {
      return null;
    }

    return (
      <div>
        <p style={{ fontSize: "24px", fontWeight: "bold" }}>目录</p>
        {bookBasicInfo.toc.map((item, index) => (
          <div style={{ width: "65%", paddingTop: "10px" }} key={index}>
            {item.text}
          </div>
        ))}
      </div>
    );
  };

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

      <div></div>

      {/* <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: "50%", padding: "0 50px" }}>
          <ul>
            <Toc bookBasicInfo={bookBasicInfo} />
          </ul>
        </div>
      </div> */}
    </div>
  );
}

export default App;
