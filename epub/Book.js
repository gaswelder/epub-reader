module.exports = Book;

const NavPoint = require("./NavPoint");
const xml2js = require("xml2js");

function Book(manifest) {
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
}

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}
