module.exports = Manifest;

const Chapter = require("./Chapter");

function Manifest(node, data) {
  function fullpath(p) {
    return node.locate(p).path();
  }

  function findItem(condition) {
    return data.package.manifest[0].item.find(condition);
  }

  const items = {};
  data.package.manifest[0].item.forEach(function(item) {
    const { id } = item.$;
    items[id] = item;
  });

  this.image = function(path) {
    const item = findItem(i => fullpath(i.$.href) == path);
    if (!item) {
      throw new Error("couldn't find image " + path);
    }
    return new Image(item, node.locate(item.$.href));
  };

  this.cover = function() {
    if (!data.package.metadata[0].meta) return null;
    const meta = data.package.metadata[0].meta.find(m => m.$.name == "cover");
    if (!meta) return null;
    const id = meta.$.content;
    const item = data.package.manifest[0].item.find(i => i.$.id == id);
    return new Image(item, node.locate(item.$.href));
  };

  const _this = this;

  this.node = () => node;

  this.chapters = function() {
    const refs = data.package.spine[0].itemref;
    return refs.map(function(ref) {
      const id = ref.$.idref;
      const item = findItem(i => i.$.id == id);
      return new Chapter(node.locate(item.$.href), _this);
    });
  };

  this.stylesheets = function() {
    return data.package.manifest[0].item
      .filter(i => i.$["media-type"] == "text/css")
      .map(i => node.locate(i.$.href));
  };

  /**
   * Returns the book's title.
   */
  this.title = function() {
    const title = data.package.metadata[0]["dc:title"][0];
    if (typeof title == "object") {
      return title._;
    } else {
      return title;
    }
  };
}

function Image(manifestItem, zipNode) {
  this.type = manifestItem.$["media-type"];
  this.data = zipNode.data.bind(zipNode);
  this.buffer = () => this.data("nodebuffer");
}
