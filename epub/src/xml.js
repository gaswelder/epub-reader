exports.wrap = function (containerName, elements) {
  return {
    name: containerName,
    attr: {},
    children: elements,
  };
};
