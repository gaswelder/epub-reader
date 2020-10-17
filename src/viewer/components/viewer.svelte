<script>
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
  let selectedChapter;
  let css = "";
  let addUserCss = true;

  const userCss = `
  body {
    max-width: 48em;
    margin: auto;
  }
  p {
    font-size: 16px !important;
    line-height: 24px !important;
  }
  `;

  async function loadBook() {
    const data = input.files[0];
    if (!data) {
      return;
    }

    // No need in FileReader, the underlying library takes care of it.
    book = await epub.load(data);

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

    css = await book.stylesheet();
    content = chaptersHTML.join("");
  }

  onMount(() => {
    loadBook();
  });
</script>

<style>
  .header {
    flex: 0 0 auto;
    height: 3em;
    background-color: #eef;
  }

  .main {
    position: absolute;
    left: 0;
    right: 0;
    top: 3em;
    height: calc(100vh - 3em);
  }
</style>

<div class="header">
  <span>{book ? book.title() : ''}</span>
  <input
    type="file"
    bind:this={input}
    on:change={() => {
      sidebarOpen = false;
      content = '';
      loadBook();
    }} />
  <label>
    <input
      type="checkbox"
      checked={addUserCss}
      on:change={e => {
        addUserCss = e.target.checked;
      }} />
    Add user CSS
  </label>
</div>
<Sidebar
  {book}
  open={sidebarOpen}
  on:toggle={() => {
    sidebarOpen = !sidebarOpen;
  }}
  on:chapterclick={e => {
    sidebarOpen = false;
    selectedChapter = e.detail.chapter.path();
  }} />
<div class="main">
  {#if loading}
    <Loader progress={loadProgress} />
  {/if}
  <Text
    html={content}
    {lang}
    {selectedChapter}
    css={addUserCss ? css + userCss : css} />
  {#if content === '' && !loading}
    <button
      on:click={() => {
        input && input.click();
      }}>
      Open
    </button>
  {/if}
</div>
