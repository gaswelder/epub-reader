const JSZip = require("jszip");
const xml2js = require("xml2js");
const Manifest = require("./Manifest");
const ZipNode = require("./ZipNode");
const Pager = require("./Pager");
const Ncx = require("./Ncx");

module.exports = Book;

function Book(manifest, filter) {
  const ncx = new Ncx(manifest);

  this.cover = function() {
    return manifest.cover();
  };

  /**
   * Returns the book's title.
   */
  this.title = manifest.title;

  /**
   * Returns the book's table of contents
   * as a list of navigation pointer objects.
   */
  this.toc = ncx.list;

  this._chapters = function() {
    return manifest.chapters(filter);
  };

  this.pager = function() {
    return new Pager(this);
  };

  this.stylesheet = async function() {
    const nodes = manifest.stylesheets();
    let css = "";
    for (const node of nodes) {
      css += await node.data("string");
      css += "\n";
    }
    return css;
  };
}

/**
 * Reads the given source and returns a book object.
 * The source is whatever can be read by JSZip.
 */
Book.load = async function(src, filter) {
  const zip = await new JSZip().loadAsync(src);
  const manifest = await getManifest(zip);
  return new Book(manifest, filter);
};

/**
 * Reads the given zip and returns a manifest object.
 *
 * @param {JSZip} zip
 * @returns {Manifest}
 */
async function getManifest(zip) {
  const indexPath = await rootFilePath(zip);
  const indexNode = new ZipNode(zip, indexPath);
  const manifestData = await parseXML(
    await zip.file(indexPath).async("string")
  );
  return new Manifest(indexNode, manifestData);
}

/**
 * Returns the path to the manifest file.
 */
async function rootFilePath(zip) {
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

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}
