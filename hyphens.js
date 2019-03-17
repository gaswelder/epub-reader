(function() {
  var d = document.body;
  if ("hyphens" in d.style) {
    d.style.hyphens = "auto";
    return;
  }
  if ("MozHyphens" in d.style) {
    d.style.MozHyphens = "auto";
    return;
  }
})();
