<script>
  export let chapters;
</script>

{#if chapters}
  <ol>
    {#each chapters as c}
      <li>
        <a href="#{c.path()}">{c.title()}</a>
        <svelte:self chapters={c.children()} />
      </li>
    {/each}
  </ol>
{/if}
