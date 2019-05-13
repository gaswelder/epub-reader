const JSZip = require("jszip");
const path = require("path");
const xml2js = require("xml2js");
const xmldoc = require("xmldoc");
const filters = require("./src/filters");
const xml = require("./book/xml");
const pages = require("./book/pages");
const NavPoint = require("./epub/NavPoint");
const Chapter = require("./epub/Chapter");

function Book(zip, data, indexPath) {
  let onprogress = null;

  const hrefs = {};
  data.package.manifest[0].item.forEach(function(item) {
    const { id, href } = item.$;
    hrefs[id] = href;
  });
  const cpaths = data.package.spine[0].itemref.map(
    ref => hrefs[ref.$["idref"]]
  );

  this.onConvertProgress = function(func) {
    onprogress = func;
  };

  function report(i, n) {
    if (!onprogress) return;
    onprogress(i / n);
  }

  /**
   * Extracts all chapters.
   */
  async function chapters() {
    const list = [];
    for (const chapterPath of cpaths) {
      try {
        const str = await zip
          .file(zipPath(indexPath, chapterPath))
          .async("string");
        list.push(
          new Chapter(
            chapterPath,
            new xmldoc.XmlDocument(str),
            indexPath,
            data,
            zip
          )
        );
      } catch (e) {
        throw new Error(chapterPath + ": " + e.toString());
      }
    }
    return list;
  }

  this.cover = async function() {
    if (!data.package.metadata[0].meta) return null;
    const meta = data.package.metadata[0].meta.find(m => m.$.name == "cover");
    if (!meta) return null;
    const id = meta.$.content;
    const item = data.package.manifest[0].item.find(i => i.$.id == id);
    const path = item.$.href;
    return {
      type: item.$["media-type"],
      buffer() {
        return zip.file(zipPath(indexPath, path)).async("nodebuffer");
      }
    };
  };

  async function allElements() {
    const elements = [];

    report(0, 1);

    const chh = await chapters();
    let i = 0;
    for (const chapter of chh) {
      const chapterElements = await chapter._convert();
      elements.push(...chapterElements);
      i++;
      report(i, chh.length);
    }

    const body = xml.wrap("body", elements);
    filters.apply(body);
    return body;
  }

  this.convert = async function() {
    const body = await allElements();
    return (
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
      toHTML(body) +
      "</html>"
    );
  };

  this.pages = async function() {
    const body = await allElements();
    return pages.split(body.children).map(toHTML);
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
      await zip.file(zipPath(indexPath, "toc.ncx")).async("string")
    );
    return parsePoints(ns(xml.ncx.navMap[0]).navPoint);
  };
}

Book.load = async function(src) {
  const zip = await new JSZip().loadAsync(src);
  const indexPath = await getIndexPath(zip);
  const data = await parseXML(await zip.file(indexPath).async("string"));
  return new Book(zip, data, indexPath);
};

exports.Book = Book;

/**
 * Resolves item paths in index to corresponding paths in archive.
 *
 * Index path (rootfile, OPF) lists item paths relative to itself,
 * but it itself can be anywhere in the zip file.
 *
 * @param {string} indexPath Archive path of the index (for example, "OEBPS/contents.opf")
 * @param {string} href Index href of an item (for example, "images/001.jpg")
 * @returns {string}
 */
function zipPath(indexPath, href) {
  const dir = path.dirname(indexPath);
  if (dir == ".") {
    return href;
  }
  return dir + "/" + href;
}

function toHTML(element) {
  if ("text" in element) {
    return escape(element.text);
  }

  if (element.comment) {
    return "";
  }

  const name = element.name;
  let s = `<${name}`;
  for (var k in element.attr) {
    s += ` ${k}="${element.attr[k]}"`;
  }
  s += ">";
  s += element.children.map(toHTML).join("");
  s += `</${name}>`;
  return s;
}

// escape escapes the given plain text string for safe use in HTML code.
function escape(str) {
  return str
    .replace("&", "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseXML(str, options = {}) {
  return new Promise(function(ok) {
    xml2js.parseString(str, options, function(err, data) {
      if (err) throw err;
      ok(data);
    });
  });
}

async function getIndexPath(zip) {
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
