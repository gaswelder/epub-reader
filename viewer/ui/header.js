window.initHeader = function(container, bookProxy) {
  const title = container.querySelector("span");

  bookProxy.onChange(function() {
    title.innerHTML = "what is the title?";
  });
};
