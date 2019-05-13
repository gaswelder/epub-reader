const xml = require("../book/xml");

module.exports = Chapter;

const isImage = ch => ch.name == "img" || ch.name == "image";

function Chapter(chapterPath, xmldoc, zipNode, manifest) {
  this._embedImages = async function() {
    for (const image of xml.find(xmldoc, isImage)) {
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
  };

  this._convert = async function() {
    await this._embedImages();

    for (const a of xml.find(xmldoc, ch => ch.name == "a")) {
      a.attr.href = urlHash(a.attr.href);
    }

    const elements = [];

    // If the body has an ID (a navigation target), inject an anchor with that ID.
    const body = xmldoc.childNamed("body");
    if (body.attr.id) {
      elements.push({
        name: "a",
        attr: {
          id: body.attr.id
        },
        children: []
      });
    }

    // Inject an anchor for the start of the file.
    elements.push({
      name: "a",
      attr: { id: chapterAnchorID(chapterPath) },
      children: []
    });
    elements.push(...body.children);
    return elements;
  };
}

function urlHash(url) {
  if (!url) {
    return "#URL_WAS_MISSING";
  }
  const hash = url.split("#")[1];
  return hash ? "#" + hash : "";
}

/**
 * Generates an anchor name for a chapter href.
 * @param {string} src Chapter href, like "text/001.html"
 */
function chapterAnchorID(src) {
  return src.replace(/[^\w]/g, "-");
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
