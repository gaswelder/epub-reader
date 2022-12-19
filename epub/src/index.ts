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
  const manifest = new Manifest(indexNode, manifestData);
  const ncx = manifest.ncx();
  return {
    cover: manifest.cover,
    /**
     * Returns the book's table of contents
     * as a list of navigation pointer objects.
     */
    toc: ncx.list,

    /**
     * Returns the book's title.
     */
    title: manifest.title,

    /**
     * Returns the book't language.
     */
    language: manifest.language,

    /**
     * Returns the list of the book's chapters.
     */
    chapters: manifest.chapters,

    stylesheet: async function () {
      const nodes = manifest.stylesheets();
      let css = "";
      for (const node of nodes) {
        css += await node.data("string");
        css += "\n";
      }
      return css;
    },
  };
};
