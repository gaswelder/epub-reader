<script>
  import Loader from "./loader.svelte";
  import Text from "./text.svelte";
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";

  const { epub, viewer } = window;

  let book;
  let input = null;
  let loading = false;
  let loadProgress = 0;
  let content = "";
  let lang = "";
  let selectedChapter;
  let css = "";
  let addUserCss = true;
  let justify = false;

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

  const getCss = (css, addUserCss, justify) => {
    let r = css;
    if (addUserCss) {
      r += userCss;
    }
    if (justify) {
      r += `
      p { text-align: justify; }
`;
    }
    return r;
  };

  async function loadBook() {
    content = "";
    const data = input.files[0];
    if (!data) {
      return;
    }
    loading = true;
    book = await epub.load(data);
    const chapters = book.chapters();
    const n = chapters.length;
    const chaptersHTML = [];
    function setProgress(i) {
      loadProgress = i / n;
    }
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
    if (lang === "eng") {
      lang = "en";
    }
    css = await book.stylesheet();
    content = chaptersHTML.join("");
  }

  onMount(() => {
    loadBook();
  });
</script>

<div class="header">
  <span>{book ? book.title() : ""}</span>
  <input
    type="file"
    bind:this={input}
    on:change={loadBook}
  />
  <label>
    <input type="checkbox" bind:checked={addUserCss} />
    Add user CSS
  </label>
  <label>
    <input type="checkbox" bind:checked={justify} />
    Justify
  </label>
</div>
<div class="t">
  <div class="toc">
    {#if book}
      {#await book.toc()}
        loading toc
      {:then chapters}
        <Toc
          on:chapterclick={(e) => {
            selectedChapter = e.detail.chapter.path();
          }}
          {chapters}
        />
      {:catch error}
        <p>Error: {error}</p>
      {/await}
    {/if}
  </div>
  <div class="main">
    {#if loading}
      <Loader progress={loadProgress} />
    {:else if content === ""}
      <button
        on:click={() => {
          input && input.click();
        }}
      >
        Open
      </button>
    {:else}
      <Text
        html={content}
        {lang}
        {selectedChapter}
        css={getCss(css, addUserCss, justify)}
      />
    {/if}
  </div>
</div>

<style>
  .header {
    flex: 0 0 auto;
    height: 3em;
    background-color: #eef;
  }
  .t {
    display: flex;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 5px;
    top: 50px;
  }
  .toc {
    flex-basis: 20em;
    overflow: scroll;
    padding-left: 20px;
    padding-right: 20px;
    border-right: dotted 1px gray;
  }
  .main {
    flex: 1;
  }
</style>
