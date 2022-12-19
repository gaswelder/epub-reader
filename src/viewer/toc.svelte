<script>
  import { createEventDispatcher } from "svelte";
  export let chapters;

  const dispatch = createEventDispatcher();
</script>

<style>
  a {
    text-decoration: none;
    color: inherit;
  }
  li {
    margin: 0;
    margin-bottom: 7px;
    font-size: 14px;
    color: #248;
    font-family: sans-serif;
  }
  ol {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }
</style>

{#if chapters}
  <ol>
    {#each chapters as c}
      <li>
        <a
          href="#{c.path()}"
          on:click={e => {
            dispatch('chapterclick', { chapter: c });
          }}>
          {c.title()}
        </a>
        <svelte:self on:chapterclick chapters={c.children()} />
      </li>
    {/each}
  </ol>
{/if}
