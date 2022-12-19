import JSZip from "jszip";
import xmldoc from "xmldoc";
import toHTML from "./html";
import xml from "./xml";
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

  const manifestData = (await z.locate(indexPath).xml()) as {
    package: {
      spine: {
        itemref: {
          $: {
            idref: string;
          };
        }[];
      }[];
      manifest: {
        item: {
          $: {
            id: string;
            href: string;
            ["media-type"]: string;
          };
        }[];
      }[];
      metadata: {
        meta: {
          $: {
            content: unknown;
            name: unknown;
          };
        }[];
        ["dc:title"]: unknown[];
        ["dc:language"]: unknown[];
      }[];
    };
  };
  // The manifest is the list of all files.
  const manifestItem = manifestData.package.manifest[0];

  const metadata = manifestData.package.metadata[0];

  return {
    cover: function () {
      if (!metadata.meta) {
        return null;
      }
      const metaItem = metadata.meta.find((m) => m.$.name == "cover");
      if (!metaItem) {
        return null;
      }
      const id = metaItem.$.content;
      const item = manifestItem.item.find((i) => i.$.id == id);
      if (!item) {
        throw new Error(`couldn't find item "${id}"`);
      }
      const imgNode = indexNode.locate(item.$.href);
      return {
        type: item.$["media-type"],
        data: () => imgNode.data(),
        buffer: () => imgNode.data("nodebuffer"),
      };
    },

    chapters: function () {
      return manifestData.package.spine[0].itemref.map(function (ref) {
        const item = manifestItem.item.find((i) => i.$.id == ref.$.idref);
        if (!item) {
          throw new Error(`couldn't find item "${ref.$.idref}"`);
        }
        const zipNode = indexNode.locate(item.$.href);

        /**
         * Returns contents of the chapter as a list of elements.
         */
        async function read() {
          const str = await zipNode.data("string");
          const doc = new xmldoc.XmlDocument(str.toString());
          for (const image of xml.find(
            doc,
            (ch: any) => ch.name == "img" || ch.name == "image"
          )) {
            let hrefAttr = "src";
            if (image.name == "image") {
              hrefAttr = "xlink:href";
            }
            const href = image.attr[hrefAttr];
            const imageNode = zipNode.locate(href);
            const imagePath = imageNode.path();
            const item = manifestItem.item.find(
              (i) => indexNode.locate(i.$.href).path() == imagePath
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
          if (!body) {
            throw new Error(`body element missing in the document`);
          }
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
      const item = manifestItem.item.find(
        (i) => i.$["media-type"] == "application/x-dtbncx+xml"
      );
      if (!item) {
        throw new Error("couldn't find NCX item in the manifest");
      }
      const ncxNode = indexNode.locate(item.$.href);
      function parsePoints(root: navpoint[]) {
        return root.map(function (p) {
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
      type navpoint = {
        navPoint: navpoint[];
        navLabel: { text: unknown[] }[];
        content: { $: { src: string } }[];
      };
      const tocData = (await ncxNode.xml()) as {
        ncx: {
          navMap: {
            navPoint: navpoint[];
          }[];
        };
      };
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
      const nodes = manifestItem.item
        .filter((i) => i.$["media-type"] == "text/css")
        .map((i) => indexNode.locate(i.$.href));
      let css = "";
      for (const node of nodes) {
        css += await node.data("string");
        css += "\n";
      }
      return css;
    },
  };
};

function getString(node: unknown) {
  if (typeof node == "string") {
    return node;
  }
  if (typeof node == "object" && node !== null && "_" in node) {
    return node._;
  }
  throw new Error(`couldn't get string from node "${JSON.stringify(node)}"`);
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
