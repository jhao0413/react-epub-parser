import { useState, useCallback } from 'react';
import { TextPosition } from '@/utils/textPositionMapper';
import { useFullBookSearchStore } from '@/store/fullBookSearchStore';

export const useTextNavigation = () => {
  const [textPositions, setTextPositions] = useState<TextPosition[]>([]);

  const updateTextPositions = useCallback((positions: TextPosition[]) => {
    setTextPositions(positions);
  }, []);
  // Search for text in the provided positions and navigate to the first match
  const searchAndNavigate = useCallback((searchText: string, positions?: TextPosition[]): number | null => {
    const positionsToSearch = positions || textPositions;
    console.log('Searching in positions:', positionsToSearch);
    const position = positionsToSearch.find(pos => 
      pos.text.toLowerCase().includes(searchText.toLowerCase())
    );
    
    if (position) {
      // return the page index of the found position
      return position.pageIndex + 1;
    }
    
    return null;
  }, [textPositions]);

  const highlightText = useCallback((iframeDoc: Document, searchText: string) => {
    if (!searchText.trim()) return;
    
    const existingHighlights = iframeDoc.querySelectorAll('.epub-highlight');
    existingHighlights.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.insertBefore(iframeDoc.createTextNode(el.textContent || ''), el);
        parent.removeChild(el);
      }
    });
    
    iframeDoc.normalize();

    const walker = iframeDoc.createTreeWalker(
      iframeDoc.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentNode as Element;
          if (parent?.classList?.contains('epub-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodesToProcess: Text[] = [];
    let textNode;
    while (textNode = walker.nextNode()) {
      const text = textNode.textContent || '';
      if (text.toLowerCase().includes(searchText.toLowerCase())) {
        textNodesToProcess.push(textNode as Text);
      }
    }

    textNodesToProcess.forEach(node => {
      const text = node.textContent || '';
      const regex = new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);
      
      if (parts.length > 1) {
        const parent = node.parentNode;
        if (parent) {
          parts.forEach((part) => {
            if (part) {
              if (regex.test(part)) {
                const highlight = iframeDoc.createElement('span');
                highlight.className = 'epub-highlight';
                highlight.style.cssText = 'background-color: #C6E1FB; color: #439DF1; padding: 1px 2px; border-radius: 2px;';
                highlight.textContent = part;
                parent.insertBefore(highlight, node);
              } else {
                parent.insertBefore(iframeDoc.createTextNode(part), node);
              }
            }
          });
          parent.removeChild(node);
        }
      }
    });
  }, []);  
  
  return {
    textPositions,
    updateTextPositions,
    searchAndNavigate,
    highlightText
  };
};