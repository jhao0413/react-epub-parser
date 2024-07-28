"use client";

import React, { useLayoutEffect, useState, RefObject, useRef } from 'react';

interface ContentRendererProps {
  content: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
  const [renderedContent, setRenderedContent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    console.log(container);
    
    if (container) {
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.width = '700px';
      document.body.appendChild(tempContainer);

      const maxHeight = container.clientHeight;
      let currentHeight = 0;
      let currentIndex = 0;
      const contentArray = content.split(' ');

      const newRenderedContent: string[] = [];
      let currentContent = '';

      while (currentIndex < contentArray.length) {
        currentContent += contentArray[currentIndex] + ' ';
        tempContainer.innerHTML = currentContent;
        currentHeight = tempContainer.scrollHeight;

        if (currentHeight > maxHeight) {
          newRenderedContent.push(currentContent.trim());
          currentContent = '';
        }

        currentIndex++;
      }

      if (currentContent) {
        newRenderedContent.push(currentContent.trim());
      }

      document.body.removeChild(tempContainer);
      setRenderedContent(newRenderedContent);
    }
  }, [content, containerRef]);

  return (
    <div className='view' ref={containerRef}>
      {renderedContent.map((part, index) => (
        <div key={index} style={{ width: '650px' }} dangerouslySetInnerHTML={{ __html: part }}>
        </div>
      ))}
    </div>
  );
};

export default ContentRenderer;