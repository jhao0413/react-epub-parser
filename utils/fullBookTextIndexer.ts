import JSZip from 'jszip';
import { BookBasicInfoType } from '@/store/bookInfoStore';

export interface BookTextIndex {
  chapterIndex: number;
  chapterTitle: string;
  text: string;
  searchableText: string;
}

export interface SearchResult {
  chapterIndex: number;
  chapterTitle: string;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
  position: number;
}

export class FullBookTextIndexer {
  private textIndex: BookTextIndex[] = [];
  private isIndexed: boolean = false;
  private currentBookId: string = '';

  constructor() {
    // full book text index
    this.textIndex = [];
    this.isIndexed = false;
    this.currentBookId = '';
  }
  // index the text content of the entire book
  async indexFullBook(
    zip: JSZip, 
    bookInfo: BookBasicInfoType
  ): Promise<void> {
    const bookId = `${bookInfo.title}_${bookInfo.toc.length}`;
    
    if (this.isIndexed && this.currentBookId === bookId) {
      console.log('Book already indexed, skipping...');
      return;
    }
    
    this.clearIndex();
    this.currentBookId = bookId;
    
    this.textIndex = [];
    const totalChapters = bookInfo.toc.length;
    console.log(totalChapters)

    for (let i = 0; i < totalChapters; i++) {
      try {
        const chapter = bookInfo.toc[i];
        const contentOpfPath = `${chapter.path ? chapter.path + "/" : ""}${decodeURIComponent(chapter.file)}`;
        const chapterFile = zip.file(contentOpfPath);

        if (chapterFile) {
          const chapterContent = await chapterFile.async("string");
          // html content
          const processedContent = await this.extractTextFromChapter(chapterContent);
          // plain text
          const searchableText = this.extractPlainText(processedContent);

          this.textIndex.push({
            chapterIndex: i,
            chapterTitle: chapter.text,
            text: processedContent,
            searchableText: searchableText
          });
        }
      } catch (error) {
        console.error(`Error processing chapter ${i}:`, error);
        // if there's an error, still add an empty entry for that chapter
        this.textIndex.push({
          chapterIndex: i,
          chapterTitle: bookInfo.toc[i].text,
          text: '',
          searchableText: ''
        });
      }
    }

    this.isIndexed = true;
  }

  // extract plain text from HTML content
  private extractPlainText(htmlContent: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const scripts = doc.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    const textContent = doc.body ? doc.body.textContent || doc.body.innerText || '' : '';
    
    return textContent.replace(/\s+/g, ' ').trim();
  }

  private async extractTextFromChapter(chapterContent: string): Promise<string> {
    const parser = new DOMParser();
    const chapterDoc = parser.parseFromString(chapterContent, "application/xml");

    if (!chapterDoc) {
      throw new Error("Failed to parse chapter content");
    }

    return chapterDoc.documentElement.outerHTML;
  }

  searchText(query: string): SearchResult[] {
    if (!this.isIndexed || !query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const searchQuery = query.toLowerCase();
    const seenResults = new Set<string>();
    let textIndex = this.textIndex;
    console.log(`Searching for "${searchQuery}" in chapters...`);
    textIndex.forEach((chapter) => {
      const searchText = chapter.searchableText.toLowerCase();
      let startIndex = 0;

      while (true) {
        const index = searchText.indexOf(searchQuery, startIndex);
        if (index === -1) break;

        const resultId = `${chapter.chapterIndex}-${index}`;
        if (seenResults.has(resultId)) {
          startIndex = index + searchQuery.length;
          continue;
        }
        seenResults.add(resultId);

        const contextLength = 50;
        const contextStart = Math.max(0, index - contextLength);
        const contextEnd = Math.min(searchText.length, index + searchQuery.length + contextLength);
        
        const contextBefore = chapter.searchableText.substring(contextStart, index);
        const matchText = chapter.searchableText.substring(index, index + searchQuery.length);
        const contextAfter = chapter.searchableText.substring(index + searchQuery.length, contextEnd);

        results.push({
          chapterIndex: chapter.chapterIndex,
          chapterTitle: chapter.chapterTitle,
          matchText,
          contextBefore,
          contextAfter,
          position: index
        });

        // move past this match
        startIndex = index + searchQuery.length;
      }
    });

    // sort results by chapter index and position
    results.sort((a, b) => {
      if (a.chapterIndex !== b.chapterIndex) {
        return a.chapterIndex - b.chapterIndex;
      }
      return a.position - b.position;
    });

    console.info('Search results:', results);

    return results;
  }

  getChapterText(chapterIndex: number): string {
    if (chapterIndex >= 0 && chapterIndex < this.textIndex.length) {
      return this.textIndex[chapterIndex].searchableText;
    }
    return '';
  }

  isIndexReady(): boolean {
    return this.isIndexed;
  }

  getIndexInfo() {
    return {
      isReady: this.isIndexed,
      chaptersCount: this.textIndex.length,
      totalTextLength: this.textIndex.reduce((sum, chapter) => sum + chapter.searchableText.length, 0)
    };
  }

  clearIndex(): void {
    this.textIndex = [];
    this.isIndexed = false;
    this.currentBookId = '';
  }
}
