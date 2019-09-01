const Ncx = require("./opf/Ncx");

module.exports = Book;

function Book(root) {
  const ncx = new Ncx(root.node().locate("toc.ncx"));

  this.cover = root.cover;

  /**
   * Returns the book's table of contents
   * as a list of navigation pointer objects.
   */
  this.toc = ncx.list;

  /**
   * Returns the book's title.
   */
  this.title = root.title;

  /**
   * Returns the book't language.
   */
  this.language = root.language;

  /**
   * Returns the list of the book's chapters.
   */
  this.chapters = root.chapters;

  this.stylesheet = async function() {
    const nodes = root.stylesheets();
    let css = "";
    for (const node of nodes) {
      css += await node.data("string");
      css += "\n";
    }
    return css;
  };
}
