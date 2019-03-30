const assert = require("assert");
const fs = require("fs");
const { Book } = require("./book");
const filters = require("./src/filters");

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

async function testFilters() {
  const body = {
    name: "body",
    children: [
      {
        name: "svg",
        attr: {
          height: "100%"
        },
        children: [
          {
            name: "img",
            attr: {
              style: "border: 1px; height: 100%; margin: 1em;"
            }
          }
        ]
      }
    ]
  };

  filters.apply(body);

  assert.equal(
    body.children[0].children[0].attr.style,
    "border: 1px; margin: 1em;"
  );

  assert.equal(body.children[0].name, "svg");
  assert.equal(body.children[0].attr.height, undefined);
}

async function main() {
  testFilters();

  await progress("jeff");

  const samples = [
    ["nov", 893],
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

async function progress(name) {
  const src = fs.readFileSync(`samples/${name}.epub`);
  const book = await Book.load(src);

  const states = [];
  book.onConvertProgress(function(n) {
    states.push(n);
  });

  await book.convert();
  console.log(states);
  assert.ok(states.length > 1);
}

main();
