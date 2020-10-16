<script>
  import Header from "./header.svelte";
  import Sidebar from "./sidebar.svelte";
  import Content from "./content.svelte";
  import { onMount } from "svelte";

  const { epub, viewer } = window;

  let book;
  let sidebarOpen = false;
  let input = null;
  let loading = false;
  let loadProgress = 0;
  let content = "";
  let lang = "";

  async function loadBook() {
    const data = input.files[0];
    if (!data) {
      return;
    }

    // No need in FileReader, the underlying library takes care of it.
    const book = await epub.load(data);

    const chapters = book.chapters();
    const n = chapters.length;
    const chaptersHTML = [];

    function setProgress(i) {
      loadProgress = i / n;
    }

    loading = true;
    for (let i = 0; i < n; i++) {
      setProgress(i);
      const c = chapters[i];
      let html = await c.html();
      html = html.replace(/id="/g, `id="${c.path()}#`);
      html = `<a id="${c.path()}"></a>` + html;

      chaptersHTML.push(html);
      setProgress(i + 1);
    }
    loading = false;

    lang = book.language();

    const css = await book.stylesheet();
    content = `<sty` + `le>${css}</style>${chaptersHTML.join("")}`;
  }

  onMount(() => {
    /**
     * Hide the menu when a new book file is chosen.
     */
    const file = document.querySelector("#file");
    file.addEventListener("change", function() {
      sidebarOpen = false;
    });

    input = file;

    /**
     * When a new file is selected, clear the main area and
     * load the selected book.
     */
    input.addEventListener("change", function() {
      content = "";
      loadBook();
    });

    loadBook();
  });
</script>

<Header {book} />
<Sidebar
  {book}
  open={sidebarOpen}
  on:toggle={() => {
    sidebarOpen = !sidebarOpen;
  }} />
<Content
  {loading}
  {loadProgress}
  {content}
  {lang}
  on:openclick={() => {
    input && input.click();
  }} />
