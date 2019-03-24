self.addEventListener("fetch", function(event) {
  return;

  //   const responsePromise = caches
  //     .open("main")
  //     .then(cache => cache.match(event.request) || fetch(event.request));
  //   event.respondWith(responsePromise);
});
