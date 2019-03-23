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

async function content(book, imagesNumber) {
  const html = await book.convert();
  assert.equal(html.match(/<img /g).length, imagesNumber);
}

async function main() {
  const samples = [
    ["comp", 28],
    ["jeff", 12],
    ["go", 767],
    ["math", 126],
    ["swim", 260]
  ];

  for (const sample of samples) {
    const [name, imagesNumber] = sample;
    console.log(name);
    const src = fs.readFileSync(`samples/${name}.epub`);
    const book = await Book.load(src);
    await toc(book);
    await content(book, imagesNumber);
  }
}

main();
