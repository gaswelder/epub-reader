const path = require("path");
const JSZip = require("jszip");
const util = require("util");
const fs = require("fs");

exports.dir = dir;
function dir(dir = "_out") {
  return {
    async put(name, content) {
      const p = dir + "/" + name;
      mkdir(path.dirname(p));
      return util.promisify(fs.writeFile)(p, content);
    },
    async close() {}
  };
}

function mkdir(p) {
  const parts = p.split("/");
  let dir = ".";
  for (let part of parts) {
    dir += "/" + part;
    try {
      fs.mkdirSync(dir);
    } catch (e) {
      if (e.code != "EEXIST") throw e;
    }
  }
}

exports.zip = zip;
function zip(name) {
  var zip = new JSZip();
  return {
    async put(name, content) {
      zip.file(name, content);
    },
    async close() {
      const bin = await zip.generateAsync({ type: "nodebuffer" });
      return util.promisify(fs.writeFile)(name, bin);
    }
  };
}
