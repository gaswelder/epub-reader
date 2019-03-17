const JSZip = require("jszip");
const { dirname } = require("path");
const xml2js = require("xml2js");
const xmldoc = require("xmldoc");

exports.convert = async function convert(src) {
  const zip = await new JSZip().loadAsync(src);
  const ch = await chapters(zip);

  // Construct a single list of elements representing the whole content
  var elements = [];
  for (let xml of ch) {
    var doc = new xmldoc.XmlDocument(xml);
    elements = elements.concat(doc.childNamed("body").children);
  }

  // Replace image paths
  var body = {
    name: "body",
    attr: {},
    children: elements
  };
  for (let image of findImages(body)) {
    if (image.attr.src.startsWith("../")) {
      image.attr.src = image.attr.src.substr("../".length);
    }
  }

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    toHTML(body) +
    "</html>"
  );
};

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

async function chapters(zip) {
  // Create a map of chapters.
  // read package/manifest
  // 	while read ./item
  // 		read 'id', 'href'
  // 		$parts[id] = href
  const hrefs = {};
  const data = await index(zip);
  data.package.manifest[0].item.forEach(function(item) {
    var { id, href } = item.$;
    hrefs[id] = href;
  });

  const parts = data.package.spine[0].itemref.map(ref => hrefs[ref.$["idref"]]);
  const all = await Promise.all(parts.map(href => chapter(zip, href)));
  return all;
}

// Returns contents of a chapter.
async function chapter(zip, href) {
  const path = await indexPath(zip);
  const dir = dirname(path);
  if (dir != ".") {
    href = dir + "/" + href;
  }
  return zip.file(href).async("string");
}

async function index(zip) {
  const contentPath = await indexPath(zip);
  const src = await zip.file(contentPath).async("string");
  const data = await parseXML(src);
  return data;
}

async function indexPath(zip) {
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
