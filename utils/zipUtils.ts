import JSZip from "jszip";

export const loadZip = async (zip: Blob) => {
  return await JSZip.loadAsync(zip);
};
