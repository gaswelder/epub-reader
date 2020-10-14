<script>
  import Header from "./header.svelte";
  import Sidebar from "./sidebar.svelte";
  import Content from "./content.svelte";
  import { onMount } from "svelte";

  /**
   * The book that is currently loaded.
   */
  let book;
  let sidebarOpen = false;

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

  onMount(() => {
    /**
     * Hide the menu when a new book file is chosen.
     */
    const file = document.querySelector("#file");
    file.addEventListener("change", function() {
      sidebarOpen = false;
    });
  });
</script>

<Header {book} />
<Sidebar
  {book}
  open={sidebarOpen}
  on:toggle={() => {
    sidebarOpen = !sidebarOpen;
  }} />
<Content {bookProxy} {book} />
