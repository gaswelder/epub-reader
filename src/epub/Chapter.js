const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

module.exports = Chapter;

const isImage = ch => ch.name == "img" || ch.name == "image";

function Chapter(zipNode, root) {
  /**
   * Returns contents of the chapter as HTML string.
   */
  this.html = async function() {
    const elements = await read();
    return elements.map(toHTML).join("");
  };

  /**
   * Returns the chapter's archive path.
   */
  this.path = function() {
    return zipNode.path();
  };

  /**
   * Returns contents of the chapter as a list of elements.
   */
  async function read() {
    const str = await zipNode.data("string");
    const doc = new xmldoc.XmlDocument(str);
    await embedImages(doc, zipNode, root);

    const elements = [];
    const body = doc.childNamed("body");

    elements.push(...body.children);
    return elements;
  }
}

async function embedImages(doc, zipNode, root) {
  for (const image of xml.find(doc, isImage)) {
    let hrefAttr = "src";
    if (image.name == "image") {
      hrefAttr = "xlink:href";
    }
    const href = image.attr[hrefAttr];

    const imageNode = zipNode.locate(href);
    const img = root.image(imageNode.path());
    const { type } = img;
    const img64 = await img.data("base64");

    image.attr[hrefAttr] = dataURI(img64, type);
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
