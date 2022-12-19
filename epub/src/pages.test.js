const assert = require("assert");
const { measure } = require("./pages");

function test() {
  const text =
    "Imagine that you’re rowing down a stream and you’re trying to figure out how to do it. Do I first row with the right oar and then with the left, or is it the other way around? What does my shoulder do, what does my arm do? It’s like Joe, the centipede with a hundred legs, trying to figure out which leg to move first.";

  const p = {
    name: "p",
    children: [{ text }]
  };

  assert.equal(measure(p), 5);
}

test();
