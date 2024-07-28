"use client";

import React, { useState, useEffect, useRef, RefObject } from "react";
import JSZip from "jszip";
import ContentRenderer from "./content-reader";

interface EpubReaderProps {
    url: string;
}

const EpubReader = ({ url }: EpubReaderProps) => {
    const [content, setContent] = useState<string>("");

    useEffect(() => {
        processEPUB(url);
    }, [url]);

    const fetchEPUB = async (url: string): Promise<JSZip> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return JSZip.loadAsync(blob);
    };

    const getOPFContent = async (zip: JSZip): Promise<{ opfContent: string; zip: JSZip }> => {
        const opfFile = zip.file("OEBPS/content.opf");
        if (!opfFile) throw new Error("content.opf not found");
        const opfContent = await opfFile.async("string");
        return { opfContent, zip };
    };

    const parseOPF = (opfContent: string): Document => {
        const parser = new DOMParser();
        return parser.parseFromString(opfContent, "application/xml");
    };

    const getContentPromises = (
        zip: JSZip,
        itemRefs: NodeListOf<Element>,
        items: NodeListOf<Element>
    ): Promise<string>[] => {
        const contentPromises: Promise<string>[] = [];
        if (itemRefs.length > 2) {
            const id = itemRefs[20].getAttribute("idref");
            const item = Array.from(items).find((i) => i.getAttribute("id") === id);
            if (item) {
                const href = item.getAttribute("href");
                const file = zip.file(`OEBPS/${href}`);
                if (file) {
                    contentPromises.push(file.async("string"));
                }
            }
        }
        return contentPromises;
    };

    const getStylePromises = (zip: JSZip, items: NodeListOf<Element>): Promise<{ href: string; content: string }>[] => {
        const stylePromises: Promise<{ href: string; content: string }>[] = [];
        items.forEach((item) => {
            const href = item.getAttribute("href");
            const mediaType = item.getAttribute("media-type");
            if (mediaType === "text/css") {
                const file = zip.file(`OEBPS/${href}`);
                if (file) {
                    stylePromises.push(
                        file.async("string").then((content) => {
                            return { href: href || '', content };
                        })
                    );
                }
            }
        });
        return stylePromises;
    };

    const getImagePromises = (zip: JSZip, items: NodeListOf<Element>): Promise<{ href: string; base64: string }>[] => {
        const imagePromises: Promise<{ href: string; base64: string }>[] = [];
        items.forEach((item) => {
            const href = item.getAttribute("href");
            const mediaType = item.getAttribute("media-type");
            if (mediaType && mediaType.startsWith("image/")) {
                const file = zip.file(`OEBPS/${href}`);
                if (file) {
                    imagePromises.push(
                        file.async("base64").then((base64) => {
                            return { href: href || '', base64: `data:${mediaType};base64,${base64}` };
                        })
                    );
                }
            }
        });
        return imagePromises;
    };

    const replaceStyles = (content:string,styles: Record<string, string>) => {
        
        const result = content.replace(/<link href="([^"]+)" rel="stylesheet" type="text\/css"\/>/g, (match, p1) => {
            const stylePath = p1.replace(/\.\.\//g, '');
            return `<style>${styles[stylePath] || ''}</style>`;
        });
        // console.log(result);
        
        return result;
    }

    const replaceImages = (content: string, images: Record<string, string>) => {
        const result = content
        .replace(/src="([^"]+)"/g, (match, p1) => {
          const imagePath = p1.replace(/\.\.\//g, '');
          return `src="${images[imagePath] || p1}"`;
        })
        .replace(/xlink:href="([^"]+)"/g, (match, p1) => {
          const imagePath = p1.replace(/\.\.\//g, '');
          return `xlink:href="${images[imagePath] || p1}"`;
        });
        return result;
    }

    const processEPUB = async (url: string) => {
        try {
            const zip = await fetchEPUB(url);
            const { opfContent } = await getOPFContent(zip);
            const opfDoc = parseOPF(opfContent);

            const spine = opfDoc.querySelector("spine");
            const itemRefs = (spine?.querySelectorAll("itemref") || []) as NodeListOf<Element>;
            const manifest = opfDoc.querySelector("manifest");
            const items = (manifest?.querySelectorAll("item") || []) as NodeListOf<Element>;

            const contentPromises = getContentPromises(zip, itemRefs, items);
            const stylePromises = getStylePromises(zip, items);
            const imagePromises = getImagePromises(zip, items);

            const [contentArray, styleArray, imageArray] = await Promise.all([
                Promise.all(contentPromises),
                Promise.all(stylePromises),
                Promise.all(imagePromises),
            ]);

            let content = contentArray.join('');
            const styles = styleArray.reduce((acc, { href, content }) => {
                acc[href] = content;
                return acc;
            }, {} as Record<string, string>);
            const images = imageArray.reduce((acc, { href, base64 }) => {
                acc[href] = base64;
                return acc;
            }, {} as Record<string, string>);
            
            content = replaceStyles(content, styles);
            content = replaceImages(content, images);
            setContent(content);
            // setStyles(styles);
            // setImages(images);
        } catch (error) {
            console.error("Error loading EPUB file:", error);
        }
    };

    return (
        <ContentRenderer content={content} />
    );
};

export default EpubReader;