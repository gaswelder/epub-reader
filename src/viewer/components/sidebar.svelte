<script>
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";
  export let bookProxy;

  let open = false;
  let chapters = [];

  const initSidebar = function() {
    const menu = document.querySelector("#menu");
    const file = document.querySelector("#file");

    /**
     * Hide the menu when a new book file is chosen.
     */
    file.addEventListener("change", function() {
      open = false;
    });

    /**
     * Refresh the table of contents when the book is loaded.
     */
    bookProxy.onChange(async () => {
      chapters = await bookProxy.get().toc();
    });
  };
  onMount(initSidebar);
</script>

<div id="menu" class:open>
  <div>
    <div id="toc">
      <Toc
        on:chapterclick={() => {
          open = false;
        }}
        {chapters} />
    </div>
  </div>
  <button
    data-toggle
    on:click={() => {
      open = !open;
    }}>
    Toggle
  </button>
</div>
