/**
 * Applies all filters to the given HTML tree.
 */
exports.apply = function(root) {
  trim(root);
  cleanup(root);
  deonion(root);
  figures(root);
  fixHeights(root);
};

/**
 * Replaces some containers with <figure> where appropriate.
 */
function figures(root) {
  if (!root.children) {
    return;
  }
  root.children.forEach(figures);
  if (isOnion(root, ["p", "img"]) || isOnion(root, ["div", "img"])) {
    root.name = "figure";
  }
}

/**
 * Eliminates some common onions.
 */
function deonion(root) {
  if (!root.children) {
    return;
  }

  const pairs = [
    ["p", "span"],
    ["span", "span"],
    ["div", "div"],
    ["h1", "strong"],
    ["h2", "strong"],
    ["h3", "strong"],
    ["h4", "strong"]
  ];

  for (const c of root.children) {
    deonion(c);
    if (pairs.some(path => isOnion(c, path))) {
      c.children = c.children[0].children;
    }

    if (isOnion(c, ["div", "p"])) {
      c.name = c.children[0].name;
      c.attr = c.children[0].attr;
      c.children = c.children[0].children;
    }
  }
}

/**
 * Trims empty text at the ends of container elements.
 * For example, <div> <p>...</p> </div> becomes <div><p>...</p></div>.
 */
function trim(root) {
  const ch = root.children;

  if (!ch || !ch.length) {
    return;
  }

  ch.forEach(trim);

  const n = ch.length;
  const first = ch[0];
  const last = n > 1 ? ch[n - 1] : null;

  if (first.text && first.text.trim() == "") {
    ch.shift();
  }

  if (last && last.text && last.text.trim() == "") {
    ch.pop();
  }

  root.children = ch;
}

/**
 * Removes empty container nodes.
 */
function cleanup(root) {
  if (!root.children) {
    return;
  }

  function isEmpty(node) {
    const containers = ["em", "div", "p", "span", "b", "i"];
    if (containers.indexOf(node.name) < 0) {
      return false;
    }

    // An empty node.
    if (node.children.length == 0) {
      return true;
    }

    return false;
  }

  const ch = [];
  for (const c of root.children) {
    cleanup(c);
    if (isEmpty(c)) {
      continue;
    }
    ch.push(c);
  }

  root.children = ch;
}

/**
 * Returns true if the given node is an "onion".
 * For example, <div><p>...</p></div> is a ['div', 'p'] onion.
 *
 * @param {node} root
 * @param {[string, string]} path
 * @returns {boolean}
 */
function isOnion(root, path) {
  if (!root.children) {
    return false;
  }
  return (
    root.children &&
    root.children.length == 1 &&
    root.name == path[0] &&
    root.children[0].name == path[1]
  );
}

/**
 * Remove height=100% from covers.
 */
function fixHeights(root) {
  if (root.children) {
    root.children.forEach(fixHeights);
  }

  if (
    root.name == "img" &&
    root.attr.style &&
    root.attr.style.indexOf("height: 100%") >= 0
  ) {
    root.attr.style = root.attr.style.replace(/height: 100%(;\s?)?/, "");
    return;
  }

  if (root.name == "svg" && root.attr.height && root.attr.height == "100%") {
    delete root.attr.height;
  }
}
