const writers = require("./writers");
const source = require("./source");

const isChapter = f => f.type.startsWith("application/xhtml+xml");

// main();
build("source2");
async function build(name) {
  const w = writers.zip("_out.zip");
  await pack(name, w);
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

async function pack(dir, writer) {
  const root = "epub/";
  const manifestPath = root + "content.opf";

  const files = source.read(dir);

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
  await writer.put(manifestPath, manifest(files));
  await writer.put(root + "toc.ncx", ncx(files));

  for (const chapter of files.filter(isChapter)) {
    await writer.put(root + chapter.path, formatChapter(chapter));
  }

  for (const file of files.filter(f => !isChapter(f))) {
    await writer.put(root + file.path, file.content);
  }
}

function formatChapter(chapter) {
  return `<?xml version="1.0" encoding="utf-8"?>
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
}

function manifest(files) {
  const chapters = files.filter(isChapter);
  const cover = files.find(f => f.path.startsWith("images/cover."));

  // reference href="..." title="..." type="title-page text || bodymatter"
  return `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" dir="ltr" unique-identifier="uid" version="3.0" xml:lang="en-US">
        <metadata
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xmlns:opf="http://www.idpf.org/2007/opf"
            xmlns:dcterms="http://purl.org/dc/terms/"
            >
            ${cover ? `<meta name="cover" content="${cover.path}" />` : ""}
        </metadata>
        <manifest>
            <item href="toc.ncx" id="ncx" media-type="application/x-dtbncx+xml"/>
            <item href="css/core.css" id="core.css" media-type="text/css"/>
            ${files
              .map(
                f =>
                  `<item href="${f.path}" id="${f.path}" media-type="${
                    f.type
                  }"/>`
              )
              .join("\n")}
        </manifest>
        <spine toc="ncx">
            ${chapters.map(c => `<itemref idref="${c.path}"/>`).join("\n")}
        </spine>
        <guide>
            ${chapters
              .map(
                c =>
                  `<reference href="${c.path}" title="${
                    c.title
                  }" type="bodymatter"/>`
              )
              .join("\n")}
        </guide>
    </package>
    `;
}

function ncx(files) {
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

  const chapters = files.filter(isChapter);

  return `<?xml version="1.0" encoding="utf-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="en-US">
        <head>
        </head>
        <docTitle>
            <text>Table of Contents</text>
        </docTitle>
        <navMap id="navmap">
            ${chapters
              .filter(c => c.title)
              .map(
                (c, i) => `
            <navPoint id="navpoint-${i + 1}" playOrder="${i + 1}">
                <navLabel>
                    <text>${c.title}</text>
                </navLabel>
                <content src="${c.path}"/>
            </navPoint>`
              )
              .join("\n")}
        </navMap>
    </ncx>
    `;
}
