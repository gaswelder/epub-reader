<script>
  import Loader from "./loader.svelte";
  import { onMount } from "svelte";

  export let bookProxy;

  const { epub, viewer } = window;

  let loading = false;
  let loadProgress = 0;

  let content = "";

  let input = null;

  const centralContent = function() {
    input = document.querySelector("#file");
    const text = document.querySelector("#main");

    text.addEventListener("dblclick", function(event) {
      if (event.target.tagName.toLowerCase() !== "img") {
        return;
      }
      window.open(event.target.src);
    });

    /**
     * When a new file is selected, clear the main area and
     * load the selected book.
     */
    input.addEventListener("change", function() {
      content = "";
      loadBook();
    });

    loadBook();

    async function loadBook() {
      const data = input.files[0];
      if (!data) {
        return;
      }

      // No need in FileReader, the underlying library takes care of it.
      const book = await epub.load(data);
      bookProxy.set(book);

      const chapters = book.chapters();
      const n = chapters.length;
      const chaptersHTML = [];

      function setProgress(i) {
        loadProgress = i / n;
      }

      loading = true;
      for (let i = 0; i < n; i++) {
        setProgress(i);
        const c = chapters[i];
        let html = await c.html();
        html = html.replace(/id="/g, `id="${c.path()}#`);
        html = `<a id="${c.path()}"></a>` + html;

        chaptersHTML.push(html);
        setProgress(i + 1);
      }
      loading = false;

      text.lang = book.language();

      const css = await book.stylesheet();
      content = `<sty` + `le></style>${chaptersHTML.join("")}`;
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

  onMount(centralContent);
</script>

<div id="main">
  {#if loading}
    <Loader progress={loadProgress} />
  {/if}
  {@html content}
  {#if content === '' && !loading}
    <button
      on:click={() => {
        input && input.click();
      }}>
      Open
    </button>
  {/if}
</div>
