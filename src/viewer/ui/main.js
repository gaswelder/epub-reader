window.main = function main() {
  const { epub, viewer, centralContent, initSidebar, initHeader } = window;

  const containers = {
    toc: document.querySelector("#toc"),
    text: document.querySelector("#main"),
    file: document.querySelector("#file"),
  };
  const menu = document.querySelector("#menu");
  const header = document.querySelector("#header");

  /**
   * The book that is currently loaded.
   */
  let book;

  const bookProxy = {
    listeners: [],
    get() {
      return book;
    },
    set(v) {
      book = v;
      this.listeners.forEach((fn) => fn(book));
    },
    onChange(fn) {
      this.listeners.push(fn);
    },
  };

  centralContent(epub, viewer, containers.file, containers.text, bookProxy);
  initSidebar(bookProxy, menu, containers.toc, containers.file);
  initHeader(header, bookProxy);

  containers.text.addEventListener("dblclick", function (event) {
    if (event.target.tagName.toLowerCase() !== "img") {
      return;
    }
    window.open(event.target.src);
  });
};
