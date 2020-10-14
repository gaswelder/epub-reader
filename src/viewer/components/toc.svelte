<script>
  import { createEventDispatcher } from "svelte";
  export let chapters;

  const dispatch = createEventDispatcher();
</script>

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
