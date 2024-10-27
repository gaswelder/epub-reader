<script>
  import TocItem from "./toc-item.svelte";
  import { createEventDispatcher } from "svelte";

  export let book;

  const dispatch = createEventDispatcher();
</script>

<div class="toc">
  {#if book}
    {#await book.toc()}
      Loading chapters list...
    {:then chapters}
      <TocItem
        on:chapterclick={(e) => {
          dispatch("chapterclick", e.detail);
        }}
        {chapters}
      />
    {:catch error}
      <p>Error: {error}</p>
    {/await}
  {/if}
</div>

<style>
  .toc {
    grid-row: span 2;
    overflow: scroll;
    background-color: #dddddf;
    color: #333;
    font-size: 14px;
    padding: 4px 4px 40px;
  }
</style>
