const fs = require("fs");
const promisify = require("util").promisify;
const readFile = promisify(fs.readFile);
const { Book } = require("./book");

if (process.argv.length != 3) {
  process.stderr.write("Usage: node script {filename}\n");
  process.exit(1);
}

main(process.argv[2]);

async function main(bookPath) {
  const src = await readFile(bookPath);

  const book = await Book.load(src);
  const html = await book.convert(src);
  process.stdout.write(html);
}
