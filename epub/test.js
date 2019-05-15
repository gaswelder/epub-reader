const assert = require("assert");
const fs = require("fs");
const Book = require("./Book.js");

const files = new Map();
function readfile(name) {
  if (!files.has(name)) {
    files.set(name, fs.readFileSync(`samples/${name}.epub`));
  }
  return files.get(name);
}

describe("content check", function() {
  const samples = [["comp", 28], ["jeff", 12], ["math", 126]];

  for (const [name, imagesNumber] of samples) {
    it(name, async function() {
      const src = readfile(name);
      const book = await Book.load(src);
      const html = (await book.pager().all()).join("");
      assert.equal(html.match(/<img /g).length, imagesNumber);
    });
  }
});

describe("epub", function() {
  it("reads covers", async function() {
    const src = fs.readFileSync("samples/jeff.epub");
    const book = await Book.load(src);
    assert.equal((await book.cover()).type, "image/jpeg");
  });

  it("splits to pages", async function() {
    const src = fs.readFileSync("samples/jeff.epub");
    const book = await Book.load(src);
    const pages = await book.pager().all();
    assert.ok(pages.length > 1);
  });

  it("has progress callback", async function() {
    const src = fs.readFileSync(`samples/jeff.epub`);
    const book = await Book.load(src);
    const pager = book.pager();

    const progressValues = [];
    pager.onConvertProgress(function(n) {
      progressValues.push(n);
    });

    await pager.all();
    assert.ok(progressValues.length > 1);
  });

  it("allows custom filters", async function() {
    let called = 0;
    function filter(tree) {
      called++;
      assert.equal(tree.name, "body");
      assert.ok(tree.children.length > 0);
    }
    const src = fs.readFileSync(`samples/jeff.epub`);
    const book = await Book.load(src, filter);
    await book.pager().all();
    assert.ok(called > 0);
  });

  it("returns the stylesheet", async function() {
    const src = fs.readFileSync(`samples/jeff.epub`);
    const book = await Book.load(src);
    const css = await book.stylesheet();
    assert.ok(css.length > 0);
  });
});

describe("toc", function() {
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

  it("toc", async function() {
    const src = readfile("jeff");
    const book = await Book.load(src);
    return toc(book);
  });
});
