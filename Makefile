all: epub-web

epub-node:
	node_modules/.bin/tsc --allowJs --outDir tmp/epub --esModuleInterop --incremental --tsBuildInfoFile tmp/epub/ts-build-info --target es2020 --module commonJs src/epub/index.ts

epub-web: epub-node
	node_modules/.bin/browserify tmp/epub/index.js --outfile bin/book.bin.js --standalone epub

ui:
	yarn rollup -c rollup.config.js

serve: epub-node epub-web ui
	yarn nodemon src/server/index.ts samples
