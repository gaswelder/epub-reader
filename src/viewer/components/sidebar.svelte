<script>
  import { createEventDispatcher } from "svelte";
  import Toc from "./toc.svelte";
  export let book;
  export let open;

  const dispatch = createEventDispatcher();
</script>

<style>
  .menu {
    position: fixed;
    z-index: 1;
    top: 0;
    bottom: 0;
    right: 0;
    width: 100px;
  }

  .toggle {
    border-radius: 50%;
    border-width: 0;
    background-color: #4d75ed;
    width: 6em;
    height: 6em;
    position: absolute;
    right: 6px;
    bottom: 6px;
    color: white;
  }
  .menu.open .toggle {
    background-color: white;
    color: #4d75ed;
  }

  /*
 * The sidebar
 */
  .menu > div {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 20em;
    background-color: royalblue;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
  }
  .menu:not(.open) > div {
    right: -20em;
  }
</style>

<div class="menu" class:open>
  <div>
    <div id="toc">
      {#if book}
        {#await book.toc()}
          loading toc
        {:then chapters}
          <Toc
            on:chapterclick={e => {
              dispatch('chapterclick', e.detail);
            }}
            {chapters} />
        {:catch error}
          <p>Error: {error}</p>
        {/await}
      {/if}
    </div>
  </div>
  <button
    class="toggle"
    on:click={() => {
      dispatch('toggle');
    }}>
    Toggle
  </button>
</div>
