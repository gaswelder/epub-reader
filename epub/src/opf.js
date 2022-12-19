const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

const isImage = (ch) => ch.name == "img" || ch.name == "image";

function Chapter(indexNode, href, manifest_) {
  const zipNode = indexNode.locate(href);
  function findItem(condition) {
    return manifest_.item.find(condition);
  }
  function fullpath(p) {
    return indexNode.locate(p).path();
  }
  /**
   * Returns contents of the chapter as HTML string.
   */
  this.html = async function () {
    const elements = await read();
    return elements.map(toHTML).join("");
  };

  /**
   * Returns the chapter's archive path.
   */
  this.path = function () {
    return zipNode.path();
  };

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
      const item = findItem((i) => fullpath(i.$.href) == imagePath);
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
}

module.exports = { Chapter };
