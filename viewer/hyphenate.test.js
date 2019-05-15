const assert = require("assert");
const { hyphenate } = require("./index");

describe("hyphenate", function() {
  const samples = [
    // "con-tra-dic-tion",
    "fas-ci-na-tion",
    "bi-og-ra-phy",
    // "in-ter-est",
    "in-no-va-tor",
    "fas-ci-na-tion bi-og-ra-phy  in-no-va-tor ",
    "1922",
    "him",
    "such",
    "bet-ween",
    "pur-pose",
    "pat-ro-nage"
  ];

  for (const sample of samples) {
    it(sample, function() {
      const plain = sample.replace(/-/g, "");
      assert.equal(hyphenate(plain, "-"), sample);
    });
  }
});
