const JSZip = require("jszip");
const NavPoint = require("./NavPoint");
const xml2js = require("xml2js");
const Manifest = require("./Manifest");
const ZipNode = require("./ZipNode");
const Pager = require("./Pager");

module.exports = Book;

function Book(manifest, filter) {
  this.cover = function() {
    return manifest.cover();
  };

  /**
   * Returns the book's table of contents
   * as a list of navigation pointer objects.
   */
  this.toc = async function() {
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
        }
      });
    }

    function parsePoints(root) {
      return root.map(function(p) {
        const title = p.navLabel[0].text[0];
        const src = p.content[0].$.src;
        const children = p.navPoint ? parsePoints(p.navPoint) : [];
        return new NavPoint(title, src, children);
      });
    }

    const xml = await parseXML(
      await manifest
        .node()
        .locate("toc.ncx")
        .data("string")
    );
    return parsePoints(ns(xml.ncx.navMap[0]).navPoint);
  };

  this._chapters = function() {
    return manifest.chapters(filter);
  };

  this.pager = function() {
    return new Pager(this);
  };
}

Book.load = async function(src, filter) {
  const zip = await new JSZip().loadAsync(src);

  const container = await zip.file("META-INF/container.xml").async("string");
  const containerData = await parseXML(container);
  const rootFile = containerData.container.rootfiles[0].rootfile[0];
  if (rootFile.$["media-type"] != "application/oebps-package+xml") {
    throw new Error(
      "Expected 'application/oebps-package+xml, got " + rootFile.$["media-type"]
    );
  }

  const indexPath = rootFile.$["full-path"];
  const data = await parseXML(await zip.file(indexPath).async("string"));
  const indexNode = new ZipNode(zip, indexPath);
  const manifest = new Manifest(indexNode, data);

  return new Book(manifest, filter);
};

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}
