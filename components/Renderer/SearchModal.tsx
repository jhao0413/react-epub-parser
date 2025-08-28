import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFullBookSearchStore } from '@/store/fullBookSearchStore';
import { SearchResult } from '@/utils/fullBookTextIndexer';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResultClick: (resultIndex: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSearchResultClick,
}) => {
  const t = useTranslations('SearchModal');
  const [ searchText, setSearchText ] = useState('');
  const { searchResults, isIndexing } = useFullBookSearchStore();
  const { searchText: searchFullBook, currentSearchQuery } = useFullBookSearchStore();
  
  const handleSearch = () => {
    if (!searchText.trim()) return;

    searchFullBook(searchText.trim());
  };

  const handleSearchResultClick = (index: number) => {
    onSearchResultClick(index);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderSearchResult = (result: SearchResult, index: number) => (
    <div
      key={index}
      onClick={() => handleSearchResultClick(index)}
      className="mb-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={14} />
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {t('chapterFormat', { chapterNumber: result.chapterIndex + 1, chapterTitle: result.chapterTitle })}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span>{result.contextBefore}</span>
        <span className="bg-yellow-200 dark:bg-yellow-700 px-1 rounded">
          {result.matchText}
        </span>
        <span>{result.contextAfter}</span>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      backdrop="blur"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Search size={20} />
            <span>{t('title')}</span>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t('placeholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isIndexing}
              autoFocus
              startContent={<Search size={16} className="text-gray-400" />}
            />
            <Button
              color="primary"
              onPress={handleSearch}
              isDisabled={isIndexing || !searchText.trim()}
              isLoading={isIndexing}
              className="min-w-16"
            >
              {isIndexing ? <Loader2 size={16} className="animate-spin" /> : t('searchButton')}
            </Button>
          </div>

          {/* search result */}
          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">
                  {t('resultsFound', { count: searchResults.length })}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  &ldquo;{currentSearchQuery}&rdquo;
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result, index) => renderSearchResult(result, index))}
              </div>
            </div>
          )}

          {/* no search result prompts */}
          {currentSearchQuery && searchResults.length === 0 && !isIndexing && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <div>{t('noResultsFound', { query: currentSearchQuery })}</div>
              <div className="text-sm mt-1 opacity-75">{t('tryOtherKeywords')}</div>
            </div>
          )}

          {!currentSearchQuery && !isIndexing && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Search size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm">
                {t('searchInBook')}
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
