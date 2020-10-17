<script>
  import { onMount } from "svelte";
  export let lang;
  export let html;
  export let selectedChapter;
  export let css;

  let iframe;
  let root;

  const showImage = e => {
    console.log(e.target.tagName);
    if (e.target.tagName.toLowerCase() !== "img") {
      return;
    }
    window.open(e.target.src);
  };

  const setHtml = (html, css) => {
    if (!iframe) {
      return;
    }
    const body = iframe.contentDocument.body;
    body.innerHTML = `<sty` + `le>${css}</style>` + html;
    body.lang = lang;
    body.style = "hyphens: auto";

    // because can't set the listener once on mount (gets ignored)
    body.removeEventListener("dblclick", showImage);
    body.addEventListener("dblclick", showImage);
  };

  const selectChapter = path => {
    if (!iframe) {
      return;
    }
    iframe.contentWindow.location.hash = "#" + path;
  };

  $: setHtml(html, css);
  $: selectChapter(selectedChapter);
</script>

<style>
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
</style>

<iframe bind:this={iframe} title="Book content" />
