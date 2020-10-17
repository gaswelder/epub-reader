<script>
  import { onMount } from "svelte";
  export let lang;
  export let html;
  export let selectedChapter;

  let iframe;
  let root;

  const showImage = e => {
    console.log(e.target.tagName);
    if (e.target.tagName.toLowerCase() !== "img") {
      return;
    }
    window.open(e.target.src);
  };

  const setHtml = html => {
    if (!iframe) {
      return;
    }
    const body = iframe.contentDocument.body;
    body.innerHTML = html;
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

  $: setHtml(html);
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
