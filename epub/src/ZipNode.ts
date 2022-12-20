import JSZip from "jszip";
import * as xml2js from "xml2js";
import xmldoc from "xmldoc";

export const Z = (zip: JSZip) => {
  return {
    locate(path: string) {
      return ZipNode(zip, path);
    },
  };
};

export function ZipNode(zip: JSZip, nodePath: string) {
  const file = zip.file(nodePath);
  if (!file) {
    throw new Error(`${nodePath} not found`);
  }
  return {
    data: function (type: "string" | "nodebuffer" | "base64" = "string") {
      return file.async(type);
    },
    async xml() {
      return xml2js.parseStringPromise(await file.async("string"));
    },
    async xmldoc() {
      const str = await file.async("string");
      return new xmldoc.XmlDocument(str);
    },
    path: function () {
      return nodePath;
    },
  };
}
