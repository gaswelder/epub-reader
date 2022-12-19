import JSZip from "jszip";
import * as xml2js from "xml2js";
import Manifest from "./opf";
import { ZipNode } from "./ZipNode";

/**
 * Reads the given source and returns a book object.
 * The source is whatever can be read by JSZip.
 */
export const load = async (src: any) => {
  const zip = await new JSZip().loadAsync(src);
  const manifest = await getManifest(zip);
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

/**
 * Reads the given zip and returns a manifest object.
 */
async function getManifest(zip: JSZip) {
  const indexPath = await rootFilePath(zip);
  const indexNode = ZipNode(zip, indexPath);
  const file = zip.file(indexPath);
  if (!file) {
    throw new Error(`file "${indexPath}" not found`);
  }
  const manifestData = await xml2js.parseStringPromise(
    await file.async("string")
  );
  return new Manifest(indexNode, manifestData);
}

/**
 * Returns the path to the manifest file.
 */
async function rootFilePath(zip: JSZip) {
  const file = zip.file("META-INF/container.xml");
  if (!file) {
    throw new Error(`container.xml not fount`);
  }
  const containerData = await xml2js.parseStringPromise(
    await file.async("string")
  );
  const rootFile = containerData.container.rootfiles[0].rootfile[0];
  if (rootFile.$["media-type"] != "application/oebps-package+xml") {
    throw new Error(
      "Expected 'application/oebps-package+xml, got " + rootFile.$["media-type"]
    );
  }
  return rootFile.$["full-path"];
}
