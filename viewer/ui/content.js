window.centralContent = function(epub, viewer, input, text, bookProxy) {
  initCentralButton(text, input);

  const loadingStatus = document.createElement("p");
  const loader = document.createElement("progress");
  loader.max = 100;

  /**
   * When a new file is selected, clear the main area and
   * load the selected book.
   */
  input.addEventListener("change", function() {
    text.innerHTML = "";
    loadBook();
  });

  loadBook();

  async function loadBook() {
    const data = input.files[0];
    if (!data) {
      return;
    }

    loader.max = 100;
    text.appendChild(loadingStatus);
    text.appendChild(loader);

    // No need in FileReader, the underlying library takes care of it.
    const book = await epub.load(data, viewer.filters.apply);
    bookProxy.set(book);

    const chapters = book.chapters();
    const n = chapters.length;
    const chaptersHTML = [];

    function setProgress(i) {
      const val = Math.round((i / n) * 100);
      loader.value = Math.round(val);
      loadingStatus.innerHTML = `Loading ${input.files[0].name}: ${val}%`;
    }

    for (let i = 0; i < n; i++) {
      setProgress(i);
      const c = chapters[i];
      let html = await c.html();
      html = html.replace(/id="/g, `id="${c.path()}#`);
      html = `<a id="${c.path()}"></a>` + html;

      chaptersHTML.push(html);
      setProgress(i + 1);
    }

    text.lang = book.language();

    const css = await book.stylesheet();
    text.innerHTML = `<style>${css}</style>` + chaptersHTML.join("");
    makeHyphens(text);
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
};

function initCentralButton(text, input) {
  const openButton = document.createElement("button");
  openButton.innerHTML = "Open";
  openButton.addEventListener("click", function() {
    input.click();
  });
  if (input.files.length == 0) {
    text.appendChild(openButton);
  }
  input.addEventListener("change", function() {
    openButton.remove();
  });
}
