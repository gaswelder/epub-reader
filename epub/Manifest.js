module.exports = Manifest;

function Manifest(node, data) {
  function fullpath(p) {
    return node.locate(p).path();
  }

  this.image = function(path) {
    const item = data.package.manifest[0].item.find(
      item => fullpath(item.$.href) == path
    );
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

  this.node = () => node;
}

function Image(manifestItem, zipNode) {
  this.type = manifestItem.$["media-type"];
  this.data = zipNode.data.bind(zipNode);
  this.buffer = () => this.data("nodebuffer");
}
