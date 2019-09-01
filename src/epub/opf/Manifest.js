const Image = require("./Image");
const Chapter = require("../Chapter");

module.exports = Manifest;

function Manifest(node, manifest_) {
  this.image = function(path) {
    const item = findItem(i => fullpath(i.$.href) == path);
    if (!item) {
      throw new Error("couldn't find image " + path);
    }
    return new Image(item, node.locate(item.$.href));
  };

  this.imageById = function(id) {
    const item = manifest_.item.find(i => i.$.id == id);
    return new Image(item, node.locate(item.$.href));
  };

  const _this = this;

  this.chapterById = function(id) {
    const item = manifest_.item.find(i => i.$.id == id);
    return new Chapter(node.locate(item.$.href), _this);
  };

  this.stylesheets = function() {
    return manifest_.item
      .filter(i => i.$["media-type"] == "text/css")
      .map(i => node.locate(i.$.href));
  };

  function findItem(condition) {
    return manifest_.item.find(condition);
  }

  function fullpath(p) {
    return node.locate(p).path();
  }
}
