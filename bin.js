#!/usr/bin/env node
const $path = require("path");

// Input path arguments
const ARGS = process.argv.slice(2);

// directory from where script is running
const WORK_DIR = process.cwd();

// Checkfor input paths
if (ARGS.length === 0) {
	console.warn("No paths specified. Exiting...");
	return;
}

const args = ARGS;

// Just compile arg?
let justCompileIndex = args.indexOf("--just-compile");
const justCompile = justCompileIndex !== -1;

if (justCompile) {
	args.splice(justCompileIndex, 1); // Remove arg from paths
}

// Resolve directory names
const paths = args.map(path => $path.resolve(WORK_DIR, path));

const $watch = require("./index");

$watch.watch(paths, function(msg, type) {
	if (type === $watch.msgType.ERR) {
		console.error(msg);
	} else {
		console.log(msg);
	}
}, justCompile);
