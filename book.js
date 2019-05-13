const JSZip = require("jszip");
const xml2js = require("xml2js");
const xmldoc = require("xmldoc");
const Chapter = require("./epub/Chapter");
const Manifest = require("./epub/Manifest");
const ZipNode = require("./epub/ZipNode");
const _Book = require("./epub/Book");
const Pager = require("./epub/Pager");

function Book(zip, data, indexPath) {
  const hrefs = {};
  data.package.manifest[0].item.forEach(function(item) {
    const { id, href } = item.$;
    hrefs[id] = href;
  });
  const cpaths = data.package.spine[0].itemref.map(
    ref => hrefs[ref.$["idref"]]
  );

  const indexNode = new ZipNode(zip, indexPath);
  const manifest = new Manifest(indexNode, data);

  const _book = new _Book(manifest);
  this.toc = _book.toc.bind(_book);
  this.cover = _book.cover.bind(_book);

  /**
   * Extracts all chapters.
   */
  this._chapters = async function() {
    const list = [];
    for (const chapterPath of cpaths) {
      try {
        const node = indexNode.locate(chapterPath);
        const str = await node.data("string");
        list.push(
          new Chapter(chapterPath, new xmldoc.XmlDocument(str), node, manifest)
        );
      } catch (e) {
        throw new Error(chapterPath + ": " + e.toString());
      }
    }
    return list;
  };

  this.pager = function() {
    return new Pager(this);
  };
}

Book.load = async function(src) {
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
  return new Book(zip, data, indexPath);
};

exports.Book = Book;

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}
