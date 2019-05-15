const xml = require("../book/xml");
const xmldoc = require("xmldoc");

module.exports = Chapter;

const isImage = ch => ch.name == "img" || ch.name == "image";

function Chapter(zipNode, manifest, filter) {
  this._convert = async function() {
    const str = await zipNode.data("string");
    const doc = new xmldoc.XmlDocument(str);
    await embedImages(doc, zipNode, manifest);
    for (const a of xml.find(doc, ch => ch.name == "a")) {
      a.attr.href = urlHash(a.attr.href);
    }

    const elements = [];

    // If the body has an ID (a navigation target), inject an anchor with that ID.
    const body = doc.childNamed("body");
    if (body.attr.id) {
      elements.push({
        name: "a",
        attr: {
          id: body.attr.id
        },
        children: []
      });
    }

    if (filter) {
      filter(body);
    }

    elements.push(...body.children);
    return elements;
  };
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

function urlHash(url) {
  if (!url) {
    return "#URL_WAS_MISSING";
  }
  const hash = url.split("#")[1];
  return hash ? "#" + hash : "";
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
