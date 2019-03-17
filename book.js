const JSZip = require("jszip");
const path = require("path");
const xml2js = require("xml2js");
const xmldoc = require("xmldoc");

exports.convert = async function convert(src) {
  const zip = await new JSZip().loadAsync(src);
  const indexPath = await getIndexPath(zip);
  const data = await parseXML(await zip.file(indexPath).async("string"));

  const cpaths = getChapterPaths(data);
  let elements = [];
  for (const chapterPath of cpaths) {
    const str = await zip.file(zipPath(indexPath, chapterPath)).async("string");
    const doc = new xmldoc.XmlDocument(str);

    for (const image of findImages(doc)) {
      const href = image.attr.src;
      const imagePath = path.join(path.dirname(chapterPath), href);
      const { type } = getImageItem(data, imagePath);
      const img64 = await zip.file(imagePath).async("base64");
      image.attr.src = dataURI(img64, type);
    }
    elements = elements.concat(doc.childNamed("body").children);
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
};

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

function* findImages(element) {
  for (let ch of element.children) {
    if (ch.name == "img") {
      yield ch;
      continue;
    }

    if (ch.children) {
      yield* findImages(ch);
    }
  }
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
