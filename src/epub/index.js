const JSZip = require("jszip");
const xml2js = require("xml2js");
const Manifest = require("./opf/Root");
const ZipNode = require("./ZipNode");
const Book = require("./Book");

module.exports = Book;

/**
 * Reads the given source and returns a book object.
 * The source is whatever can be read by JSZip.
 */
Book.load = async function(src) {
  const zip = await new JSZip().loadAsync(src);
  const manifest = await getManifest(zip);
  return new Book(manifest);
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
