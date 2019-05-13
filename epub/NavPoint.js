module.exports = NavPoint;

/**
 * NavPoint is a pointer to a chapter in the book.
 */
function NavPoint(title, src, children) {
  /**
   * Returns the pointer's title.
   */
  this.title = function() {
    return title;
  };

  /**
   * Returns the pointer's subsections, also pointers.
   */
  this.children = function() {
    return children;
  };

  this.href = function() {
    // If the point's href has a hash, assume it's unique and return it.
    // If the href is without a hash, assume it's a start-of-file reference
    // and return the corresponding anchor.
    return urlHash(src) || "#" + chapterAnchorID(src);
  };
}

function urlHash(url) {
  if (!url) {
    return "#URL_WAS_MISSING";
  }
  const hash = url.split("#")[1];
  return hash ? "#" + hash : "";
}

/**
 * Generates an anchor name for a chapter href.
 * @param {string} src Chapter href, like "text/001.html"
 */
function chapterAnchorID(src) {
  return src.replace(/[^\w]/g, "-");
}
