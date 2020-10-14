<script>
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";
  export let book;

  let open = false;

  const initSidebar = function() {
    const file = document.querySelector("#file");

    /**
     * Hide the menu when a new book file is chosen.
     */
    file.addEventListener("change", function() {
      open = false;
    });
  };
  onMount(initSidebar);
</script>

<div id="menu" class:open>
  <div>
    <div id="toc">
      {#if book}
        {#await book.toc()}
          loading toc
        {:then chapters}
          <Toc
            on:chapterclick={() => {
              open = false;
            }}
            {chapters} />
        {:catch error}
          <p>Error: {error}</p>
        {/await}
      {/if}
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
