<script>
  export let lang;
  export let html;

  function hyphensSupported() {
    return (
      navigator.userAgent.indexOf("Firefox") > 0 &&
      navigator.userAgent.indexOf("Chrome") < 0
    );
  }

  function makeHyphens(root) {
    if (!root) {
      return;
    }
    if (hyphensSupported()) {
      return;
    }
    for (const node of root.querySelectorAll(
      "p, span, b, strong, em, i, blockquote"
    )) {
      for (const ch of node.childNodes) {
        if (ch.nodeType != 3) {
          continue;
        }
        ch.textContent = viewer.hyphenate(ch.textContent);
      }
    }
  }

  let root;
  $: makeHyphens(root);
</script>

<div {lang} bind:this={root}>
  {@html html}
</div>
