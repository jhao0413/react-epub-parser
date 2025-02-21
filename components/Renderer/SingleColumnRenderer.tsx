'use client';

import React, { useEffect } from 'react';
import { Button } from '@heroui/button';
import { useBookInfoStore } from '@/store/bookInfoStore';
import { useCurrentChapterStore } from '@/store/currentChapterStore';
import { useRendererConfigStore } from '@/store/fontConfigStore';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { BookOpen, Github } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toolbar } from '@/components/Renderer/Toolbar/Index';
import { applyFontAndThemeStyles } from '@/utils/styleHandler';
import { useRendererModeStore } from '@/store/rendererModeStore';
import { loadChapterContent } from '@/utils/chapterLoader';
import { useBookZipStore } from '@/store/bookZipStore';
import { parseAndProcessChapter } from '@/utils/chapterParser';
import { waitForImagesAndCalculatePages, writeToIframe } from '@/utils/iframeHandler';
import { useTranslations } from 'next-intl';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/modal';
import { Image } from '@heroui/image';
import { Tooltip } from '@heroui/tooltip';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import dayjs from 'dayjs';

const EpubReader: React.FC = () => {
  const t = useTranslations('SingleColumnRenderer');
  const tModal = useTranslations('BookInfoModal');
  const currentChapter = useCurrentChapterStore(state => state.currentChapter);
  const setCurrentChapter = useCurrentChapterStore(state => state.setCurrentChapter);
  const currentFontConfig = useRendererConfigStore(state => state.rendererConfig);
  const bookInfo = useBookInfoStore(state => state.bookInfo);
  const { theme } = useTheme();
  const bookZip = useBookZipStore(state => state.bookZip);
  const rendererMode = useRendererModeStore(state => state.rendererMode);

  useEffect(() => {
    const processChapter = async () => {
      const { chapterContent, basePath } = await loadChapterContent(
        bookZip,
        bookInfo,
        currentChapter
      );
      const updatedChapter = await parseAndProcessChapter(chapterContent, bookZip, basePath);
      const renderer = writeToIframe(updatedChapter, currentFontConfig, theme, rendererMode, 0);
      const iframeDoc =
        renderer.contentDocument || (renderer.contentWindow && renderer.contentWindow.document);
      if (iframeDoc) {
        waitForImagesAndCalculatePages(renderer, iframeDoc);
      } else {
        console.error('Iframe document not found');
      }

      return handleIframeLoad(renderer);
    };

    processChapter();
  }, [bookInfo, bookZip, currentChapter]);

  useEffect(() => {
    const renderer = document.getElementById('epub-renderer') as HTMLIFrameElement;
    if (!renderer || !renderer.contentWindow) {
      throw new Error('Renderer not found');
    }

    applyFontAndThemeStyles(currentFontConfig, theme, rendererMode, 0);
  }, [currentFontConfig, theme, rendererMode]);

  const handleIframeLoad = (renderer: HTMLIFrameElement) => {
    renderer.style.visibility = 'hidden';
    const handleLoad = () => {
      const iframeDoc = renderer.contentDocument;

      if (!iframeDoc || !renderer.contentWindow) {
        throw new Error('Iframe document not found');
      }

      renderer.style.height = `0px`;
      if (iframeDoc.body) {
        renderer.style.visibility = 'visible';
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );
        renderer.style.height = `${height + 40}px`;
        renderer.removeEventListener('load', handleLoad);
      }
    };

    renderer.addEventListener('load', handleLoad);
  };

  const handlePrevChapter = () => {
    setCurrentChapter(currentChapter - 1);
  };

  const handleNextChapter = () => {
    setCurrentChapter(currentChapter + 1);
  };

  useKeyboardNavigation({
    onPrevious: handlePrevChapter,
    onNext: handleNextChapter,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <div className="w-full h-screen bg-gray-100 flex justify-center fixed z-0 dark:bg-neutral-800"></div>
      <div className="w-1/2 h-14 bg-white border-b-2 flex fixed items-center pl-4 z-20 inset-x-0 m-auto dark:bg-neutral-900">
        <div className="flex w-full justify-between items-center pr-4">
          <div className="flex items-center cursor-pointer" onClick={onOpen}>
            <BookOpen size={20} />
            <p
              className={`font-bold text-lg font-XiaLuZhenKai ${
                bookInfo.language === 'zh' ? '' : 'italic'
              }`}>
              {bookInfo.language === 'zh' ? `《${bookInfo.title}》` : bookInfo.title}
            </p>
          </div>
          <div>
            <LocaleSwitcher />
            <Button
              className="ml-4 bg-white dark:bg-neutral-900"
              isIconOnly
              variant="bordered"
              radius="sm"
              onPress={() =>
                window.open('https://github.com/jhao0413/react-epub-parser', '_blank')
              }>
              <Github size={16} className="dark:bg-neutral-900" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-1/2 h-full min-h-[100vh] mx-auto bg-white relative pt-14 flex flex-col dark:bg-neutral-900">
        <iframe id="epub-renderer" className="w-full z-10 px-14 grow dark:bg-neutral-900"></iframe>
        <div className="w-full z-10 h-20 flex justify-around items-start">
          <Button
            variant="bordered"
            className="text-base rounded-md w-40 dark:bg-neutral-900"
            onPress={handlePrevChapter}>
            {t('previous')}
          </Button>
          <Button
            variant="bordered"
            className="text-base rounded-md w-40 dark:bg-neutral-900"
            onPress={handleNextChapter}>
            {t('next')}
          </Button>
        </div>

        <div className="fixed right-[20%] bottom-[40%] z-50">
          <Toolbar />
        </div>
      </div>
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

                  <div className="flex flex-col">
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
    </>
  );
};

export default EpubReader;
