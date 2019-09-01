const Ncx = require("./opf/Ncx");

module.exports = Book;

function Book(manifest) {
  const ncx = new Ncx(manifest);

  this.cover = manifest.cover;

  /**
   * Returns the book's table of contents
   * as a list of navigation pointer objects.
   */
  this.toc = ncx.list;

  /**
   * Returns the book's title.
   */
  this.title = manifest.title;

  /**
   * Returns the book't language.
   */
  this.language = manifest.language;

  /**
   * Returns the list of the book's chapters.
   */
  this.chapters = manifest.chapters;

  this.stylesheet = async function() {
    const nodes = manifest.stylesheets();
    let css = "";
    for (const node of nodes) {
      css += await node.data("string");
      css += "\n";
    }
    return css;
  };
}
