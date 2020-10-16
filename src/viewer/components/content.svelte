<script>
  import { createEventDispatcher } from "svelte";
  import Loader from "./loader.svelte";
  import Text from "./text.svelte";

  export let loading = false;
  export let loadProgress = 0;
  export let content = "";
  export let lang = "";

  const dispatch = createEventDispatcher();
</script>

<div
  id="main"
  on:dblclick={e => {
    if (e.target.tagName.toLowerCase() !== 'img') {
      return;
    }
    window.open(e.target.src);
  }}>
  {#if loading}
    <Loader progress={loadProgress} />
  {/if}
  <Text html={content} {lang} />
  {#if content === '' && !loading}
    <button
      on:click={() => {
        dispatch('openclick');
      }}>
      Open
    </button>
  {/if}
</div>
