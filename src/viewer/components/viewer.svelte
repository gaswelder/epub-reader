<script>
  import { onMount } from "svelte";
  import Header from "./header.svelte";
  import Sidebar from "./sidebar.svelte";

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
    const { epub, viewer, centralContent } = window;

    const containers = {
      toc: document.querySelector("#toc"),
      text: document.querySelector("#main"),
      file: document.querySelector("#file")
    };

    const header = document.querySelector("#header");

    centralContent(epub, viewer, containers.file, containers.text, bookProxy);

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
<Sidebar {bookProxy} />
<div id="main" />
