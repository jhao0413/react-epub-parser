import { useEffect } from "react";

interface KeyboardListener {
  onPrevious: () => void;
  onNext: () => void;
}

export const useKeyboardNavigation = ({ onPrevious, onNext }: KeyboardListener) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onPrevious();
      } else if (event.key === "ArrowRight" || event.key === "Space") {
        onNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onPrevious, onNext]);
};
