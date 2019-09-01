window.initSidebar = function(bookProxy, container, toc, file) {
  /**
   * Show/hide the menu when the toggle button is pressed.
   */
  container
    .querySelector("[data-toggle]")
    .addEventListener("click", toggleMenu);

  /**
   * Hide the menu when a chapter is selected from it.
   */
  toc.addEventListener("click", function(event) {
    if (event.target.tagName.toLowerCase() == "a") {
      closeMenu();
    }
  });

  /**
   * Hide the menu when a new book file is chosen.
   */
  file.addEventListener("change", function() {
    closeMenu();
  });

  /**
   * Refresh the table of contents when the book is loaded.
   */
  bookProxy.onChange(renderTOC);

  function closeMenu() {
    container.classList.remove("open");
  }

  function toggleMenu() {
    container.classList.toggle("open");
  }

  async function renderTOC() {
    toc.innerHTML = makeTOC(await bookProxy.get().toc());
  }

  function makeTOC(chapters) {
    let s = "<ol>";
    for (const c of chapters) {
      s += `<li><a href="#${c.path()}">` + c.title() + "</a>";
      if (c.children().length > 0) {
        s += makeTOC(c.children());
      }
      s += "</li>";
    }
    s += "</ol>";
    return s;
  }
};
