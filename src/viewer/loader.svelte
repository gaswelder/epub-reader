<script>
  export let filename = "";
  export let progress = 0;
</script>

<p>Loading {filename}: {Math.round(progress * 100)}%</p>
<progress max="100" value={Math.round(progress * 100)} />
