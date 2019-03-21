const assert = require("assert");
const fs = require("fs");
const { Book } = require("./book");

async function toc(book) {
  function TOC(toc, indent = "  ") {
    let s = "";
    for (const t of toc) {
      s += indent + t.title() + ` (${t.href()})` + "\n";
      if (t.children().length > 0) {
        s += TOC(t.children(), indent + indent);
      }
    }
    return s;
  }

  const toc = await book.toc();
  console.log(TOC(toc));
}

async function main() {
  const src = fs.readFileSync("samples/go.epub");
  const book = await Book.load(src);

  // toc(book);

  const html = await book.convert();
  assert.equal(html.match(/<img /g).length, 767);
}

main();
