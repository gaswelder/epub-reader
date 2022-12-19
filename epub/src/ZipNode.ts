import JSZip from "jszip";
import * as path from "path";
import * as xml2js from "xml2js";

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
    locate: function (href: string) {
      const targetPath = path.join(path.dirname(nodePath), href);
      return ZipNode(zip, targetPath);
    },
    data: function (type: "string" | "nodebuffer" | "base64" = "string") {
      const file = zip.file(nodePath);
      if (!file) {
        throw new Error(`file "${nodePath}" not found`);
      }
      return file.async(type);
    },
    async xml() {
      return xml2js.parseStringPromise(await file.async("string"));
    },
    path: function () {
      return nodePath;
    },
  };
}
