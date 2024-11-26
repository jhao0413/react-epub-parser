import { useEffect, useState } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MenuIcon } from "@/components/ui/menu";
import { Tooltip } from "@nextui-org/tooltip";

interface BookBasicInfo {
  title: string;
  creator: string;
  publisher: string;
  identifier: string;
  date: string;
  coverPath: string;
  coverBlob: Blob | null;
  toc: { text: string; path: string; file: string }[];
}

type MenuProps = {
  bookBasicInfo: BookBasicInfo;
  currentChapter: number;
  setCurrentChapter: (index: number) => void;
};

const Menu: React.FC<MenuProps> = ({ bookBasicInfo, currentChapter, setCurrentChapter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (bookBasicInfo.coverBlob) {
      const url = URL.createObjectURL(bookBasicInfo.coverBlob);
      setCoverUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [bookBasicInfo]);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOverlayClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer z-50"
        onClick={handleMenuClick}
      >
        <MenuIcon isOpen={isOpen} />
      </div>
      <div
        className={`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-10 z-10 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
      ></div>
      <div
        className={`w-[22vw] h-[86vh] bg-white rounded-2xl fixed top-[7vh] right-[10%] z-10 transition-transform transition-opacity duration-500 transform ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } shadow-md`}
      >
        <div className="flex px-6 pt-8 pb-4">
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
            <Tooltip content={bookBasicInfo.title}>
              <h2 className="font-bold truncate w-[90%] text-lg">{bookBasicInfo.title}</h2>
            </Tooltip>

            <p className="text-slate-500">{bookBasicInfo.creator}</p>
          </div>
        </div>
        <div>
          <ScrollArea className="h-[68vh] w-full">
            <div>
              {bookBasicInfo.toc.map((_item, index) => (
                <div key={index} className="py-4 px-8 hover:bg-blue-50 cursor-pointer	">
                  <a
                    onClick={() => setCurrentChapter(index)}
                    className={`block text-sm ${
                      currentChapter === index ? "text-blue-500" : "text-slate-500"
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
