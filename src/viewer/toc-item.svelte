<script>
  import { createEventDispatcher } from "svelte";
  export let chapters;

  const dispatch = createEventDispatcher();
</script>

{#each chapters as c}
  <a
    href="#{c.path()}"
    on:click={(e) => {
      dispatch("chapterclick", { chapter: c });
    }}
  >
    {c.title()}
  </a>
  <svelte:self on:chapterclick chapters={c.children()} />
{/each}

<style>
  a {
    font-family: sans-serif;
    display: block;
    text-decoration: none;
    color: inherit;
    padding: 6px 20px;
    border-radius: 4px;
  }
  a:hover {
    background-color: #ccc;
  }
</style>
