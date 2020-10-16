<script>
  import Header from "./header.svelte";
  import Sidebar from "./sidebar.svelte";
  import Loader from "./loader.svelte";
  import Text from "./text.svelte";
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
    input = document.querySelector("#file");
    input.addEventListener("change", function() {
      sidebarOpen = false;
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
<div
  id="main"
  on:dblclick={e => {
    if (e.target.tagName.toLowerCase() !== 'img') {
      return;
    }
    window.open(e.target.src);
  }}>
  {#if loading}
    <Loader progress={loadProgress} />
  {/if}
  <Text html={content} {lang} />
  {#if content === '' && !loading}
    <button
      on:click={() => {
        input && input.click();
      }}>
      Open
    </button>
  {/if}
</div>
