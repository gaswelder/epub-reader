const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

module.exports = Manifest;

function Manifest(indexNode, manifest_) {
  function findItem(condition) {
    return manifest_.item.find(condition);
  }

  this.image = function (path) {
    const item = findItem((i) => fullpath(i.$.href) == path);
    if (!item) {
      throw new Error("couldn't find image " + path);
    }
    return new Image(item, indexNode.locate(item.$.href));
  };

  this.imageById = function (id) {
    const item = manifest_.item.find((i) => i.$.id == id);
    return new Image(item, indexNode.locate(item.$.href));
  };

  const _this = this;

  this.chapterById = function (id) {
    const item = manifest_.item.find((i) => i.$.id == id);
    return new Chapter(indexNode.locate(item.$.href), _this);
  };

  this.stylesheets = function () {
    return manifest_.item
      .filter((i) => i.$["media-type"] == "text/css")
      .map((i) => indexNode.locate(i.$.href));
  };

  function fullpath(p) {
    return indexNode.locate(p).path();
  }
}

function Image(manifestItem, zipNode) {
  this.type = manifestItem.$["media-type"];
  this.data = zipNode.data.bind(zipNode);
  this.buffer = () => this.data("nodebuffer");
}

const isImage = (ch) => ch.name == "img" || ch.name == "image";

function Chapter(zipNode, manifest) {
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
    await embedImages(doc, zipNode, manifest);

    const elements = [];
    const body = doc.childNamed("body");

    elements.push(...body.children);
    return elements;
  }
}

async function embedImages(doc, zipNode, manifest) {
  for (const image of xml.find(doc, isImage)) {
    let hrefAttr = "src";
    if (image.name == "image") {
      hrefAttr = "xlink:href";
    }
    const href = image.attr[hrefAttr];

    const imageNode = zipNode.locate(href);
    const img = manifest.image(imageNode.path());
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
