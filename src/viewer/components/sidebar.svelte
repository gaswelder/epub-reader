<script>
  import { createEventDispatcher } from "svelte";
  import Toc from "./toc.svelte";
  export let book;
  export let open;

  const dispatch = createEventDispatcher();
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
              if (open) {
                dispatch('toggle');
              }
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
      dispatch('toggle');
    }}>
    Toggle
  </button>
</div>
