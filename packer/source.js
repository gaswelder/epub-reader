const fs = require("fs");

const isChapter = f => f.type.startsWith("application/xhtml+xml");

function parseMeta(str) {
  const pairs = str
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(line => line.split("=").map(s => s.trim()));
  const meta = {};
  for (const [k, v] of pairs) {
    meta[k] = v;
  }
  return meta;
}

exports.read = read;
function read(dir) {
  const readSource = name => fs.readFileSync(dir + "/" + name);

  const meta = parseMeta(readSource("meta").toString());

  const items = ls(dir + "/chapters")
    .concat(ls(dir + "/images"))
    .map(f =>
      f
        .split("/")
        .slice(1)
        .join("/")
    );

  const files = items.map(path => ({
    path: path,
    type: mimeType(path),
    content: readSource(path)
  }));

  for (const f of files) {
    if (!isChapter(f)) continue;
    f.title = chapterTitle(f);
  }

  return { meta, files };
}

function ls(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir)) {
    const path = dir + "/" + entry;
    if (fs.statSync(path).isDirectory()) {
      results.push(...ls(path));
    } else {
      results.push(path);
    }
  }
  return results;
}

function mimeType(path) {
  const types = [
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["xhtml", "application/xhtml+xml"]
  ];
  for (const [ext, type] of types) {
    if (path.endsWith("." + ext)) {
      return type;
    }
  }
  throw new Error("Unknown extension in filename " + path);
}

function chapterTitle(chapter) {
  const re = /<h\d>(.*?)<\/h\d>/;
  const m = re.exec(chapter.content);
  return m ? m[1] : null;
}
