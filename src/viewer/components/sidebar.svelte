<script>
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";
  export let bookProxy;

  let open = false;

  const initSidebar = function() {
    const menu = document.querySelector("#menu");
    const toc = document.querySelector("#toc");
    const file = document.querySelector("#file");

    const tocComponent = new Toc({
      target: toc,
      props: { chapters: [] }
    });

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
    bookProxy.onChange(async () => {
      tocComponent.$set({ chapters: await bookProxy.get().toc() });
    });

    function closeMenu() {
      open = false;
    }
  };
  onMount(initSidebar);
</script>

<div id="menu" class:open>
  <div>
    <div id="toc" />
  </div>
  <button
    data-toggle
    on:click={() => {
      open = !open;
    }}>
    Toggle
  </button>
</div>
