const fs = require("fs");

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

function readPart(dir) {
  const files = fs.readdirSync(dir);

  return files.map(function(file) {
    const path = dir + "/" + file;
    if (fs.statSync(path).isDirectory()) {
      return readPart(path);
    } else {
      return readChapter(path);
    }
  });
}

function localPath(path) {
  return path
    .split("/")
    .slice(2)
    .join("/");
}

function readChapter(sourcePath) {
  const path = localPath(sourcePath);
  const content = fs.readFileSync(sourcePath);
  return {
    path,
    type: mimeType(path),
    content: content,
    title: chapterTitle(content.toString())
  };
}

exports.read = read;
function read(dir) {
  const meta = parseMeta(fs.readFileSync(dir + "/meta").toString());
  const chapters = readPart(dir + "/chapters");
  const images = ls(dir + "/images").map(function(sourcePath) {
    return {
      path: localPath(sourcePath),
      type: mimeType(sourcePath),
      content: fs.readFileSync(sourcePath)
    };
  });

  return { meta, chapters, images };
}

function ls(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
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
    ["xhtml", "application/xhtml+xml"],
    // Allow html extension for source files to let viewing them with a browser.
    ["html", "application/xhtml+xml"]
  ];
  for (const [ext, type] of types) {
    if (path.endsWith("." + ext)) {
      return type;
    }
  }
  throw new Error("Unknown extension in filename " + path);
}

function chapterTitle(content) {
  const re = /<h\d>(.*?)<\/h\d>/;
  const m = re.exec(content);
  return m ? m[1] : null;
}
