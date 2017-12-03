const fs = require('fs');
const zip = require('jszip');
const promisify = require('util').promisify;
const xml2js = require('xml2js');

const readFile = promisify(fs.readFile);

// Reads the file at the given path and returns a zip object.
async function loadZip(path) {
	const src = await readFile(path);
	const z = new zip();
	return z.loadAsync(src);
}

function parseXML(str, options = {}) {
	return new Promise(function(ok) {
		xml2js.parseString(str, options, function(err, data) {
			if (err) throw err;
			ok(data);
		})
	});
}

module.exports = class Book {
	constructor(filePath) {
		this.zip = loadZip(filePath);
	}

	async chapters() {
		// read package/spine
		// Convert a list of id references to a list of href values
		const hrefs = await this._refs();
		const data = await this._index();
		const parts = data.package.spine[0].itemref.map(ref => hrefs[ref.$['idref']]);
		return parts;
	}

	// Returns contents of a chapter.
	async chapter(href) {
		const z = await this.zip;
		return z.file(href).async("string");
	}

	// Reads the manifest and returns a dict with id=>href mapping.
	async _refs() {
		// Create a dictionary (id => href)
		// read package/manifest
		// 	while read ./item
		// 		read 'id', 'href'
		// 		$parts[id] = href
		let hrefs = {};
		const data = await this._index();
		data.package.manifest[0].item.forEach(function(item) {
			var {id, href} = item.$;
			hrefs[id] = href;
		});
		return hrefs;
	}

	// Returns parsed data from the container index.
	async _index() {
		if (this.__index) {
			return this.__index;
		}
		const z = await this.zip;
		const container = await z.file("META-INF/container.xml").async("string");
		const containerData = await parseXML(container)
		const rootFile = containerData.container.rootfiles[0].rootfile[0];
		if (rootFile.$["media-type"] != "application/oebps-package+xml") {
			throw new Error("Expected 'application/oebps-package+xml, got " + rootFile.$["media-type"]);
		}
		const contentPath = rootFile.$["full-path"];
		const src = await z.file(contentPath).async("string");
		const data = await parseXML(src);
		this.__index = data;
		return data;
	}
}