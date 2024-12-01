import { useEffect, useState } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MenuIcon } from "@/components/ui/menu";
import { Tooltip } from "@nextui-org/tooltip";
import { useRendererModeStore } from "@/store/rendererModeStore";
import { useBookInfoStore } from "@/store/bookInfoStore";
import { useCurrentChapterStore } from "@/store/currentChapterStore";
import { useTheme } from "next-themes";

const Menu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const mode = useRendererModeStore((state) => state.rendererMode);
  const bookInfo = useBookInfoStore((state) => state.bookInfo);
  const currentChapter = useCurrentChapterStore((state) => state.currentChapter);
  const setCurrentChapter = useCurrentChapterStore((state) => state.setCurrentChapter);
  const { theme } = useTheme();

  useEffect(() => {
    if (bookInfo.coverBlob) {
      const url = URL.createObjectURL(bookInfo.coverBlob);
      setCoverUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [bookInfo]);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer z-50 dark:bg-neutral-900"
        onClick={handleMenuClick}
      >
        <MenuIcon isOpen={isOpen} />
      </div>
      <div
        className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-10 z-50 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      ></div>
      <div
        className={`w-auto h-[86vh] bg-white rounded-2xl dark:bg-neutral-800 fixed bottom-12 ${
          mode === "single" ? "right-1/4" : " right-[10%]"
        } z-50 transition-opacity duration-500 transform ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } shadow-md`}
      >
        <div className="flex px-6 pt-8 pb-4 z-50">
          {coverUrl && (
            <Image
              className="shadow-md rounded-md"
              src={coverUrl}
              alt="Book Cover"
              width={80}
              height={160}
              style={{ objectFit: "cover", width: "80px", height: "auto" }}
            />
          )}
          <div className="w-4/6 mx-4">
            <Tooltip content={bookInfo.title}>
              <h2 className="font-bold truncate w-[90%] text-lg font-SiYuanSongTi">
                {bookInfo.title}
              </h2>
            </Tooltip>

            <p className="text-slate-500 dark:text-white">{bookInfo.creator}</p>
          </div>
        </div>
        <div>
          <ScrollArea className="h-[68vh] w-full z-50">
            <div>
              {bookInfo.toc.map((_item, index) => (
                <div
                  key={index}
                  className={`py-4 px-8 ${
                    theme === "dark" ? "hover:bg-neutral-600" : "hover:bg-blue-50"
                  }  dark:text-white cursor-pointer	`}
                >
                  <a
                    onClick={() => setCurrentChapter(index)}
                    className={`block text-sm ${
                      currentChapter === index ? "text-blue-500" : "text-slate-500 dark:text-white"
                    }`}
                  >
                    {_item.text}
                  </a>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default Menu;
