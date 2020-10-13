<script>
  export let book;
</script>

<div id="header">
  <span>{book ? book.title() : ''}</span>
  <input type="file" id="file" />
</div>
