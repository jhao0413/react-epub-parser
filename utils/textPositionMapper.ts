export interface TextPosition {
  text: string;
  pageIndex: number;
  offsetTop: number;
  offsetLeft: number;
  elementId?: string;
}

export class TextPositionMapper {
  private positions: TextPosition[] = [];
  private pageWidth: number = 0;
  private columnGap: number = 0;

  constructor(pageWidth: number, columnGap: number = 0) {
    this.pageWidth = pageWidth;
    this.columnGap = columnGap;
  }

  analyzeTextPositions(iframeDoc: Document): TextPosition[] {
    this.positions = [];
    const walker = document.createTreeWalker(
      iframeDoc.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      if (textNode.textContent?.trim()) {
        this.processTextNode(textNode as Text, iframeDoc);
      }
    }

    return this.positions;
  }

  private processTextNode(textNode: Text, iframeDoc: Document) {
    const range = iframeDoc.createRange();
    const text = textNode.textContent || '';
    
    const tempSpan = iframeDoc.createElement('span');
    tempSpan.textContent = text;
    textNode.parentNode?.insertBefore(tempSpan, textNode);
    
    const rect = tempSpan.getBoundingClientRect();
    const pageIndex = this.calculatePageIndex(rect.left);
    
    this.positions.push({
      text: text.trim(),
      pageIndex,
      offsetTop: rect.top,
      offsetLeft: rect.left,
    });

    textNode.parentNode?.removeChild(tempSpan);
  }

  private calculatePageIndex(offsetLeft: number): number {
    return Math.floor(offsetLeft / (this.pageWidth + this.columnGap));
  }

  findTextPosition(searchText: string): TextPosition | null {
    return this.positions.find(pos => 
      pos.text.includes(searchText.trim())
    ) || null;
  }

  getTextsByPage(pageIndex: number): TextPosition[] {
    return this.positions.filter(pos => pos.pageIndex === pageIndex);
  }
}