const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

function Image(manifestItem, zipNode) {
  this.type = manifestItem.$["media-type"];
  this.data = zipNode.data.bind(zipNode);
  this.buffer = () => this.data("nodebuffer");
}

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
      const img = new Image(item, indexNode.locate(item.$.href));
      const { type } = img;
      const img64 = await img.data("base64");
      image.attr[hrefAttr] = dataURI(img64, type);
    }
    const elements = [];
    const body = doc.childNamed("body");
    elements.push(...body.children);
    return elements;
  }
}

/**
 * Returns data URI for a file.
 *
 * @param {string} data base-64 encoded file contents
 * @param {string} type MIME type
 */
function dataURI(data, type) {
  return `data:${type};base64,${data}`;
}

module.exports = { Image, Chapter };
