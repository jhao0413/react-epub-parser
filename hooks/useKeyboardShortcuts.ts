import { useEffect } from 'react';

interface KeyboardShortcuts {
  onPrevious: () => void;
  onNext: () => void;
  onSearch?: () => void;
}

export const useKeyboardShortcuts = ({ onPrevious, onNext, onSearch }: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K (macOS)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isShortcut = isMac ? event.metaKey : event.ctrlKey;
      
      if (isShortcut && event.key === 'k' && onSearch) {
        event.preventDefault();
        onSearch();
        return;
      }
      
      // Original navigation keys
      if (event.key === 'ArrowLeft') {
        onPrevious();
      } else if (event.key === 'ArrowRight' || event.key === 'Space') {
        onNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPrevious, onNext, onSearch]);
};
