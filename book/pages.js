const xml = require("./xml");

exports.measure = measure;
exports.split = split;

const LineWidth = 77;

/**
 * Estimates the number of pseudo-lines of the paragraph.
 */
function measure(e) {
  // Don't bother with anything that is not a paragraph,
  // assume it's zero size.
  if (!e.name) {
    return 0;
  }
  const textContainers = [
    "a",
    "p",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
  ];

  if (!textContainers.includes(e.name.toLowerCase())) {
    console.warn("skipping " + e.name);
    return 1;
  }
  const text = xml
    .find(e, n => n.text)
    .map(n => n.text)
    .join("");
  return Math.ceil(text.length / LineWidth);
}

function split(elements) {
  const pages = [];
  while (elements.length > 0) {
    pages.push(xml.wrap("div", getPage(elements)));
  }
  return pages;
}

function getPage(elements) {
  // Assume a page is 40 "lines", where "line" is an abstract, but
  // consistent measure. Add as many paragraphs as possible without
  // exceeding the size limit.

  // Start with all 40 lines empty.
  let free = 40;
  const page = [];

  while (free > 0 && elements.length > 0) {
    const size = measure(elements[0]);

    // Stop adding if the next paragraph does not fit in the remaining space.
    // Unless the page is empty.
    if (size > free && page.length > 0) {
      break;
    }

    page.push(elements.shift());
    free -= size;
  }
  return page;
}
