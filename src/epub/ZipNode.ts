import * as path from "path";

export function ZipNode(zip, nodePath) {
  return {
    locate: function (href) {
      const targetPath = path.join(path.dirname(nodePath), href);
      return ZipNode(zip, targetPath);
    },
    data: function (type = "string") {
      return zip.file(nodePath).async(type);
    },
    path: function () {
      return nodePath;
    },
  };
}
