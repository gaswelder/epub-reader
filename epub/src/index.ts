import JSZip from "jszip";
import Manifest from "./opf";
import { Z, ZipNode } from "./ZipNode";

/**
 * Reads the given source and returns a book object.
 * The source is whatever can be read by JSZip.
 */
export const load = async (src: any) => {
  const zip = await new JSZip().loadAsync(src);
  const z = Z(zip);
  const containerData = await z.locate("META-INF/container.xml").xml();
  const rootFile = containerData.container.rootfiles[0].rootfile[0];
  if (rootFile.$["media-type"] != "application/oebps-package+xml") {
    throw new Error(
      "Expected 'application/oebps-package+xml, got " + rootFile.$["media-type"]
    );
  }
  const indexPath = rootFile.$["full-path"];
  const indexNode = ZipNode(zip, indexPath);

  const manifestData = await z.locate(indexPath).xml();
  // The manifest is the list of all files.
  const manifest_ = manifestData.package.manifest[0];
  const manifest1 = new Manifest(indexNode, manifest_);

  const metadata = manifestData.package.metadata[0];

  return {
    cover: function () {
      if (!metadata.meta) {
        return null;
      }
      const meta = metadata.meta.find((m: any) => m.$.name == "cover");
      if (!meta) {
        return null;
      }
      const id = meta.$.content;
      return manifest1.imageById(id);
    },

    chapters: function () {
      const refs = manifestData.package.spine[0].itemref;
      return refs.map(function (ref: any) {
        const id = ref.$.idref;
        return manifest1.chapterById(id);
      });
    },
    /**
     * Returns the book's table of contents
     * as a list of navigation pointer objects.
     */
    toc: async () => {
      const item = manifest_.item.find(
        (i: any) => i.$["media-type"] == "application/x-dtbncx+xml"
      );
      if (!item) {
        throw new Error("couldn't find NCX item in the manifest");
      }
      const ncxNode = indexNode.locate(item.$.href);
      function parsePoints(root: any) {
        return root.map(function (p: any) {
          return {
            title: () => p.navLabel[0].text[0],
            children: () => (p.navPoint ? parsePoints(p.navPoint) : []),
            /**
             * Returns the target chapter's archive path.
             */
            path: () => ncxNode.locate(p.content[0].$.src).path(),
          };
        });
      }
      const tocData = await ncxNode.xml();
      return parsePoints(ns(tocData.ncx.navMap[0]).navPoint);
    },

    /**
     * Returns the book's title.
     */
    title: function () {
      return getString(metadata["dc:title"][0]);
    },

    /**
     * Returns the book's language.
     */
    language: function () {
      return getString(metadata["dc:language"][0]);
    },

    stylesheet: async function () {
      const nodes = manifest_.item
        .filter((i: any) => i.$["media-type"] == "text/css")
        .map((i: any) => indexNode.locate(i.$.href));
      let css = "";
      for (const node of nodes) {
        css += await node.data("string");
        css += "\n";
      }
      return css;
    },
  };
};

function getString(node: any) {
  if (typeof node == "object") {
    return node._;
  } else {
    return node;
  }
}

function ns(data: any): any {
  if (typeof data != "object") {
    return data;
  }
  return new Proxy(data, {
    get(t, k) {
      if (typeof k != "string") {
        return t[k];
      }
      return ns(t[k] || t["ncx:" + k]);
    },
  });
}
