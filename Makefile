all: epub ui

epub:
	cd epub && make

ui:
	yarn rollup -c rollup.config.js
