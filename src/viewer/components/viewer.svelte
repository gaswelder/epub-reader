<script>
  import { onMount } from "svelte";
  import Header from "./header.svelte";

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
      this.listeners.forEach(fn => fn(book));
    },
    onChange(fn) {
      this.listeners.push(fn);
    }
  };

  function main() {
    const { epub, viewer, centralContent, initSidebar } = window;

    const containers = {
      toc: document.querySelector("#toc"),
      text: document.querySelector("#main"),
      file: document.querySelector("#file")
    };
    const menu = document.querySelector("#menu");
    const header = document.querySelector("#header");

    centralContent(epub, viewer, containers.file, containers.text, bookProxy);
    initSidebar(bookProxy, menu, containers.toc, containers.file);

    containers.text.addEventListener("dblclick", function(event) {
      if (event.target.tagName.toLowerCase() !== "img") {
        return;
      }
      window.open(event.target.src);
    });
  }

  onMount(() => {
    main();
  });
</script>

<Header {bookProxy} />
<div id="menu">
  <div>
    <div id="toc" />
  </div>
  <button data-toggle>Toggle</button>
</div>
<div id="main" />
