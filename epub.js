const xmldoc = require("xmldoc");
const Book = require("./book");
const fs = require("fs");
const promisify = require("util").promisify;
const readFile = promisify(fs.readFile);

if (process.argv.length != 3) {
  process.stderr.write("Usage: node script {filename}\n");
  process.exit(1);
}

main(process.argv[2]);

async function main(bookPath) {
  const src = await readFile(bookPath);
  const book = new Book(src);
  const chapters = await book.chapters();

  // Read all chapters
  const all = await Promise.all(chapters.map(href => book.chapter(href)));

  // Construct a single list of elements representing the whole content
  var elements = [];
  for (let xml of all) {
    var doc = new xmldoc.XmlDocument(xml);
    elements = elements.concat(doc.childNamed("body").children);
  }

  // Replace image paths
  var body = {
    name: "body",
    attr: {},
    children: elements
  };
  for (let image of findImages(body)) {
    if (image.attr.src.startsWith("../")) {
      image.attr.src = image.attr.src.substr("../".length);
    }
  }

  var html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
    toHTML(body) +
    "</html>";
  process.stdout.write(html);
}

function* findImages(element) {
  for (let ch of element.children) {
    if (ch.name == "img") {
      yield ch;
      continue;
    }

    if (ch.children) {
      yield* findImages(ch);
    }
  }
}

function toHTML(element) {
  if ("text" in element) {
    return escape(element.text);
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
