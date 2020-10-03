import fs from "fs";
import express from "express";

const Book = require("../epub");

const EpubDir = process.argv[2] || ".";

function read(name: string) {
  return fs.readFileSync(EpubDir + "/" + name);
}

function list() {
  const ls = fs.readdirSync(EpubDir);
  return ls.filter((f) => f.endsWith(".epub"));
}

const app = express();

app.get("/", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.write(`
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="utf-8">
  <style>
  body {
      display: flex;
      flex-wrap: wrap;
  }
  article {
      width: 200px;
  }
  img { height: 200px; width: auto; }
  </style>
  </head>
  <body>
  `);
  for (const name of list()) {
    res.write(`<article><img src="/${name}/cover"><br>${name}</article>`);
  }
  res.write("</body></html>");
  res.end();
});

app.get("/:name/cover", async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const src = read(name);
  const book = await Book.load(src);
  const c = await book.cover();
  res.setHeader("Content-Type", c.type);
  res.write(await c.buffer());
  res.end();
});

app.listen(8080, () => {
  console.log(`Listening on :8080, serving from ${EpubDir}`);
});
