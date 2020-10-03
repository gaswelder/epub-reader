import fs from "fs";
import express from "express";

const Book = require("../epub");

const EpubDir = process.argv[2] || ".";

const app = express();
app.set("view engine", "ejs");
app.set("views", "./src/server/views");

app.get("/", async (req, res) => {
  const names = fs.readdirSync(EpubDir).filter((f) => f.endsWith(".epub"));
  res.render("index", { names });
});

app.get("/:name/cover", async (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const path = EpubDir + "/" + name;
  if (!fs.existsSync(path)) {
    res.sendStatus(404);
    return;
  }
  const src = fs.readFileSync(path);
  const book = await Book.load(src);
  const c = await book.cover();
  res.setHeader("Content-Type", c.type);
  res.write(await c.buffer());
  res.end();
});

app.listen(8080, () => {
  console.log(`Serving ${EpubDir} at http://localhost:8080`);
});
