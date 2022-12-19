import JSZip from "jszip";
import { Z, ZipNode } from "./ZipNode";
const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

const isImage = (ch: any) => ch.name == "img" || ch.name == "image";

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
      const item = manifest_.item.find((i: any) => i.$.id == id);
      const imgNode = indexNode.locate(item.$.href);
      return {
        type: item.$["media-type"],
        data: () => imgNode.data(),
        buffer: () => imgNode.data("nodebuffer"),
      };
    },

    chapters: function () {
      const refs = manifestData.package.spine[0].itemref;
      return refs.map(function (ref: any) {
        const id = ref.$.idref;
        const item = manifest_.item.find((i: any) => i.$.id == id);
        const href = item.$.href;
        const zipNode = indexNode.locate(href);

        /**
         * Returns contents of the chapter as a list of elements.
         */
        async function read() {
          const str = await zipNode.data("string");
          const doc = new xmldoc.XmlDocument(str);
          for (const image of xml.find(doc, isImage)) {
            let hrefAttr = "src";
            if (image.name == "image") {
              hrefAttr = "xlink:href";
            }
            const href = image.attr[hrefAttr];
            const imageNode = zipNode.locate(href);
            const imagePath = imageNode.path();
            const item = manifest_.item.find(
              (i: any) => indexNode.locate(i.$.href).path() == imagePath
            );
            if (!item) {
              throw new Error("couldn't find image " + imagePath);
            }
            const imgNode = indexNode.locate(item.$.href);
            const img64 = await imgNode.data("base64");
            image.attr[
              hrefAttr
            ] = `data:${item.$["media-type"]};base64,${img64}`;
          }
          const elements = [];
          const body = doc.childNamed("body");
          elements.push(...body.children);
          return elements;
        }

        const ch = {
          /**
           * Returns contents of the chapter as HTML string.
           */
          html: async function () {
            const elements = await read();
            return elements.map(toHTML).join("");
          },

          /**
           * Returns the chapter's archive path.
           */
          path: function () {
            return zipNode.path();
          },
        };
        return ch;
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
