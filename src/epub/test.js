const assert = require("assert");
const fs = require("fs");
const Book = require("./Book.js");

init();
async function init() {
  const samples = fs.readdirSync("samples/").filter(x => x.endsWith(".epub"));
  const books = await Promise.all(
    samples.map(name => Book.load(fs.readFileSync(`samples/${name}`)))
  );

  samples.forEach(function(name, i) {
    describe("book: " + name, function() {
      const book = books[i];
      it("title", function() {
        const title = book.title();
        assert.equal(typeof title, "string", "title is not a string");
        assert.ok(title, "empty title");
      });

      it("language", function() {
        const lang = book.language();
        assert.equal(typeof lang, "string");
        assert.ok(lang);
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

      it("toc", async function() {
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
        TOC(toc);
      });
    });
  });
  run();
}
