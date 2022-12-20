import JSZip from "jszip";
import xmldoc from "xmldoc";

export const Z = (zip: JSZip) => {
  return {
    async xmldoc(path: string) {
      const file = zip.file(path);
      if (!file) {
        throw new Error(`${path} not found`);
      }
      const str = await file.async("string");
      return new xmldoc.XmlDocument(str);
    },
    async b64(path: string) {
      const file = zip.file(path);
      if (!file) {
        throw new Error(`${path} not found`);
      }
      return file.async("base64");
    },
    async str(path: string) {
      const file = zip.file(path);
      if (!file) {
        throw new Error(`${path} not found`);
      }
      return file.async("string");
    },
  };
};
