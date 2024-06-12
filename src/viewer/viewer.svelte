<script>
  import Loader from "./loader.svelte";
  import Text from "./text.svelte";
  import { onMount } from "svelte";
  import Toc from "./toc.svelte";

  const { epub } = window;

  let book;
  let input = null;
  let loading = false;
  let loadProgress = 0;
  let content = "";
  let lang = "";
  let selectedChapter;
  let css = "";
  let addUserCss = true;
  let justify = true;

  const userCss = `
  html {
    max-width: 900px;
    border-right: 1px dotted gray;
  }
  body {
    max-width: 38em;
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
    document.title = "...";
    const data = input.files[0];
    if (!data) {
      return;
    }
    loading = true;
    book = await epub.load(data);
    const chapters = book.chapters();
    const n = chapters.length;
    const chaptersHTML = [];

    const cover = await book.cover();
    if (cover) {
      chaptersHTML.push(
        `<img src="data:${cover.type};base64,${await cover.b64()}" alt="cover">`
      );
    }

    function setProgress(i) {
      loadProgress = i / n;
    }
    for (let i = 0; i < n; i++) {
      setProgress(i);
      const c = chapters[i];
      let { html, errors } = await c.html();
      errors.forEach(console.error);
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
    document.title = book.title();
  }

  onMount(() => {
    loadBook();
  });
</script>

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
  <div class="header">
    <div>
      <input type="file" bind:this={input} on:change={loadBook} />
    </div>
    <div>
      {book ? book.title() : ""}
    </div>
    <div>
      <label>
        <input type="checkbox" bind:checked={addUserCss} />
        Add user CSS
      </label>
      <label>
        <input type="checkbox" bind:checked={justify} />
        Justify
      </label>
    </div>
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
  .t {
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-rows: min-content 1fr;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 5px;
    top: 0;
  }
  .toc {
    grid-row: span 2;
    overflow: scroll;
    padding: 20px;
    background-color: #666;
  }
  .header {
    padding: 10px;
    font-family: sans-serif;
    font-size: 12px;
    max-width: 880px;
    display: flex;
    justify-content: space-between;
  }
  .main {
    flex: 1;
  }
</style>
