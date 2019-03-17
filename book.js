const zip = require("jszip");
const { dirname } = require("path");
const xml2js = require("xml2js");

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

module.exports = class Book {
  constructor(src) {
    const z = new zip();
    this.zip = z.loadAsync(src);
  }

  async chapters() {
    return chapters(await this.zip);
  }
};

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
