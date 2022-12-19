import JSZip from "jszip";
import * as path from "path";

export function ZipNode(zip: JSZip, nodePath: string) {
  return {
    locate: function (href: string) {
      const targetPath = path.join(path.dirname(nodePath), href);
      return ZipNode(zip, targetPath);
    },
    data: function (type: "string" = "string") {
      const file = zip.file(nodePath);
      if (!file) {
        throw new Error(`file "${nodePath}" not found`);
      }
      return file.async(type);
    },
    path: function () {
      return nodePath;
    },
  };
}
