<script>
  export let lang;
  export let html;
  export let selectedChapter;
  export let css;

  let iframe;

  const showImage = (e) => {
    if (e.target.tagName.toLowerCase() !== "img") {
      return;
    }
    window.open(e.target.src);
  };

  const setHtml = (html, css) => {
    if (!iframe) {
      // Hasn't loaded yet.
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

  const selectChapter = (path) => {
    if (!iframe) {
      return;
    }
    iframe.contentWindow.location.hash = "#" + path;
  };

  $: setHtml(html, css);
  $: selectChapter(selectedChapter);
</script>

<iframe
  on:load={() => {
    setHtml(html, css);
  }}
  bind:this={iframe}
  title="Book content"
/>

<style>
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
</style>
