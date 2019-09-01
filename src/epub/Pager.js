const toHTML = require("./html");
const pages = require("./pages");
const xml = require("./xml");

module.exports = Pager;

function Pager(book) {
  this.all = async function() {
    const body = await allElements();
    return pages.split(body.children).map(toHTML);
  };

  let onprogress = null;

  this.onConvertProgress = function(func) {
    onprogress = func;
  };

  function report(i, n) {
    if (!onprogress) return;
    onprogress(i / n);
  }

  async function allElements() {
    const elements = [];

    report(0, 1);

    const chh = await book._chapters();
    let i = 0;
    for (const chapter of chh) {
      const chapterElements = await chapter._convert();
      elements.push(...chapterElements);
      i++;
      report(i, chh.length);
    }

    const body = xml.wrap("body", elements);
    return body;
  }
}
