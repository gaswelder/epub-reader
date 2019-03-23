const JSZip = require("jszip");
const path = require("path");
const xml2js = require("xml2js");
const xmldoc = require("xmldoc");

function urlHash(url) {
  if (!url) {
    return "#URL_WAS_MISSING";
  }
  return "#" + url.split("#")[1];
}

/**
 * NavPoint is a pointer to a chapter in the book.
 */
function NavPoint(title, src, children) {
  /**
   * Returns the pointer's title.
   */
  this.title = function() {
    return title;
  };

  /**
   * Returns the pointer's subsections, also pointers.
   */
  this.children = function() {
    return children;
  };

  this.href = function() {
    return urlHash(src);
  };
}

function Book(zip, data, indexPath) {
  this.convert = function() {
    return convert(zip, data, indexPath);
  };

  /**
   * Returns the books table of contents
   * as a list of navigation pointer objects.
   */
  this.toc = async function() {
    function parsePoints(root) {
      return root.map(function(p) {
        const title = p.navLabel[0].text[0];
        const src = p.content[0].$.src;
        const children = p.navPoint ? parsePoints(p.navPoint) : [];
        return new NavPoint(title, src, children);
      });
    }

    const xml = await parseXML(await zip.file("toc.ncx").async("string"));
    return parsePoints(xml.ncx.navMap[0].navPoint);
  };

  /**
   * Returns the book's chapters as an array.
   */
  this.chapters = async function() {
    const cpaths = getChapterPaths(data);
    return cpaths.map(cpath => new Chapter(zip, data, indexPath, cpath));
  };
}

Book.load = async function(src) {
  const zip = await new JSZip().loadAsync(src);
  const indexPath = await getIndexPath(zip);
  const data = await parseXML(await zip.file(indexPath).async("string"));
  return new Book(zip, data, indexPath);
};

exports.Book = Book;

function Chapter(zip, data, indexPath, chapterPath) {
  this.title = function() {
    return chapterPath;
  };

  this.render = async function() {
    const elements = await processChapter(zip, indexPath, data, chapterPath);
    const body = {
      name: "body",
      attr: {},
      children: elements
    };
    return (
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
      toHTML(body) +
      "</html>"
    );
  };
}

async function convert(zip, data, indexPath) {
  const cpaths = getChapterPaths(data);
  let elements = [];
  for (const chapterPath of cpaths) {
    elements = elements.concat(
      await processChapter(zip, indexPath, data, chapterPath)
    );
  }

  const body = {
    name: "body",
    attr: {},
    children: elements
  };

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    toHTML(body) +
    "</html>"
  );
}

async function processChapter(zip, indexPath, data, chapterPath) {
  const str = await zip.file(zipPath(indexPath, chapterPath)).async("string");
  const doc = new xmldoc.XmlDocument(str);

  const isImage = ch => ch.name == "img" || ch.name == "image";

  for (const image of find(doc, isImage)) {
    let hrefAttr = "src";
    if (image.name == "image") {
      hrefAttr = "xlink:href";
    }
    const href = image.attr[hrefAttr];
    const imagePath = path.join(path.dirname(chapterPath), href);
    const { type } = getImageItem(data, imagePath);
    const img64 = await zip.file(imagePath).async("base64");
    image.attr[hrefAttr] = dataURI(img64, type);
  }

  for (const a of find(doc, ch => ch.name == "a")) {
    a.attr.href = urlHash(a.attr.href);
  }

  return doc.childNamed("body").children;
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

function zipPath(indexPath, href) {
  const dir = path.dirname(indexPath);
  if (dir == ".") {
    return href;
  }
  return dir + "/" + href;
}

function getChapterPaths(data) {
  const hrefs = {};
  data.package.manifest[0].item.forEach(function(item) {
    const { id, href } = item.$;
    hrefs[id] = href;
  });
  return data.package.spine[0].itemref.map(ref => hrefs[ref.$["idref"]]);
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

function find(element, match) {
  const result = [];

  for (const child of element.children) {
    if (match(child)) {
      result.push(child);
    }
    if (child.children) {
      result.push(...find(child, match));
    }
  }
  return result;
}

function toHTML(element) {
  if ("text" in element) {
    return escape(element.text);
  }

  const name = element.name;
  let s = `<${name}`;
  for (var k in element.attr) {
    s += ` ${k}="${element.attr[k]}"`;
  }
  s += ">";
  s += element.children.map(toHTML).join("");
  s += `</${name}>`;
  return s;
}

// escape escapes the given plain text string for safe use in HTML code.
function escape(str) {
  return str
    .replace("&", "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}

async function getIndexPath(zip) {
  const container = await zip.file("META-INF/container.xml").async("string");
  const containerData = await parseXML(container);
  const rootFile = containerData.container.rootfiles[0].rootfile[0];
  if (rootFile.$["media-type"] != "application/oebps-package+xml") {
    throw new Error(
      "Expected 'application/oebps-package+xml, got " + rootFile.$["media-type"]
    );
  }

  return rootFile.$["full-path"];
}
