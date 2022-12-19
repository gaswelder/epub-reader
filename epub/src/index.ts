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
  const manifest1 = new Manifest(indexNode, manifestData.package.manifest[0]);

  return {
    cover: function () {
      if (!manifestData.package.metadata[0].meta) return null;
      const meta = manifestData.package.metadata[0].meta.find(
        (m: any) => m.$.name == "cover"
      );
      if (!meta) return null;
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
    toc: manifest1.ncx().list,

    /**
     * Returns the book's title.
     */
    title: function () {
      const meta = manifestData.package.metadata[0];
      if (!meta["dc:title"]) {
        return null;
      }
      return getString(meta["dc:title"][0]);
    },

    /**
     * Returns the book's language.
     */
    language: function () {
      return getString(manifestData.package.metadata[0]["dc:language"][0]);
    },

    stylesheet: async function () {
      const nodes = manifest1.stylesheets();
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
