const Manifest = require("./Manifest");

module.exports = Root;

function Root(node, data) {
  // The manifest is the list of all files.
  const manifest = new Manifest(node, data.package.manifest[0]);

  this.ncx = manifest.ncx;
  this.stylesheets = manifest.stylesheets;

  this.cover = function() {
    if (!data.package.metadata[0].meta) return null;
    const meta = data.package.metadata[0].meta.find(m => m.$.name == "cover");
    if (!meta) return null;
    const id = meta.$.content;
    return manifest.imageById(id);
  };

  this.chapters = function() {
    const refs = data.package.spine[0].itemref;
    return refs.map(function(ref) {
      const id = ref.$.idref;
      return manifest.chapterById(id);
    });
  };

  /**
   * Returns the book's title.
   */
  this.title = function() {
    const meta = data.package.metadata[0];
    if (!meta["dc:title"]) {
      return null;
    }
    return getString(meta["dc:title"][0]);
  };

  /**
   * Returns the book's language.
   */
  this.language = function() {
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
