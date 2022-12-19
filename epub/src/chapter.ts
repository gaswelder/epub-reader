const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

const isImage = (ch: any) => ch.name == "img" || ch.name == "image";

export function Chapter(indexNode: any, href: string, manifest_: any) {
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
      const item = manifest_.item.find((i: any) => indexNode.locate(i.$.href).path() == imagePath);
      if (!item) {
        throw new Error("couldn't find image " + imagePath);
      }
      const imgNode = indexNode.locate(item.$.href);
      const img64 = await imgNode.data("base64");
      image.attr[hrefAttr] = `data:${item.$["media-type"]};base64,${img64}`;
    }
    const elements = [];
    const body = doc.childNamed("body");
    elements.push(...body.children);
    return elements;
  }

  return {
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
}
