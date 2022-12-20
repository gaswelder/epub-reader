import JSZip from "jszip";
import * as xml2js from "xml2js";
import xmldoc from "xmldoc";

export const Z = (zip: JSZip) => {
  return {
    locate(path: string) {
      return ZipNode(zip, path);
    },
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

export function ZipNode(zip: JSZip, nodePath: string) {
  const file = zip.file(nodePath);
  if (!file) {
    throw new Error(`${nodePath} not found`);
  }
  return {
    async xml() {
      return xml2js.parseStringPromise(await file.async("string"));
    },
  };
}
