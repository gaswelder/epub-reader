const xml = require("./xml");
const xmldoc = require("xmldoc");
const toHTML = require("./html");

module.exports = Root;

function Root(node, data) {
  // The manifest is the list of all files.
  const manifest = new Manifest(node, data.package.manifest[0]);

  this.ncx = manifest.ncx;
  this.stylesheets = manifest.stylesheets;

  this.cover = function () {
    if (!data.package.metadata[0].meta) return null;
    const meta = data.package.metadata[0].meta.find((m) => m.$.name == "cover");
    if (!meta) return null;
    const id = meta.$.content;
    return manifest.imageById(id);
  };

  this.chapters = function () {
    const refs = data.package.spine[0].itemref;
    return refs.map(function (ref) {
      const id = ref.$.idref;
      return manifest.chapterById(id);
    });
  };

  /**
   * Returns the book's title.
   */
  this.title = function () {
    const meta = data.package.metadata[0];
    if (!meta["dc:title"]) {
      return null;
    }
    return getString(meta["dc:title"][0]);
  };

  /**
   * Returns the book's language.
   */
  this.language = function () {
    return getString(data.package.metadata[0]["dc:language"][0]);
  };
}

function getString(node) {
  if (typeof node == "object") {
    return node._;
  } else {
    return node;
  }
}

function Manifest(node, manifest_) {
  function findItem(condition) {
    return manifest_.item.find(condition);
  }

  this.ncx = function () {
    const item = findItem(
      (i) => i.$["media-type"] == "application/x-dtbncx+xml"
    );
    if (!item) {
      throw new Error("couldn't find NCX item in the manifest");
    }
    return new Ncx(node.locate(item.$.href));
  };

  this.image = function (path) {
    const item = findItem((i) => fullpath(i.$.href) == path);
    if (!item) {
      throw new Error("couldn't find image " + path);
    }
    return new Image(item, node.locate(item.$.href));
  };

  this.imageById = function (id) {
    const item = manifest_.item.find((i) => i.$.id == id);
    return new Image(item, node.locate(item.$.href));
  };

  const _this = this;

  this.chapterById = function (id) {
    const item = manifest_.item.find((i) => i.$.id == id);
    return new Chapter(node.locate(item.$.href), _this);
  };

  this.stylesheets = function () {
    return manifest_.item
      .filter((i) => i.$["media-type"] == "text/css")
      .map((i) => node.locate(i.$.href));
  };

  function fullpath(p) {
    return node.locate(p).path();
  }
}

const xml2js = require("xml2js");

function Ncx(zipNode) {
  this.list = async function () {
    const tocData = await parseXML(await zipNode.data("string"));
    return parsePoints(ns(tocData.ncx.navMap[0]).navPoint);
  };

  function parsePoints(root) {
    return root.map(function (p) {
      const title = p.navLabel[0].text[0];
      const src = p.content[0].$.src;
      const children = p.navPoint ? parsePoints(p.navPoint) : [];

      return {
        title: () => title,
        children: () => children,
        /**
         * Returns the target chapter's archive path.
         */
        path: () => zipNode.locate(src).path(),
      };
    });
  }
}

function ns(data) {
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

function parseXML(str, options = {}) {
  return new Promise(function (ok) {
    xml2js.parseString(str, options, function (err, data) {
      if (err) throw err;
      ok(data);
    });
  });
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
