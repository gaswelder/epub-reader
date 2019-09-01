const assert = require("assert");
const filters = require("./filters");

describe("filters", function() {
  const body = {
    name: "body",
    children: [
      {
        name: "svg",
        attr: {
          height: "100%"
        },
        children: [
          {
            name: "img",
            attr: {
              style: "border: 1px; height: 100%; margin: 1em;"
            }
          }
        ]
      }
    ]
  };

  filters.apply(body);

  it("no 100% height", function() {
    assert.equal(
      body.children[0].children[0].attr.style,
      "border: 1px; margin: 1em;"
    );
    assert.equal(body.children[0].name, "svg");
    assert.equal(body.children[0].attr.height, undefined);
  });
});
