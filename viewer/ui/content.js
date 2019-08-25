window.centralContent = (function() {
  return centralContent;
  function centralContent(epub, viewer, input, text, bookProxy) {
    const openButton = document.createElement("button");
    openButton.innerHTML = "Open";
    openButton.addEventListener("click", function() {
      input.click();
    });
    if (input.files.length == 0) {
      text.appendChild(openButton);
    }

    const loadingStatus = document.createElement("p");
    const loader = document.createElement("progress");
    loader.max = 100;

    input.addEventListener("change", function() {
      loadBook();
    });

    loadBook();

    async function loadBook() {
      const data = input.files[0];
      if (!data) {
        return;
      }

      openButton.remove();

      loader.max = 100;
      text.appendChild(loadingStatus);
      text.appendChild(loader);

      // No need in FileReader, the underlying library takes care of it.
      const book = await epub.load(data, viewer.filters.apply);
      bookProxy.set(book);

      const pager = book.pager();
      pager.onConvertProgress(function(progress) {
        const val = Math.round(progress * 100);
        loader.value = Math.round(val);
        loadingStatus.innerHTML = `Loading ${input.files[0].name}: ${val}%`;
      });

      text.lang = "en";

      const pages = await pager.all();
      const css = await book.stylesheet();
      text.innerHTML =
        `<style>${css}</style>` +
        pages
          .map(function(page, index) {
            return pageHTML(page, index + 1);
          })
          .join("");
      makeHyphens(text);
    }

    function pageHTML(page, number) {
      return `<div class="pagenumber">${number}</div>` + page;
    }

    function makeHyphens(root) {
      if (hyphensSupported()) {
        return;
      }
      for (const node of root.querySelectorAll(
        "p, span, b, strong, em, i, blockquote"
      )) {
        for (const ch of node.childNodes) {
          if (ch.nodeType != 3) {
            continue;
          }
          ch.textContent = viewer.hyphenate(ch.textContent);
        }
      }
    }

    function hyphensSupported() {
      return (
        navigator.userAgent.indexOf("Firefox") > 0 &&
        navigator.userAgent.indexOf("Chrome") < 0
      );
    }
  }
})();
