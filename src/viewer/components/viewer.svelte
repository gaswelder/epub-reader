<script>
  import Header from "./header.svelte";
  import Sidebar from "./sidebar.svelte";
  import Content from "./content.svelte";

  const { epub, viewer, centralContent } = window;

  /**
   * The book that is currently loaded.
   */
  let book;

  const bookProxy = {
    listeners: [],
    get() {
      return book;
    },
    set(v) {
      book = v;
      this.listeners.forEach(fn => fn(book));
    },
    onChange(fn) {
      this.listeners.push(fn);
    }
  };
</script>

<Header {bookProxy} />
<Sidebar {bookProxy} />
<Content {epub} {viewer} {bookProxy} />
