'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Github, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@heroui/button';
import { useBookInfoStore } from '@/store/bookInfoStore';
import { useReaderStateStore } from '@/store/readerStateStore';
import { useRendererConfigStore } from '@/store/fontConfigStore';
import { Toolbar } from '@/components/Renderer/Toolbar/Index';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useTheme } from 'next-themes';
import { useBookZipStore } from '@/store/bookZipStore';
import { loadChapterContent } from '@/utils/chapterLoader';
import { parseAndProcessChapter } from '@/utils/chapterParser';
import {
  handleIframeLoad,
  waitForImagesAndCalculatePages,
  writeToIframe,
} from '@/utils/iframeHandler';
import { applyFontAndThemeStyles } from '@/utils/styleHandler';
import { useRendererModeStore } from '@/store/rendererModeStore';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/modal';
import { Image } from '@heroui/image';
import { Tooltip } from '@heroui/tooltip';
import dayjs from 'dayjs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTextNavigation } from '@/hooks/useTextNavigation';
import { useFullBookSearchStore } from '@/store/fullBookSearchStore';
import { TextPosition, TextPositionMapper } from '@/utils/textPositionMapper';
import { Input } from '@heroui/input';
import { Kbd } from '@heroui/kbd';
import { SearchModal } from './SearchModal';
const COLUMN_GAP = 100;

