const http = require("http");
const fs = require("fs");
const { Book } = require("../book");

const EpubDir = process.argv[2] || ".";

function read(name) {
  return fs.readFileSync(EpubDir + "/" + name);
}

function list() {
  const ls = fs.readdirSync(EpubDir);
  return ls.filter(f => f.endsWith(".epub"));
}

http
  .createServer(async function(req, res) {
    try {
      switch (req.url) {
        case "/":
          await index(req, res);
          break;
        default:
          await cover(req, res);
      }
    } catch (e) {
      res.setHeader("Content-Type", "text/plain");
      res.writeHead(500);
      res.write("Error: " + e.toString());
      res.end();
    }
  })
  .listen(8080, () => {
    console.log(`Listening on :8080, serving from ${EpubDir}`);
  });

async function index(req, res) {
  res.setHeader("Content-Type", "text/html");
  res.write(`<style>
  body {
      display: flex;
      flex-wrap: wrap;
  }
  article {
      width: 200px;
  }
  img { height: 200px; width: auto; }
  </style>`);
  for (const name of list()) {
    res.write(`<article><img src="/${name}"><br>${name}</article>`);
  }
  res.end();
}

async function cover(req, res) {
  const name = unescape(req.url.substr(1));
  const src = read(name);
  const book = await Book.load(src);
  const c = await book.cover();
  res.setHeader("Content-Type", c.type);
  res.write(await c.buffer());
  res.end();
}
