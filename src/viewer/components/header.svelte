<script>
  export let bookProxy;

  let title = "";

  bookProxy.onChange(function() {
    title = bookProxy.get().title();
  });
</script>

<div id="header">
  <span>{title}</span>
  <input type="file" id="file" />
</div>
