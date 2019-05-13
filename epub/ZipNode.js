const path = require("path");

module.exports = ZipNode;

function ZipNode(zip, nodePath) {
  this.locate = function(href) {
    const targetPath = path.join(path.dirname(nodePath), href);
    return new ZipNode(zip, targetPath);
  };
  this.data = function(type = "string") {
    return zip.file(nodePath).async(type);
  };
  this.path = function() {
    return nodePath;
  };
}
