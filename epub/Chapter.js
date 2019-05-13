const xml = require("../book/xml");
const path = require("path");

module.exports = Chapter;

function Chapter(path, xmldoc, indexPath, data, zip) {
  this._convert = async function() {
    await embedImages(xmldoc, path, indexPath, data, zip);

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
      attr: { id: chapterAnchorID(path) },
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

async function embedImages(root, chapterPath, indexPath, data, zip) {
  const isImage = ch => ch.name == "img" || ch.name == "image";

  for (const image of xml.find(root, isImage)) {
    let hrefAttr = "src";
    if (image.name == "image") {
      hrefAttr = "xlink:href";
    }
    const href = image.attr[hrefAttr];
    const imagePath = path.join(path.dirname(chapterPath), href);
    const { type } = getImageItem(data, imagePath);
    const img64 = await zip.file(zipPath(indexPath, imagePath)).async("base64");
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

function getImageItem(data, href) {
  const item = data.package.manifest[0].item.find(item => item.$.href == href);
  if (!item) {
    throw new Error("couldn't find image " + href);
  }
  return {
    href,
    type: item.$["media-type"]
  };
}

/**
 * Resolves item paths in index to corresponding paths in archive.
 *
 * Index path (rootfile, OPF) lists item paths relative to itself,
 * but it itself can be anywhere in the zip file.
 *
 * @param {string} indexPath Archive path of the index (for example, "OEBPS/contents.opf")
 * @param {string} href Index href of an item (for example, "images/001.jpg")
 * @returns {string}
 */
function zipPath(indexPath, href) {
  const dir = path.dirname(indexPath);
  if (dir == ".") {
    return href;
  }
  return dir + "/" + href;
}
