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
  const samples = [["jeff", 12], ["go", 767], ["math", 126], ["swim", 260]];

  for (const sample of samples) {
    const [name, imagesNumber] = sample;
    console.log(name);
    const src = fs.readFileSync(`samples/${name}.epub`);
    const book = await Book.load(src);
    const html = await book.convert();
    fs.writeFileSync(`t-${name}.html`, html);
    assert.equal(html.match(/<img /g).length, imagesNumber);
  }
}

main();
