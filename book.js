const JSZip = require("jszip");
const xml2js = require("xml2js");
const Manifest = require("./epub/Manifest");
const ZipNode = require("./epub/ZipNode");
const _Book = require("./epub/Book");
const Pager = require("./epub/Pager");

function Book(zip, data, indexPath, filter) {
  const indexNode = new ZipNode(zip, indexPath);
  const manifest = new Manifest(indexNode, data);

  const _book = new _Book(manifest);
  this.toc = _book.toc.bind(_book);
  this.cover = _book.cover.bind(_book);

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
  return new Book(zip, data, indexPath, filter);
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
