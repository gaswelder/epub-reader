exports.wrap = function(containerName, elements) {
  return {
    name: containerName,
    attr: {},
    children: elements
  };
};

exports.find = find;

function find(element, match) {
  const result = [];

  for (const child of element.children) {
    if (match(child)) {
      result.push(child);
    }
    if (child.children) {
      result.push(...find(child, match));
    }
  }
  return result;
}
