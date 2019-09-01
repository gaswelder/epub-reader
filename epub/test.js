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

function checkBook(book, title) {
  describe("book: " + title, function() {
    it("title", function() {
      const title = book.title();
      assert.equal(typeof title, "string", "title is not a string");
      assert.ok(title, "empty title");
    });

    it("cover", async function() {
      const cover = await book.cover();
      assert.ok(cover.type == "image/jpeg" || cover.type == "image/png");
    });

    it("chapters", async function() {
      const chapters = book.chapters();
      assert.ok(Array.isArray(chapters), "chapters is not an array");
      assert.ok(chapters.length > 0, "no chapters");

      for (const c of chapters) {
        const html = await c.html();
        assert.equal(typeof html, "string", "chapter.html() is not a string");
      }
    });

    it("returns the stylesheet", async function() {
      const css = await book.stylesheet();
      assert.ok(css.length > 0);
    });
  });
}

async function checkTOC(book) {
  function TOC(toc, indent = "  ") {
    let s = "";
    for (const t of toc) {
      s += indent + t.title() + ` (${t.path()})` + "\n";
      if (t.children().length > 0) {
        s += TOC(t.children(), indent + indent);
      }
    }
    return s;
  }

  const toc = await book.toc();
  console.log(TOC(toc));
}

describe("epub", async function() {
  const samples = fs.readdirSync("samples/").filter(x => x.endsWith(".epub"));
  for (const name of samples) {
    const src = fs.readFileSync(`samples/${name}`);
    const book = await Book.load(src);
    checkTOC(book);
    checkBook(book, name);
  }
});
