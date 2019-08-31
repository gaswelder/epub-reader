const xml2js = require("xml2js");

module.exports = Ncx;

function Ncx(manifest) {
  this.list = async function() {
    const tocData = await parseXML(
      await manifest
        .node()
        .locate("toc.ncx")
        .data("string")
    );
    return parsePoints(ns(tocData.ncx.navMap[0]).navPoint);
  };
}

function parsePoints(root) {
  return root.map(function(p) {
    const title = p.navLabel[0].text[0];
    const src = p.content[0].$.src;
    const children = p.navPoint ? parsePoints(p.navPoint) : [];
    return {
      title: () => title,
      children: () => children,
      href: () => src
    };
  });
}

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

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}