const EpubReader: React.FC = () => {
  const t = useTranslations('Renderer');
  const tModal = useTranslations('BookInfoModal');
  
  // book info modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  // search modal
  const { 
    isOpen: isOpenSearch, 
    onOpen: onOpenSearch, 
    onClose: onCloseSearch 
  } = useDisclosure();

  // page state
  const currentChapter = useReaderStateStore(state => state.currentChapter);
  const currentPageIndex = useReaderStateStore(state => state.currentPageIndex);
  const setCurrentChapter = useReaderStateStore(state => state.setCurrentChapter);
  const setCurrentPageIndex = useReaderStateStore(state => state.setCurrentPageIndex);

  const goToLastPageRef = useRef(false);
  const pageWidthRef = useRef(0);
  const pageCountRef = useRef(0);

  // font and theme
  const currentFontConfig = useRendererConfigStore(state => state.rendererConfig);
  const { theme } = useTheme();

  // epub book info and zip
  const bookInfo = useBookInfoStore(state => state.bookInfo);
  const bookZip = useBookZipStore(state => state.bookZip);
  const rendererMode = useRendererModeStore(state => state.rendererMode);  
  const { searchAndNavigate, highlightText } = useTextNavigation();
  const { indexer, setIndexing } = useFullBookSearchStore();
  
  const handleTextSearchWithPositions = useCallback((searchText: string, positions: TextPosition[]) => {
    const targetPage = searchAndNavigate(searchText, positions);
    if (targetPage) {
      const rendererWindow = getRendererWindow();
      if (rendererWindow) {
        rendererWindow.scrollTo({
          left: (targetPage - 1) * pageWidthRef.current,
        });
        setCurrentPageIndex(targetPage);
        
        highlightText(rendererWindow.document, searchText);
        
        onCloseSearch();
      }
    }
  }, [searchAndNavigate, onCloseSearch, highlightText]);
  
  
  useEffect(() => {
    const processChapter = async () => {
      const { chapterContent, basePath } = await loadChapterContent(
        bookZip,
        bookInfo,
        currentChapter
      );
      const updatedChapter = await parseAndProcessChapter(chapterContent, bookZip, basePath);
      const renderer = writeToIframe(
        updatedChapter,
        currentFontConfig,
        theme,
        rendererMode,
        COLUMN_GAP
      );
      const iframeDoc =
        renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
      if (iframeDoc) {
        waitForImagesAndCalculatePages(renderer, iframeDoc);
      } else {
        console.error('Iframe document not found');
      }

      const { currentSearchQuery } = useFullBookSearchStore.getState();

      return handleIframeLoad(
        renderer,
        pageWidthRef,
        pageCountRef,
        goToLastPageRef,
        setCurrentPageIndex,
        COLUMN_GAP,
        currentSearchQuery,
        handleTextSearchWithPositions
      );
    };

    processChapter();
  }, [bookInfo, bookZip, rendererMode, currentChapter, currentFontConfig, theme, handleTextSearchWithPositions]);

  // book index init 
  useEffect(() => {
    const initializeFullBookIndex = async () => {
      if (!bookZip || !bookInfo.toc.length) {
        return;
      }

      try {
        setIndexing(true);
        await indexer.indexFullBook(
          bookZip, 
          bookInfo
        );
        console.log('full book text index initialized successfully');
      } catch (error) {
        console.error(error);
      } finally {
        setIndexing(false);
      }
    };
    initializeFullBookIndex();
  }, [bookZip, bookInfo, indexer, setIndexing]);

  const getRendererWindow = () => {
    const renderer = document.getElementById('epub-renderer') as HTMLIFrameElement;
    if (renderer?.contentWindow) {
      return renderer.contentWindow;
    } else {
      console.error('Renderer not found');
      return null;
    }
  };

  const handleSearchResultClick = useCallback((resultIndex: number) => {
    const { searchResults, currentSearchQuery } = useFullBookSearchStore.getState();
    
    if (resultIndex >= 0 && resultIndex < searchResults.length) {
      const result = searchResults[resultIndex];
      
      if (result.chapterIndex === currentChapter) {
        if (currentSearchQuery) {
          const rendererWindow = getRendererWindow();
          if (rendererWindow) {
            const textMapper = new TextPositionMapper(pageWidthRef.current, COLUMN_GAP);
            const positions = textMapper.analyzeTextPositions(rendererWindow.document);
            handleTextSearchWithPositions(currentSearchQuery, positions);
          }
        }
      } else {
        setCurrentChapter(result.chapterIndex);
      }
    }
  }, [setCurrentChapter, currentChapter, handleTextSearchWithPositions]);
  
  useEffect(() => {
    const renderer = document.getElementById('epub-renderer') as HTMLIFrameElement;
    if (!renderer || !renderer.contentWindow) {
      throw new Error('Renderer not found');
    }
    applyFontAndThemeStyles(currentFontConfig, theme, rendererMode, COLUMN_GAP);
  }, [currentFontConfig, theme, rendererMode]);

  const handleNextPage = () => {
    const rendererWindow = getRendererWindow();
    if (!rendererWindow) return;

    if (currentPageIndex < pageCountRef.current) {
      rendererWindow.scrollTo({
        left: currentPageIndex * pageWidthRef.current,
      });
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentChapter < bookInfo.toc.length - 1) {
      setCurrentPageIndex(1);
      setCurrentChapter(currentChapter + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex === 1 && currentChapter === 0) {
      return;
    }

    if (currentPageIndex === 1 && currentChapter > 0) {
      goToLastPageRef.current = true;
      setCurrentChapter(currentChapter - 1);
    } else if (currentPageIndex > 1) {
      const rendererWindow = getRendererWindow();
      if (!rendererWindow) return;

      rendererWindow.scrollTo({
        left: (currentPageIndex - 2) * pageWidthRef.current,
      });
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  useKeyboardShortcuts({
    onPrevious: handlePrevPage,
    onNext: handleNextPage,
    onSearch: onOpenSearch,
  });

  return (
    <div className="w-full h-screen bg-gray-100 flex justify-center items-center flex-col dark:bg-neutral-800">
      <div className="flex w-4/5 h-12 justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={onOpen}>
          <BookOpen size={20} />
          <p
            className={`font-bold text-lg font-XiaLuZhenKai max-w-lg truncate ${
              bookInfo.language === 'zh' ? '' : 'italic'
            }`}
            title={bookInfo.language === 'zh' ? `《${bookInfo.title}》` : bookInfo.title}>
            {bookInfo.language === 'zh' ? `《${bookInfo.title}》` : bookInfo.title}
          </p>
        </div>
        <div className='flex'>
          <Input
            className="w-40 mr-4"
            color="default"
            radius='full'
            variant="bordered"
            placeholder={'Search'}
            onClick={onOpenSearch}
            startContent={<Search size={16} />}
            endContent={<Kbd keys={["ctrl"]}>K</Kbd>}
            onKeyDown={(e) => {
            }}
          />
          <LocaleSwitcher />
          <Button
            className="ml-4 bg-white dark:bg-neutral-900"
            isIconOnly
            variant="shadow"
            radius="sm"
            onPress={() => window.open('https://github.com/jhao0413/react-epub-parser', '_blank')}>
            <Github size={16} className="dark:bg-neutral-900" />
          </Button>
        </div>
      </div>

      {/* renderer */}
      <div className="w-4/5 h-[86vh] bg-white p-14 mt-4 rounded-2xl dark:bg-neutral-900">
        <div className="h-full relative">
          <iframe id="epub-renderer" style={{ width: '100%', height: '100%' }}></iframe>
          <div className="w-full flex justify-between">
            <Button
              radius="full"
              variant="bordered"
              className="bg-white border-2 border-inherit dark:bg-neutral-900"
              onPress={handlePrevPage}>
              <ChevronLeft size={16} />
              {t('previous')}
            </Button>
            <Button
              radius="full"
              variant="bordered"
              className="bg-white border-2 border-inherit dark:bg-neutral-900"
              onPress={handleNextPage}>
              {t('next')}
              <ChevronRight size={16} />
            </Button>
          </div>
          <div className="absolute right-[-140px] top-0 bottom-0 flex flex-col justify-center items-center">
            <Toolbar />
          </div>
        </div>
      </div>

      {/* book info */}
      <Modal backdrop="blur" size="2xl" isOpen={isOpen} onClose={onClose} className="pb-6">
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <div className="flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  {tModal('title')}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex">
                  <div className="mr-10">
                    <Image
                      isBlurred
                      alt="Event image"
                      width={300}
                      src={bookInfo.coverBlob ? URL.createObjectURL(bookInfo.coverBlob) : ''}
                    />
                  </div>

                  <div className="flex flex-col w-[50%]">
                    <Tooltip content={bookInfo.title}>
                      <h2 className="font-bold truncate w-[90%] text-2xl font-XiaLuZhenKai mb-2">
                        {bookInfo.title}
                      </h2>
                    </Tooltip>
                    {bookInfo.creator && (
                      <p className="mb-2">
                        <span className="font-bold">{tModal('author')}：</span>
                        {bookInfo.creator}
                      </p>
                    )}
                    {bookInfo.language && (
                      <p className="mb-2">
                        <span className="font-bold">{tModal('language')}：</span>
                        {bookInfo.language}
                      </p>
                    )}
                    {bookInfo.size && (
                      <p className="mb-2">
                        <span className="font-bold">{tModal('size')} :</span>
                        {bookInfo.size}
                      </p>
                    )}
                    {bookInfo.publisher && (
                      <p className="mb-2">
                        <span className="font-bold">{tModal('publisher')} :</span>
                        {bookInfo.publisher}
                      </p>
                    )}
                    {bookInfo.date && (
                      <p className="mb-2">
                        <span className="font-bold">{tModal('publicationDate')} :</span>
                        {dayjs(bookInfo.date).format('YYYY-MM-DD')}
                      </p>
                    )}
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <SearchModal
        isOpen={isOpenSearch}
        onClose={onCloseSearch}
        onSearchResultClick={handleSearchResultClick}
      />
    </div>
  );
};

export default EpubReader;
