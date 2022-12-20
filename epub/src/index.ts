import JSZip from "jszip";
import { XmlElement, XmlNode } from "xmldoc";
import toHTML from "./html";
import xml from "./xml";
import { Z, ZipNode } from "./ZipNode";
import * as path from "path";

/**
 * Reads the given source and returns a book object.
 * The source is whatever can be read by JSZip.
 */
export const load = async (src: any) => {
  const zip = await new JSZip().loadAsync(src);
  const z = Z(zip);

  // Go to container.xml and find out where the index file is.
  const containerDoc = await z.xmldoc("META-INF/container.xml");
  const rootfile = containerDoc.descendantWithPath("rootfiles.rootfile");
  if (!rootfile) {
    throw new Error(`couldn't get rootfile from container.xml`);
  }
  if (rootfile.attr["media-type"] != "application/oebps-package+xml") {
    throw new Error(
      "Expected rootfile with media type application/oebps-package+xml, got " +
        rootfile.attr["media-type"]
    );
  }
  const indexPath = rootfile.attr["full-path"];
  const indexDoc = await z.xmldoc(indexPath);

  // Get the manifest - the list of all files in the package.
  const manifest = indexDoc
    .childNamed("manifest")
    ?.childrenNamed("item")
    .map((node) => {
      return {
        id: node.attr.id,
        href: node.attr.href,
        type: node.attr["media-type"],
      };
    });
  if (!manifest) {
    throw new Error(`couldn't read the manifest`);
  }

  // Get the spine - the ordered list of chapter file ids.
  const spine = indexDoc
    .childNamed("spine")
    ?.childrenNamed("itemref")
    .map((node) => node.attr.idref);
  if (!spine) {
    throw new Error(`couldn't read the spine`);
  }

  const indexNode = ZipNode(zip, indexPath);

  return {
    cover: function () {
      const f = (n: XmlNode): n is XmlElement =>
        n.type == "element" && n.name == "meta" && n.attr.name == "cover";
      const coverMeta = indexDoc.childNamed("metadata")?.children.find(f);
      if (!coverMeta) {
        return null;
      }
      const coverImageId = coverMeta.attr.content;
      const item = manifest.find((x) => x.id == coverImageId);
      if (!item) {
        throw new Error(`couldn't find item "${coverImageId}"`);
      }
      return {
        type: item.type,
        b64: () => z.b64(applyHref(indexPath, item.href)),
      };
    },

    chapters: function () {
      return spine.map(function (chapterFileId) {
        const chapterItem = manifest.find((x) => x.id == chapterFileId);
        if (!chapterItem) {
          throw new Error(`couldn't find spine item "${chapterFileId}"`);
        }
        return {
          /**
           * Returns contents of the chapter as HTML string.
           */
          html: async function () {
            const chapterPath = applyHref(indexPath, chapterItem.href);
            const doc = await z.xmldoc(chapterPath);
            for (const image of xml.find(
              doc,
              (ch: any) => ch.name == "img" || ch.name == "image"
            )) {
              let hrefAttr = "src";
              if (image.name == "image") {
                hrefAttr = "xlink:href";
              }
              const imagePath = applyHref(chapterPath, image.attr[hrefAttr]);
              const imageItem = manifest.find(
                (x) => applyHref(indexPath, x.href) == imagePath
              );
              if (!imageItem) {
                throw new Error("couldn't find image " + imagePath);
              }
              const img64 = await z.b64(applyHref(indexPath, imageItem.href));
              image.attr[hrefAttr] = `data:${imageItem.type};base64,${img64}`;
            }
            const elements = [];
            const body = doc.childNamed("body");
            if (!body) {
              throw new Error(`body element missing in the document`);
            }
            elements.push(...body.children);
            return elements.map(toHTML).join("");
          },

          /**
           * Returns the chapter's archive path.
           */
          path: function () {
            return applyHref(indexPath, chapterItem.href);
          },
        };
      });
    },
    /**
     * Returns the book's table of contents
     * as a list of navigation pointer objects.
     */
    toc: async () => {
      const ncxItem = manifest.find(
        (x) => x.type == "application/x-dtbncx+xml"
      );
      if (!ncxItem) {
        throw new Error("couldn't find NCX item in the manifest");
      }

      const ncxPath = applyHref(indexPath, ncxItem.href);
      function parsePoints(root: navpoint[]) {
        return root.map(function (p) {
          return {
            title: () => p.navLabel[0].text[0],
            children: () => (p.navPoint ? parsePoints(p.navPoint) : []),
            /**
             * Returns the target chapter's archive path.
             */
            path: () => applyHref(ncxPath, p.content[0].$.src),
          };
        });
      }
      type navpoint = {
        navPoint: navpoint[];
        navLabel: { text: unknown[] }[];
        content: { $: { src: string } }[];
      };
      const tocData = (await z.locate(ncxPath).xml()) as {
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
      return indexDoc.descendantWithPath("metadata.dc:title")?.val;
    },

    /**
     * Returns the book's language.
     */
    language: function () {
      return indexDoc.descendantWithPath("metadata.dc:language")?.val;
    },

    stylesheet: async function () {
      let css = "";
      for (const cssItem of manifest.filter((x) => x.type == "test/css")) {
        css += await z.str(applyHref(indexPath, cssItem.href));
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

const applyHref = (p: string, href: string) => path.join(path.dirname(p), href);
