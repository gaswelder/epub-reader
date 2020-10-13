<script>
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";
  export let bookProxy;

  const initSidebar = function() {
    const menu = document.querySelector("#menu");
    const toc = document.querySelector("#toc");
    const file = document.querySelector("#file");

    const tocComponent = new Toc({
      target: toc,
      props: { chapters: [] }
    });

    /**
     * Show/hide the menu when the toggle button is pressed.
     */
    menu.querySelector("[data-toggle]").addEventListener("click", toggleMenu);

    /**
     * Hide the menu when a chapter is selected from it.
     */
    toc.addEventListener("click", function(event) {
      if (event.target.tagName.toLowerCase() == "a") {
        closeMenu();
      }
    });

    /**
     * Hide the menu when a new book file is chosen.
     */
    file.addEventListener("change", function() {
      closeMenu();
    });

    /**
     * Refresh the table of contents when the book is loaded.
     */
    bookProxy.onChange(async () => {
      tocComponent.$set({ chapters: await bookProxy.get().toc() });
    });

    function closeMenu() {
      menu.classList.remove("open");
    }

    function toggleMenu() {
      menu.classList.toggle("open");
    }
  };
  onMount(initSidebar);
</script>

<div id="menu">
  <div>
    <div id="toc" />
  </div>
  <button data-toggle>Toggle</button>
</div>
