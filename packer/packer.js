const writers = require("./writers");
const source = require("./source");
const xmldoc = require("xmldoc");

const [input, output] = process.argv.slice(2);

build(input, output);
async function build(input, output) {
  console.log({ input, output });
  const w = writers.zip(output);
  await pack(input, w);
  w.close();
}

// async function init(name) {
//   const w = writers.dir(name);
//   await w.put(
//     "chapters/01-title.xhtml",
//     `<h1>Book Title</h1><img src="images/cover.png" />`
//   );
//   await w.put("images/cover.png", fs.readFileSync("dummy.png"));
// }

function flatten(chapters) {
  const list = [];

  for (const c of chapters) {
    if (Array.isArray(c)) {
      list.push(...flatten(c));
    } else {
      list.push(c);
    }
  }
  return list;
}

async function pack(dir, writer) {
  const root = "epub/";
  const manifestPath = root + "content.opf";

  const { meta, chapters, images } = source.read(dir);

  await writer.put("mimetype", "application/epub+zip");
  await writer.put(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="utf-8"?>
    <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
            <rootfile full-path="${manifestPath}" media-type="application/oebps-package+xml"/>
        </rootfiles>
    </container>
    `
  );
  const flatChapters = flatten(chapters);
  await writer.put(manifestPath, manifest(flatChapters, images, meta));
  await writer.put(root + "toc.ncx", ncx(chapters));
  for (const chapter of flatChapters) {
    await writer.put(root + chapter.path, formatChapter(chapter));
  }
  for (const file of images) {
    await writer.put(root + file.path, file.content);
  }
}

function formatChapter(chapter) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <html
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      lang="en-GB"
      xml:lang="en-GB"
    >
      <head>
        <title>${chapter.title || ""}</title>
        <link href="../css/core.css" rel="stylesheet" type="text/css" />
      </head>
      <body>
      ${chapter.content}
      </body>
    </html>
    `;
  // Check that the xml is valid
  try {
    new xmldoc.XmlDocument(xml);
  } catch (e) {
    throw new Error(chapter.path + ": " + e.toString());
  }
  return xml;
}

function manifest(chapters, images, meta) {
  const cover = images.find(f => f.path.startsWith("images/cover."));
  const files = chapters.concat(images);

  // reference href="..." title="..." type="title-page text || bodymatter"
  return `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" dir="ltr" unique-identifier="uid" version="3.0" xml:lang="en-US">
        <metadata
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:opf="http://www.idpf.org/2007/opf"
            xmlns:dcterms="http://purl.org/dc/terms/"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            >
            ${cover ? `<meta name="cover" content="${cover.path}" />` : ""}
            <dc:title>${meta.title}</dc:title>
            <dc:language>${meta.language}</dc:language>
            <dc:creator>${meta.author}</dc:creator>
        </metadata>
        <manifest>
            <item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/>
            <item href="css/core.css" id="core.css" media-type="text/css"/>
            ${files
              .map(
                f => `
            <item href="${f.path}" id="${f.path}" media-type="${f.type}"/>`
              )
              .join("")}
        </manifest>
        <spine toc="ncx">
            ${chapters
              .map(
                c => `
            <itemref idref="${c.path}"/>`
              )
              .join("")}
        </spine>
        <guide>
            ${chapters
              .map(
                c =>
                  `
            <reference href="${c.path}" title="${c.title}" type="bodymatter"/>`
              )
              .join("")}
        </guide>
    </package>
    `;
}

function ncx(chapters) {
  /*
    <navPoint id="navpoint-1" playOrder="1">
        <navLabel>
            <text>Front</text>
        </navLabel>
        <navPoint id="navpoint-1" playOrder="1">
            <navLabel>
                <text>Front</text>
            </navLabel>
            <content src="text/title.xhtml"/>
        </navPoint>
    </navPoint>
    */

  return `<?xml version="1.0" encoding="utf-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="en-US">
        <head>
        </head>
        <docTitle>
            <text>Table of Contents</text>
        </docTitle>
        <navMap id="navmap">
            ${chapters.map(navPoint).join("\n")}
        </navMap>
    </ncx>
    `;
}

function navPoint(chapter) {
  if (Array.isArray(chapter)) {
    // Assume the first subchapter is the title.
    const [title, ...rest] = chapter;
    return `<navPoint id="navpoint-${title.path}">
          <navLabel>
            <text>${title.title}</text>
          </navLabel>
          <content src="${title.path}"/>
          ${rest.map(navPoint).join("\n")}
        </navPoint>`;
  }

  return `<navPoint id="navpoint-${chapter.path}">
    <navLabel>
        <text>${chapter.title}</text>
    </navLabel>
    <content src="${chapter.path}"/>
</navPoint>`;
}
